use tauri::Manager;
use std::fs;

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
        .invoke_handler(tauri::generate_handler![toggle_subtask])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            window.on_menu_event(move |event| {
                if event.menu_item_id() == "quit" {
                    window.close().unwrap();
                }
            });

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
