use tauri::{Manager, Emitter};
use std::process::{Command, Child, Stdio};
use std::fs;
use std::net::TcpStream;
use std::time::Duration;
use std::sync::Mutex;
use std::collections::HashSet;
use futures_util::stream::StreamExt;

const APP_DATA_DIR: &str = "/Users/SparkingAries/Library/Application Support/roadmap-manager";
const OPENCODE_PORT: u16 = 51466;

fn setup_panic_hook() {
    std::panic::set_hook(Box::new(|panic_info| {
        let msg = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        let location = if let Some(loc) = panic_info.location() {
            format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
        } else {
            "unknown location".to_string()
        };

        eprintln!("PANIC at {}: {}", location, msg);
    }));
}

struct AppState {
    processed_events: Mutex<HashSet<String>>,
}

fn get_roadmap_path() -> std::path::PathBuf {
    std::path::Path::new(APP_DATA_DIR).join("roadmap.md")
}

fn is_port_available(port: u16) -> bool {
    let addr = format!("127.0.0.1:{}", port);
    TcpStream::connect_timeout(&addr.parse().unwrap(), Duration::from_millis(500)).is_err()
}

fn start_opencode_server() -> Result<Option<Child>, String> {
    if !is_port_available(OPENCODE_PORT) {
        println!("OpenCode server already running on port {}", OPENCODE_PORT);
        return Ok(None);
    }

    let app_data_dir = APP_DATA_DIR;
    let _ = fs::create_dir_all(app_data_dir);

    let cmd = format!(
        "cd '{}' && opencode serve --port {} &",
        app_data_dir, OPENCODE_PORT
    );

    let child = Command::new("sh")
        .args(["-c", &cmd])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start OpenCode server: {}", e))?;

    std::thread::sleep(Duration::from_secs(2));
    println!("OpenCode server started on port {}", OPENCODE_PORT);
    Ok(Some(child))
}

fn stop_opencode_server() {
    let _ = Command::new("lsof")
        .args(["-ti", &format!(":{}", OPENCODE_PORT)])
        .output()
        .map(|output| {
            if output.status.success() {
                let pid = String::from_utf8_lossy(&output.stdout);
                if !pid.trim().is_empty() {
                    let _ = Command::new("kill")
                        .arg(pid.trim())
                        .output();
                    println!("OpenCode server stopped");
                }
            }
        });
}

#[derive(serde::Deserialize)]
struct ModelInfo {
    #[serde(rename = "providerID")]
    provider_id: String,
    #[serde(rename = "modelID")]
    model_id: String,
}

