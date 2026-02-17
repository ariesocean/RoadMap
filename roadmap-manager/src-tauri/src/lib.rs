use tauri::Manager;
use std::process::{Command, Child, Stdio};
use std::fs;
use std::net::TcpStream;
use std::time::Duration;

const APP_DATA_DIR: &str = "/Users/SparkingAries/Library/Application Support/roadmap-manager.app";
const OPENCODE_PORT: u16 = 51466;

fn is_dev_mode() -> bool {
    std::env::var("TAURI_DEBUG").is_ok()
}

fn get_roadmap_path() -> std::path::PathBuf {
    if is_dev_mode() {
        std::path::Path::new("/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md").to_path_buf()
    } else {
        std::path::Path::new(APP_DATA_DIR).join("roadmap.md")
    }
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

#[tauri::command]
async fn execute_navigate(prompt: String) -> Result<String, String> {
    let url = format!("http://127.0.0.1:{}/api/execute-navigate", OPENCODE_PORT);

    let client = reqwest::Client::new();
    let response = client.post(&url)
        .json(&serde_json::json!({ "prompt": prompt }))
        .send()
        .await
        .map_err(|e| format!("Failed to execute navigate: {}", e))?;

    if response.status().is_success() {
        Ok("Command executed successfully".to_string())
    } else {
        let error = response.text().await.unwrap_or_default();
        Err(format!("Execute failed: {}", error))
    }
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

    let project_dir = if is_dev_mode() {
        "/Users/SparkingAries/VibeProjects/RoadMap"
    } else {
        APP_DATA_DIR
    };

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
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            execute_navigate,
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
