CREATE TABLE IF NOT EXISTS activity_logs (
    timestamp TEXT NOT NULL DEFAULT '',
    detected_actions TEXT NOT NULL DEFAULT '',
    element_tree_dump TEXT NOT NULL DEFAULT '',
    editing_mode TEXT,
    ocr_text TEXT NOT NULL DEFAULT '',
    full_activity_text TEXT,
    original_ocr_text TEXT,
    os_details TEXT NOT NULL DEFAULT '',
    user_id TEXT NOT NULL DEFAULT '',
    window_title TEXT NOT NULL DEFAULT '',
    window_app_name TEXT NOT NULL DEFAULT '',
    similarity_percentage_to_previous_ocr_text TEXT NOT NULL DEFAULT '',
    interval_length INTEGER,
    keypress_count INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key TEXT NOT NULL PRIMARY KEY DEFAULT '',
    setting_value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS keypress_logs (timestamp TEXT NOT NULL DEFAULT '');

CREATE TABLE IF NOT EXISTS activity_full_text (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dateofentry TEXT NOT NULL DEFAULT '',
    window_title TEXT NOT NULL DEFAULT '',
    window_app_name TEXT NOT NULL DEFAULT '',
    original_full_text TEXT NOT NULL DEFAULT '',
    edited_full_text TEXT NOT NULL DEFAULT '',
    save_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissions (
    app_path TEXT NOT NULL PRIMARY KEY DEFAULT '',
    app_name TEXT NOT NULL DEFAULT '',
    icon_path TEXT NOT NULL DEFAULT '',
    allow BOOLEAN NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects_activities (
    project_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, activity_id)
);