#[tauri::command]
async fn execute_navigate(
    prompt: String,
    session_id: Option<String>,
    model: Option<ModelInfo>,
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{}/api/execute-navigate", OPENCODE_PORT);

    let mut request_body = serde_json::json!({ "prompt": prompt });
    
    if let Some(ref sid) = session_id {
        request_body["sessionId"] = serde_json::json!(sid);
    }
    
    if let Some(ref m) = model {
        request_body["model"] = serde_json::json!({
            "providerID": m.provider_id,
            "modelID": m.model_id
        });
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client.post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to execute navigate: {}", e))?;

    if !response.status().is_success() {
        let error = response.text().await.unwrap_or_default();
        return Err(format!("Execute failed: {}", error));
    }

    let mut event_counter: u64 = 0;

    let reader = response.bytes_stream();
    tokio::pin!(reader);

    while let Some(chunk) = reader.next().await {
        let mut processed_events_guard = match state.processed_events.lock() {
            Ok(guard) => guard,
            Err(e) => return Err(e.to_string()),
        };

        match chunk {
            Ok(bytes) => {
                if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                    let lines = text.split('\n');
                    
                    for line in lines {
                        if !line.trim().starts_with("data: ") {
                            continue;
                        }
                        
                        if let Ok(data) = serde_json::from_str::<serde_json::Value>(line.trim().strip_prefix("data: ").unwrap_or("")) {
                            let event_type = data.get("type").and_then(|v| v.as_str()).unwrap_or("");
                            let event_id = data.get("id")
                                .and_then(|v| v.as_str())
                                .map(String::from)
                                .unwrap_or_else(|| format!("{}-{}-{}", event_type, session_id.as_deref().unwrap_or(""), event_counter));
                            
                            if processed_events_guard.contains(&event_id) {
                                continue;
                            }
                            processed_events_guard.insert(event_id.clone());
                            event_counter += 1;
                            
                            let _ = window.emit("execute-navigate-event", data);
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Error reading stream: {}", e);
                break;
            }
        }
    }

    let _ = window.emit("execute-navigate-done", serde_json::json!({}));

    Ok(())
}

#[tauri::command]
async fn execute_modal_prompt(
    prompt: String,
    session_id: Option<String>,
    model: Option<ModelInfo>,
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{}/api/execute-modal-prompt", OPENCODE_PORT);

    let mut request_body = serde_json::json!({ "prompt": prompt });
    
    if let Some(ref sid) = session_id {
        request_body["sessionId"] = serde_json::json!(sid);
    }
    
    if let Some(ref m) = model {
        request_body["model"] = serde_json::json!({
            "providerID": m.provider_id,
            "modelID": m.model_id
        });
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client.post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to execute modal prompt: {}", e))?;

    if !response.status().is_success() {
        let error = response.text().await.unwrap_or_default();
        return Err(format!("Execute failed: {}", error));
    }

    let mut event_counter: u64 = 0;

    let reader = response.bytes_stream();
    tokio::pin!(reader);

    while let Some(chunk) = reader.next().await {
        let mut processed_events_guard = match state.processed_events.lock() {
            Ok(guard) => guard,
            Err(e) => return Err(e.to_string()),
        };

        match chunk {
            Ok(bytes) => {
                if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                    let lines = text.split('\n');
                    
                    for line in lines {
                        if !line.trim().starts_with("data: ") {
                            continue;
                        }
                        
                        if let Ok(data) = serde_json::from_str::<serde_json::Value>(line.trim().strip_prefix("data: ").unwrap_or("")) {
                            let event_type = data.get("type").and_then(|v| v.as_str()).unwrap_or("");
                            let event_id = data.get("id")
                                .and_then(|v| v.as_str())
                                .map(String::from)
                                .unwrap_or_else(|| format!("modal-{}-{}-{}", event_type, session_id.as_deref().unwrap_or(""), event_counter));
                            
                            if processed_events_guard.contains(&event_id) {
                                continue;
                            }
                            processed_events_guard.insert(event_id.clone());
                            event_counter += 1;
                            
                            let _ = window.emit("execute-modal-prompt-event", data);
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Error reading stream: {}", e);
                break;
            }
        }
    }

    let _ = window.emit("execute-modal-prompt-done", serde_json::json!({}));

    Ok(())
}

#[tauri::command]
async fn read_roadmap() -> Result<String, String> {
    let roadmap_path = get_roadmap_path();

    if roadmap_path.exists() {
        fs::read_to_string(&roadmap_path).map_err(|e| e.to_string())
    } else {
        Ok("# Roadmap\n\n".to_string())
    }
}

#[tauri::command]
async fn write_roadmap(content: String) -> Result<(), String> {
    let roadmap_path = get_roadmap_path();

    if let Some(parent) = roadmap_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::write(&roadmap_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_sessions() -> Result<Vec<serde_json::Value>, String> {
    let url = format!("http://127.0.0.1:{}/session", OPENCODE_PORT);

    let client = reqwest::Client::new();
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to OpenCode server: {}", e))?;

    let data: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let sessions = if let Some(s) = data.get("sessions").and_then(|s| s.as_array()) {
        s.clone()
    } else if let Some(s) = data.as_array() {
        s.clone()
    } else {
        vec![]
    };

    let project_dir = APP_DATA_DIR;

    let filtered: Vec<serde_json::Value> = sessions.into_iter()
        .filter(|s| {
            let dir = s.get("directory").and_then(|d| d.as_str()).unwrap_or("");
            let title = s.get("title").and_then(|t| t.as_str()).unwrap_or("");
            let parent_id = s.get("parentID");

            dir == project_dir &&
            parent_id.is_none() &&
            !title.contains("@subagent") &&
            !title.starts_with("modal-prompt:")
        })
        .collect();

    Ok(filtered)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    setup_panic_hook();

    tauri::Builder::default()
        .manage(AppState {
            processed_events: Mutex::new(HashSet::new()),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            execute_navigate,
            execute_modal_prompt,
            read_roadmap,
            write_roadmap,
            get_sessions
        ])
        .setup(|app| {
            match start_opencode_server() {
                Ok(_) => {
                    println!("OpenCode server ready on port {}", OPENCODE_PORT);
                }
                Err(e) => {
                    eprintln!("Warning: Failed to start OpenCode server: {}", e);
                }
            }

            let window = app.get_webview_window("main").unwrap();

            window.on_menu_event(move |_window, event| {
                if event.id().0.as_str() == "quit" {
                    stop_opencode_server();
                    let _ = _window.close();
                }
            });

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                stop_opencode_server();
                let _ = window.close();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
