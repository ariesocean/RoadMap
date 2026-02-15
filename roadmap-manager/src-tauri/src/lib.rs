use tauri::Manager;
use std::process::{Command, Child, Stdio};
use std::fs;
use std::sync::Mutex;
use std::time::Duration;

struct AppState {
    opencode_process: Option<Child>,
}

impl Default for AppState {
    fn default() -> Self {
        Self { opencode_process: None }
    }
}

#[tauri::command]
async fn toggle_subtask(subtask_id: String) -> Result<(), String> {
    let content = fs::read_to_string("/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md")
        .map_err(|e| e.to_string())?;

    let new_content = content.replace(&format!("[ ] {}", subtask_id), &format!("[x] {}", subtask_id));

    if content != new_content {
        fs::write("/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md", new_content)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn execute_navigate(prompt: String) -> Result<String, String> {
    let mut child = Command::new("opencode")
        .args(["run", &format!("use skill navigate: {}", prompt)])
        .current_dir("/Users/SparkingAries/VibeProjects/RoadMap")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let (tx, rx) = std::sync::mpsc::channel();
    let _child_id = child.id();

    let _ = std::thread::spawn(move || {
        let status = child.wait();
        let mut stdout = String::new();
        let _ = child.stdout.take().unwrap().read_to_string(&mut stdout);
        let mut stderr = String::new();
        let _ = child.stderr.take().unwrap().read_to_string(&mut stderr);
        let _ = tx.send((status, stdout, stderr));
    });

    let result = rx.recv_timeout(Duration::from_secs(60));

    match result {
        Ok((status, stdout, stderr)) => {
            if status.map(|s| s.success()).unwrap_or(false) {
                Ok(format!("{}{}", stdout, stderr))
            } else {
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(_) => {
            let _ = child.kill();
            let _ = child.wait();
            Err("Command timed out after 60 seconds".to_string())
        }
    }
}

fn start_opencode() -> Result<Child, String> {
    Command::new("opencode")
        .args(["--hostname", "127.0.0.1", "--port", "4096", "--continue"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start opencode: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Mutex::new(AppState::default());

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![toggle_subtask, execute_navigate])
        .manage(app_state)
        .setup(|app| {
            let app_handle = app.handle();

            match start_opencode() {
                Ok(child) => {
                    let mut state = app.state::<Mutex<AppState>>().lock().unwrap();
                    state.opencode_process = Some(child);
                    println!("OpenCode server started successfully");
                }
                Err(e) => {
                    eprintln!("Warning: Failed to start opencode: {}", e);
                }
            }

            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();

            window.on_menu_event(move |event| {
                if event.menu_item_id() == "quit" {
                    let mut state = app_handle.state::<Mutex<AppState>>().lock().unwrap();
                    if let Some(mut child) = state.opencode_process.take() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                    let _ = window_clone.close();
                }
            });

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                let app_handle = event.window().app_handle();
                let mut state = app_handle.state::<Mutex<AppState>>().lock().unwrap();
                if let Some(mut child) = state.opencode_process.take() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
                api.close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
