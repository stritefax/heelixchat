/* use diesel::prelude::*;
use rusqlite::{Connection, named_params};
use crate::entity::keypress_log::KeypressLog;

pub fn insert_keypress_log(db: &Connection, keypress: KeypressLog) -> Result<(), rusqlite::Error> {
    let mut insert_statement = db.prepare("
    INSERT INTO keypress_logs(timestamp)
    VALUES (@timestamp)")?;

    insert_statement.execute(named_params! {
        "@timestamp": keypress.timestamp,
    })?;

    Ok(())
}

pub fn get_count_of_keypress_on_last_interval(db: &Connection, timestamp: String) -> Result<u32, rusqlite::Error> {
    let mut statement = db.prepare("SELECT * FROM keypress_logs
    WHERE datetime(timestamp) > datetime(@timestamp_1, '-20 seconds')
    AND datetime(timestamp) < datetime(@timestamp_2) ;
")?;
    let mut rows = statement.query(named_params! {
        "@timestamp_1": timestamp,
        "@timestamp_2": timestamp
    })?;
    let mut keypress_list: Vec<KeypressLog> = Vec::new();
    while let Some(row) = rows.next()? {
        keypress_list.push(KeypressLog {
            timestamp:  row.get("timestamp")?,
        });
    }
    Ok(keypress_list.len() as u32)
}

pub fn clean_older_keypress_logs(db: &Connection, timestamp: String) -> Result<u32, rusqlite::Error> {
    let mut statement = db.prepare("DELETE FROM keypress_logs
    WHERE datetime(timestamp) < datetime(@timestamp, '-120 seconds');
")?;
    let mut rows = statement.execute(named_params! {
        "@timestamp": timestamp
    })?;

    Ok(rows as u32)
}


 */