use rusqlite::{Connection, named_params, params};
use rusqlite_from_row::FromRow;

use crate::entity::permission::Permission;

static TABLE_NAME: &str = "permissions";

pub fn update_permission(
    db: &Connection,
    app_path: String,
    allow: bool,
) -> Result<(), rusqlite::Error> {
    let update_statement_query = format!(
        "UPDATE {}
    SET
    allow = :allow
    WHERE app_path = :app_path;",
        TABLE_NAME
    );
    let mut update_statement = db.prepare(&update_statement_query)?;

    update_statement.execute(named_params! {
        ":app_path": app_path,
        ":allow": allow,
    })?;
    Ok(())
}

pub fn insert_permission(db: &Connection, permission: Permission) -> Result<(), rusqlite::Error> {
    let insert_statement_query = format!(
        "INSERT INTO {} (app_path, app_name, icon_path, allow)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(app_path) DO NOTHING;",
        TABLE_NAME
    );
    let mut insert_statement = db.prepare(&insert_statement_query)?;

    insert_statement.execute(params![
        permission.app_path,
        permission.app_name,
        permission.icon_path,
        permission.allow,
    ])?;

    // let update_statement_query = format!(
    //     "UPDATE {}
    // SET
    // app_name = :app_name,
    // icon_path = :icon_path,
    // allow = :allow,
    // WHERE app_path = :app_path;",
    //     TABLE_NAME
    // );
    // let mut update_statement = db.prepare(&update_statement_query)?;

    // update_statement.execute(named_params! {
    //     ":app_path": permission.app_path,
    //     ":app_name": permission.app_name,
    //     ":icon_path": permission.icon_path,
    //     ":allow": permission.allow,
    // })?;
    Ok(())
}

pub fn get_permissions(db: &Connection) -> Result<Vec<Permission>, rusqlite::Error> {
    let query: String = format!("SELECT * FROM {}", TABLE_NAME);
    let mut statement = db.prepare(&query)?;
    let mut rows = statement.query([])?;
    let mut permissions: Vec<Permission> = Vec::new();
    while let Some(row) = rows.next()? {
        permissions.push(Permission {
            app_path: row.get("app_path")?,
            app_name: row.get("app_name")?,
            icon_path: row.get("icon_path")?,
            allow: row.get("allow")?,
        });
    }

    Ok(permissions)
}

pub fn get_permission_by_app_name(db: &Connection,
                                  app_name: &str) -> Result<Permission, rusqlite::Error> {
    let row = db.query_row(&format!("SELECT * FROM {} WHERE app_name = @app_name LIMIT 1",
                                    TABLE_NAME),
                           named_params! {
                                "@app_name": app_name,
                           },
                           Permission::try_from_row).unwrap_or(
        Permission {
            app_path: "".to_string(),
            app_name: "".to_string(),
            icon_path: "".to_string(),
            allow: true,
        });
    return Ok(row);
}