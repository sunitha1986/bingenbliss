import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  timezone: "Z",
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

let initialization;

function toMysqlDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const date = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new TypeError("Customer dates must use YYYY-MM-DD format");
  }
  return date;
}

function toMysqlDateTime(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("Customer submission time is invalid");
  }
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function toCustomer(row) {
  return {
    id: String(row.id),
    Name: row.name,
    Phone: row.phone,
    Occasion: row.occasion,
    "Celebration date": row.celebration_date,
    "Date of birth": row.date_of_birth,
    Guests: row.guests,
    Consent: row.consent,
    "Submitted at": `${row.submitted_at.replace(" ", "T")}Z`,
  };
}

async function insertCustomer(connection, customer) {
  const dateOfBirth = toMysqlDate(
    customer["Date of birth"] || customer["Celebration date"],
  );
  const celebrationDate = toMysqlDate(
    customer["Celebration date"] || dateOfBirth,
  );
  const [result] = await connection.execute(
    `INSERT INTO lucky_draw_customers
      (name, phone, occasion, celebration_date, date_of_birth, guests, consent, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.Name,
      customer.Phone,
      customer.Occasion || "",
      celebrationDate,
      dateOfBirth,
      Number(customer.Guests) || 1,
      customer.Consent || "No",
      toMysqlDateTime(customer["Submitted at"]),
    ],
  );
  return { ...customer, id: String(result.insertId) };
}

async function findCustomerById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM lucky_draw_customers WHERE id = ?",
    [id],
  );
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function initializeLuckyDrawDatabase() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error(
      "Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME to use MySQL",
    );
  }

  if (!initialization) {
    initialization = pool
      .execute(
        `CREATE TABLE IF NOT EXISTS lucky_draw_customers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        occasion VARCHAR(255) NOT NULL,
        celebration_date DATE NOT NULL,
        date_of_birth DATE NOT NULL,
        guests INT UNSIGNED NOT NULL,
        consent VARCHAR(10) NOT NULL DEFAULT 'No',
        submitted_at DATETIME(3) NOT NULL,
        INDEX idx_lucky_draw_phone_submitted_at (phone, submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      )
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
  }

  await initialization;
}

export async function readLuckyDrawCustomers() {
  await initializeLuckyDrawDatabase();
  const [rows] = await pool.query(
    "SELECT * FROM lucky_draw_customers ORDER BY id",
  );
  return rows.map(toCustomer);
}

export async function appendLuckyDrawCustomer(customer) {
  await initializeLuckyDrawDatabase();
  const connection = await pool.getConnection();
  try {
    return await insertCustomer(connection, customer);
  } finally {
    connection.release();
  }
}

export async function updateLuckyDrawCustomer(id, { name, phone, dob }) {
  await initializeLuckyDrawDatabase();
  await pool.execute(
    `UPDATE lucky_draw_customers
     SET name = ?, phone = ?, date_of_birth = ?
     WHERE id = ?`,
    [name, phone, toMysqlDate(dob), id],
  );
  return findCustomerById(id);
}

export async function deleteLuckyDrawCustomer(id) {
  await initializeLuckyDrawDatabase();
  const [result] = await pool.execute(
    "DELETE FROM lucky_draw_customers WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

export async function importLegacyLuckyDrawCustomers(customers) {
  await initializeLuckyDrawDatabase();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS count FROM lucky_draw_customers",
    );
    if (Number(rows[0].count) > 0) {
      throw new Error(
        "The MySQL customer table is not empty; refusing to import the workbook",
      );
    }

    for (const customer of customers) {
      await insertCustomer(connection, customer);
    }
    await connection.commit();
    return customers.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeLuckyDrawDatabase() {
  await pool.end();
}
