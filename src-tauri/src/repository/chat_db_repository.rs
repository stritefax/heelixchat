use crate::entity::chat_item::{Chat, StoredMessage};
use rusqlite::{params, Connection, Error, Result};
use chrono::Local;

pub fn create_chat(db: &Connection, name: &str) -> Result<i64, Error> {
    let now = Local::now().to_rfc3339();
    db.execute(
        "INSERT INTO chats (name, created_at, updated_at) VALUES (?, ?, ?)",
        params![name, now, now],
    )?;
    Ok(db.last_insert_rowid())
}

pub fn get_all_chats(db: &Connection) -> Result<Vec<Chat>, Error> {
    let mut stmt = db.prepare("SELECT * FROM chats ORDER BY created_at DESC")?;
    let chats = stmt.query_map([], |row| {
        Ok(Chat {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;
    Ok(chats.collect::<Result<_, _>>()?)
}

pub fn create_message(db: &Connection, chat_id: i64, role: &str, content: &str) -> Result<i64, Error> {
    let now = Local::now().to_rfc3339();
    db.execute(
        "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        params![chat_id, role, content, now],
    )?;
    Ok(db.last_insert_rowid())
}

pub fn get_messages_by_chat_id(db: &Connection, chat_id: i64) -> Result<Vec<StoredMessage>, Error> {
    let mut stmt = db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at")?;
    let messages = stmt.query_map(params![chat_id], |row| {
        Ok(StoredMessage {
            id: row.get(0)?,
            chat_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    Ok(messages.collect::<Result<_, _>>()?)
}

pub fn update_chat(conn: &Connection, chat_id: i64, name: &str) -> Result<bool> {
    let now = Local::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE chats SET name = ?, updated_at = ? WHERE id = ?",
        params![name, now, chat_id],
    )?;
    Ok(rows_affected > 0)
}

pub fn delete_chat(db: &Connection, chat_id: i64) -> Result<bool, Error> {
    let rows_affected = db.execute("DELETE FROM chats WHERE id = ?", params![chat_id])?;
    db.execute("DELETE FROM messages WHERE chat_id = ?", params![chat_id])?;

    Ok(rows_affected > 0)
}