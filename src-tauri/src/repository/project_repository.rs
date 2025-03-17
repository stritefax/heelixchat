use crate::entity::project::Project;
use rusqlite::{named_params, params, Connection};

pub fn delete_project(conn: &Connection, project_id: i64) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM projects WHERE id = ?1", params![project_id])?;
    delete_project_activities(conn, project_id)?;
    Ok(())
}

pub fn delete_project_activities(
    conn: &Connection,
    project_id: i64,
) -> Result<(), rusqlite::Error> {
    conn.execute(
        "DELETE FROM projects_activities WHERE project_id = ?1",
        params![project_id],
    )?;
    Ok(())
}

pub fn update_project(
    conn: &Connection,
    project_id: i64,
    name: &str,
    activities: &Vec<i64>,
) -> Result<(), rusqlite::Error> {
    delete_project_activities(conn, project_id)?;
    conn.execute(
        "UPDATE projects SET name = ?1 WHERE id = ?2",
        params![name, project_id],
    )?;
    add_project_activities(conn, project_id, activities)?;
    Ok(())
}

pub fn save_project(
    conn: &Connection,
    name: &str,
    activities: &Vec<i64>,
) -> Result<(), rusqlite::Error> {
    let mut statement = conn.prepare("INSERT INTO projects (name) VALUES (@name)")?;

    statement.execute(named_params! {
        "@name": name
    })?;
    let project_id = conn.last_insert_rowid();

    add_project_activities(conn, project_id, activities)?;
    Ok(())
}

pub fn add_project_activities(
    conn: &Connection,
    project_id: i64,
    activity_ids: &Vec<i64>,
) -> Result<(), rusqlite::Error> {
    let mut stmt = conn.prepare(
        "INSERT INTO projects_activities (project_id, activity_id, document_name, full_document_text)
         SELECT ?1, id, COALESCE(window_title, 'Document ' || id), edited_full_text
         FROM activity_full_text
         WHERE id = ?2"
    )?;

    for &activity_id in activity_ids {
        stmt.execute(params![project_id, activity_id])?;
    }
    Ok(())
}

pub fn fetch_all_projects(conn: &Connection) -> Result<Vec<Project>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM projects")?;
    let project_iter = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            activities: Vec::new(),
            activity_ids: Vec::new(),
            activity_names: Vec::new(),
            created_at: row.get(2)?,
        })
    })?;

    let mut projects = Vec::new();
    for project in project_iter {
        let mut project = project?;
        let (ids, activity_ids, names) = fetch_activities_by_project_id(conn, project.id)?;
        project.activities = ids;
        project.activity_ids = activity_ids;
        project.activity_names = names;
        projects.push(project);
    }

    Ok(projects)
}

pub fn fetch_activities_by_project_id(
    conn: &Connection,
    project_id: i64,
) -> Result<(Vec<i64>, Vec<Option<i64>>, Vec<String>), rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT pa.id, pa.activity_id, pa.document_name
         FROM projects_activities pa
         WHERE pa.project_id = ?1
         ORDER BY pa.id"
    )?;

    let rows = stmt.query_map(params![project_id], |row| {
        Ok((
            row.get::<_, i64>("id")?,
            row.get::<_, Option<i64>>("activity_id")?,
            row.get::<_, String>("document_name")?,
        ))
    })?;

    let mut ids = Vec::new();
    let mut activity_ids = Vec::new();
    let mut names = Vec::new();

    for row in rows {
        let (id, activity_id, name) = row?;
        ids.push(id);
        activity_ids.push(activity_id);
        names.push(name);
    }

    Ok((ids, activity_ids, names))
}

pub fn get_activity_text_from_project(
    conn: &Connection,
    project_id: i64,
    activity_id: i64,
) -> Result<String, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT full_document_text 
         FROM projects_activities 
         WHERE project_id = ?1 AND id = ?2"  // Use id but keep activity_id in the interface
    )?;
    
    stmt.query_row(params![project_id, activity_id], |row| row.get(0))
}

pub fn update_activity_text(
    conn: &Connection,
    activity_id: i64,
    text: &str,
) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE projects_activities SET full_document_text = ?1 WHERE id = ?2",
        params![text, activity_id],
    )?;
    Ok(())
}

pub fn update_activity_name(
    conn: &Connection,
    activity_id: i64,
    name: &str,
) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE projects_activities SET document_name = ?1 WHERE id = ?2",
        params![name, activity_id],
    )?;
    Ok(())
}

pub fn add_blank_document(
    conn: &Connection,
    project_id: i64,
) -> Result<i64, rusqlite::Error> {
    conn.execute(
        "INSERT INTO projects_activities (project_id, document_name, full_document_text) 
         VALUES (?1, ?2, ?3)",
        params![project_id, "New Document", "Start editing"],
    )?;
    Ok(conn.last_insert_rowid())
}