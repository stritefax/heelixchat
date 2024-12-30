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
        "INSERT INTO projects_activities (project_id, activity_id, document_name) 
         SELECT ?1, id, COALESCE(window_title, 'Document ' || id) 
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
            created_at: row.get(2)?,
        })
    })?;

    let mut projects = Vec::new();
    for project in project_iter {
        let mut project = project?;
        project.activities = fetch_activities_by_project_id(conn, project.id)?;
        projects.push(project);
    }

    return Ok(projects);
}

// Define a function to fetch activities by project ID
pub fn fetch_activities_by_project_id(
    conn: &Connection,
    project_id: i64,
) -> Result<Vec<i64>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT a.id \
         FROM projects_activities pa \
         INNER JOIN activity_full_text a ON pa.activity_id = a.id \
         WHERE pa.project_id = ?1",
    )?;
    let activity_iter = stmt.query_map(params![project_id], |row| Ok(row.get("id")?))?;

    let mut activities = Vec::new();
    for activity in activity_iter {
        activities.push(activity?);
    }

    Ok(activities)
}
