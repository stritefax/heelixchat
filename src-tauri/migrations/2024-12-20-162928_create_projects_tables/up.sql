CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects_activities (
    project_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    full_document_text TEXT NOT NULL DEFAULT '',
    document_name TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (project_id, activity_id)
);