import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

let initialization;

export async function initializeEnquiryDatabase() {
  if (!initialization) {
    initialization = (async () => {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS event_enquiries (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          event_date DATE NULL,
          guests INT UNSIGNED NULL,
          requirements TEXT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'New',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      const [columns] = await pool.execute(
        "SHOW COLUMNS FROM event_enquiries LIKE 'status'",
      );
      if (!columns.length) {
        await pool.execute(
          "ALTER TABLE event_enquiries ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'New'",
        );
      }
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }

  await initialization;
}

export async function createEnquiry(data) {
  await initializeEnquiryDatabase();

  const [result] = await pool.execute(
    `INSERT INTO event_enquiries
      (name, phone, event_type, event_date, guests, requirements)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.phone,
      data.eventType,
      data.eventDate || null,
      data.guests === "" ? null : Number(data.guests),
      data.requirements || null,
    ],
  );

  return { id: result.insertId, ...data };
}

export async function listEnquiries() {
  await initializeEnquiryDatabase();

  const [rows] = await pool.execute(`
    SELECT
      id,
      name,
      phone,
      event_type AS eventType,
      event_date AS eventDate,
      guests,
      requirements,
      status,
      created_at AS createdAt
    FROM event_enquiries
    ORDER BY created_at DESC, id DESC
  `);

  return rows;
}

export async function updateEnquiryStatus(id, status) {
  await initializeEnquiryDatabase();

  const [existingRows] = await pool.execute(
    "SELECT id FROM event_enquiries WHERE id = ?",
    [id],
  );
  if (!existingRows.length) return false;

  await pool.execute(
    "UPDATE event_enquiries SET status = ? WHERE id = ?",
    [status, id],
  );

  return true;
}