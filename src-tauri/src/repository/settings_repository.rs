use rusqlite::{Connection, named_params};
use rusqlite_from_row::FromRow;
use crate::entity::setting::Setting;

pub fn insert_or_update_setting(db: &Connection, setting: Setting) -> Result<(), rusqlite::Error> {
    let mut insert_statement = db.prepare("
    INSERT INTO settings (setting_key, setting_value)
    VALUES (@setting_key, @setting_value)
    ON CONFLICT(setting_key) DO NOTHING;")?;

    insert_statement.execute(named_params! {
        "@setting_key": setting.setting_key,
        "@setting_value": setting.setting_value,
    })?;

    let mut update_statement = db.prepare("
    UPDATE settings
    SET setting_value = @setting_value
    WHERE setting_key = @setting_key;")?;

    update_statement.execute(named_params! {
        "@setting_value": setting.setting_value,
        "@setting_key": setting.setting_key,
    })?;
    Ok(())
}

pub fn get_setting(db: &Connection, setting_key: &str) -> Result<Setting, rusqlite::Error> {
    let row = db.query_row("SELECT * FROM settings WHERE setting_key = @setting_key LIMIT 1",
                           named_params! {
                                "@setting_key": setting_key,
                           },
                           Setting::try_from_row).unwrap_or(
        Setting {
            setting_key: setting_key.to_string(),
            setting_value: "".to_string(),
        });
    return Ok(row);
}

pub fn get_settings(db: &Connection) -> Result<Vec<Setting>, rusqlite::Error> {
    let mut statement = db.prepare("SELECT * FROM settings")?;
    let mut rows = statement.query([])?;
    let mut settings: Vec<Setting> = Vec::new();
    while let Some(row) = rows.next()? {
        settings.push(Setting {
            setting_key: row.get("setting_key")?,
            setting_value:  row.get("setting_value")?,
        });
    }

    Ok(settings)
}

