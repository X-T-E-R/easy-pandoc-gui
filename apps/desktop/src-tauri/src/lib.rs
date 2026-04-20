mod backend;

use backend::{
  check_for_update, export_document, install_update, load_document, run_doctor,
  PendingUpdate,
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      #[cfg(desktop)]
      {
        app
          .handle()
          .plugin(tauri_plugin_updater::Builder::new().build())?;
        app.manage(PendingUpdate::default());
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      load_document,
      export_document,
      run_doctor,
      check_for_update,
      install_update
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
