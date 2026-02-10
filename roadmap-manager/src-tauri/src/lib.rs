use tauri::Manager;
use std::process::Command;
use std::fs;

#[tauri::command]
async fn execute_navigate(prompt: String) -> Result<String, String> {
    let output = Command::new("opencode")
        .args(["run", &format!("navigate: {}", prompt)])
        .output()
        .map_err(|e| e.to_string())?;
    
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if !output.status.success() {
        return Err(format!("Command failed: {}", stderr));
    }
    
    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
async fn toggle_subtask(task_id: String, subtask_id: String) -> Result<(), String> {
    let content = fs::read_to_string("/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md")
        .map_err(|e| e.to_string())?;
    
    let new_content = content.replace(&format!("[ ] {}", subtask_id), &format!("[x] {}", subtask_id));
    
    if content != new_content {
        fs::write("/Users/SparkingAries/VibeProjects/RoadMap/roadmap.md", new_content)
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![execute_navigate, toggle_subtask])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
