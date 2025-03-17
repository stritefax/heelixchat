use std::error::Error;

use chrono::Local;
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use rusqlite::{named_params, Connection};
use rusqlite_from_row::FromRow;
use std::collections::HashSet;

use crate::configuration::database::SyncVectorDatabase;
use crate::entity::activity_item::ActivityItem;

pub fn save_activity_item(
    activity_item: &ActivityItem,
    db: &Connection,
) -> Result<(), rusqlite::Error> {
    let mut statement = db.prepare("INSERT INTO activity_logs
    (timestamp, user_id, ocr_text, window_title,
    window_app_name, os_details, similarity_percentage_to_previous_ocr_text, keypress_count,
     full_activity_text, interval_length, editing_mode, element_tree_dump, detected_actions, original_ocr_text)
     VALUES (@timestamp, @user_id, @ocr_text, @window_title, @window_app_name, @os_details,
     @similarity_percentage_to_previous_ocr_text, @keypress_count,
     @full_activity_text, @interval_length, @editing_mode, @element_tree_dump, @detected_actions, @original_ocr_text)")?;

    statement.execute(named_params! {
        "@timestamp": activity_item.timestamp,
        "@user_id": activity_item.user_id,
        "@ocr_text": activity_item.ocr_text,
        "@full_activity_text": activity_item.full_activity_text,
        "@editing_mode": activity_item.editing_mode,
        "@original_ocr_text": activity_item.original_ocr_text,
        "@window_title": activity_item.window_title,
        "@window_app_name": activity_item.window_app_name,
        "@os_details": activity_item.os_details,
        "@similarity_percentage_to_previous_ocr_text": activity_item.similarity_percentage_to_previous_ocr_text,
        "@keypress_count": activity_item.keypress_count,
        "@interval_length": activity_item.interval_length,
        "@element_tree_dump": activity_item.element_tree_dump,
        "@detected_actions": activity_item.detected_actions,
    })?;
    Ok(())
}

pub fn save_activity_full_text(
    activity_item: &ActivityItem,
    db: &Connection,
) -> Result<Option<i64>, Box<dyn Error>> {
    // First, try to update an existing row in the SQLite database
    let mut update_statement = db.prepare(
        "
        UPDATE activity_full_text
        SET dateofentry = datetime('now'),
            edited_full_text = @activity_full_text,
            save_count = save_count + 1
        WHERE window_title = @window_title
          AND window_app_name = @window_app_name;
    ",
    )?;

    let rows_affected = update_statement.execute(named_params![
        "@window_title": &activity_item.window_title,
        "@window_app_name": &activity_item.window_app_name,
        "@activity_full_text": &activity_item.full_activity_text,
    ])?;

    // If no rows were updated, insert a new row
    if rows_affected == 0 {
        let mut insert_statement = db.prepare("
            INSERT INTO activity_full_text (dateofentry, window_title, window_app_name, original_full_text, edited_full_text)
            VALUES (datetime('now'), @window_title, @window_app_name, @activity_full_text, @activity_full_text);
        ")?;

        insert_statement.execute(named_params![
            "@window_title": &activity_item.window_title,
            "@window_app_name": &activity_item.window_app_name,
            "@activity_full_text": &activity_item.full_activity_text,
        ])?;
    }

    // Check if the save_count is exactly 3 and retrieve the rowid
    let (save_count, rowid): (i64, i64) = db.query_row(
        "SELECT save_count, rowid
         FROM activity_full_text
         WHERE window_title = ?1
             AND window_app_name = ?2",
        &[&activity_item.window_title, &activity_item.window_app_name],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    if save_count == 2 {
        return Ok(Some(rowid));
    }

    Ok(None)
}
pub async fn save_activity_full_text_into_vector_db(
    oasys_db: &SyncVectorDatabase,
    activity_item: &ActivityItem,
    last_insert_rowid: i64,
    api_key: &str,
) -> Result<(), Box<dyn Error>> {
    let id = last_insert_rowid;
    let max_length = 5000;
    let truncated_text = if activity_item.full_activity_text.len() > max_length {
        &activity_item.full_activity_text[..max_length]
    } else {
        &activity_item.full_activity_text
    };

    // Add the window_title to the beginning and end of the truncated_text
    let amplified_text = format!(
        "Document Title: [{}] {} Document Title: [{}]",
        activity_item.window_title, truncated_text, activity_item.window_title
    );

    let mut db_guard = oasys_db.lock().await;
    let db = db_guard.as_mut().expect("Database initialization failed!");
    db.add(id, &amplified_text, api_key).await?;
    db.sync().await?;
    Ok(())
}

pub fn get_all_activity_logs(db: &Connection) -> Result<Vec<ActivityItem>, rusqlite::Error> {
    let mut statement = db.prepare(
        "SELECT * FROM activity_logs
    WHERE strftime('%Y-%m-%d', timestamp) = date('now')",
    )?;
    let mut rows = statement.query([])?;
    let mut activity_logs: Vec<ActivityItem> = Vec::new();
    while let Some(row) = rows.next()? {
        activity_logs.push(ActivityItem {
           // id: row.get("id")?,
            timestamp: row.get("timestamp")?,
            ocr_text: row.get("ocr_text")?,
            full_activity_text: row.get("full_activity_text")?,
            editing_mode: row.get("editing_mode")?,
            original_ocr_text: row.get("original_ocr_text")?,
            window_title: row.get("window_title")?,
            window_app_name: row.get("window_app_name")?,
            user_id: row.get("user_id")?,
            os_details: row.get("os_details")?,
            similarity_percentage_to_previous_ocr_text: row
                .get("similarity_percentage_to_previous_ocr_text")?,
            interval_length: row.get("interval_length").unwrap_or(0),
            keypress_count: row.get("keypress_count").unwrap_or(0),
            element_tree_dump: row.get("element_tree_dump")?,
            detected_actions: row.get("detected_actions")?,
        });
    }

    Ok(activity_logs)
}

pub fn get_latest_activity_log_item_with_same_window(
    db: &Connection,
    window_title: &str,
    window_app_name: &str,
) -> Result<Option<ActivityItem>, rusqlite::Error> {
    let query = "SELECT * FROM activity_logs
                 WHERE window_title = :window_title
                 AND window_app_name = :window_app_name
                 AND strftime('%Y-%m-%d', timestamp) = date('now')
                 ORDER BY timestamp DESC LIMIT 1";
    let result = db.query_row(
        query,
        named_params! {
            ":window_title": window_title,
            ":window_app_name": window_app_name,
        },
        ActivityItem::try_from_row,
    );

    match result {
        Ok(activity_item) => Ok(Some(activity_item)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_latest_activity_log_item(db: &Connection) -> Result<ActivityItem, rusqlite::Error> {
    let row = db
        .query_row(
            "SELECT * FROM activity_logs WHERE strftime('%Y-%m-%d', timestamp) = date('now')
    ORDER BY timestamp DESC LIMIT 1",
            [],
            ActivityItem::try_from_row,
        )
        .unwrap_or(get_empty_activity_item());
    return Ok(row);
}

pub fn get_empty_activity_item() -> ActivityItem {
    ActivityItem {
       // id: 0,
        timestamp: Local::now().to_rfc3339(),
        user_id: "/".to_string(),
        window_title: "/".to_string(),
        window_app_name: "/".to_string(),
        ocr_text: "/".to_string(),
        full_activity_text: "/".to_string(),
        editing_mode: "/".to_string(),
        original_ocr_text: "/".to_string(),
        interval_length: 20,
        os_details: "/".to_string(),
        similarity_percentage_to_previous_ocr_text: "0".to_string(),
        keypress_count: 0,
        element_tree_dump: "/".to_string(),
        detected_actions: "/".to_string(),
    }
}

pub fn get_activity_full_text_by_id(
    db: &Connection,
    id: i64,
    max_length: Option<usize>,
) -> Result<Option<(String, String)>, rusqlite::Error> {
    let query = "SELECT window_title, edited_full_text, dateofentry FROM activity_full_text WHERE rowid = ?";
    let result = db.query_row(query, &[&id], |row| {
        let window_title: String = row.get(0)?;
        let edited_full_text: String = row.get(1)?;
        let dateofentry: String = row.get(2)?;
        Ok((window_title, edited_full_text, dateofentry))
    });

    match result {
        Ok((window_title, edited_full_text, dateofentry)) => {
            let truncated_text = match max_length {
                Some(length) => edited_full_text.chars().take(length).collect::<String>(),
                None => edited_full_text,
            };

            let full_text = format!(
                "Document Title: {}\nDate of Entry: {}\n\n{}",
                window_title, dateofentry, truncated_text
            );
            Ok(Some((window_title, full_text)))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_additional_ids_from_sql_db(
    db: &Connection,
    num_recent_entries: usize,
    keywords: &[String],
) -> Result<Vec<i64>, Box<dyn Error>> {
    let matcher = SkimMatcherV2::default();
    let mut stmt = db.prepare(
        "SELECT id, window_title
         FROM activity_full_text
         ORDER BY dateofentry DESC
         LIMIT 500",
    )?;

    let rows: Vec<(i64, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get::<_, String>(1)?)))?
        .collect::<Result<_, _>>()?;

    let mut top_ids: HashSet<i64> = HashSet::new();

    for keyword in keywords {
        let mut best_match = None;
        let mut best_score = 0;

        for (id, title) in &rows {
            if let Some(score) = matcher.fuzzy_match(&title, keyword) {
                if score > best_score {
                    best_score = score;
                    best_match = Some(*id);
                }
            }
        }

        if let Some(id) = best_match {
            top_ids.insert(id);
        }
    }

    // Get the most recent entries
    let mut recent_entries_stmt =
        db.prepare("SELECT id FROM activity_full_text ORDER BY dateofentry DESC LIMIT ?")?;
    let recent_entries = recent_entries_stmt.query_map([num_recent_entries], |row| row.get(0))?;
    for entry in recent_entries {
        top_ids.insert(entry?);
    }

    Ok(top_ids.into_iter().collect())
}
pub fn get_activity_history(
    db: &Connection,
    offset: usize,
    limit: usize,
) -> Result<Vec<(i64, String, String)>, rusqlite::Error> {
    let query = "SELECT id, window_title, dateofentry
                 FROM activity_full_text
                 WHERE window_title != '' AND dateofentry != ''
                 ORDER BY dateofentry DESC
                 LIMIT ? OFFSET ?";

    let mut stmt = db.prepare(query)?;
    let rows = stmt.query_map([limit, offset], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    })?;

    rows.collect()
}

pub fn delete_activity(db: &Connection, id: i64) -> Result<bool, rusqlite::Error> {
    let query = "UPDATE activity_full_text 
                 SET dateofentry = '', window_title = '', window_app_name = '',
                     original_full_text = '', edited_full_text = '' 
                 WHERE rowid = ?";
    let result = db.execute(query, &[&id])?;

    Ok(result > 0)
}
