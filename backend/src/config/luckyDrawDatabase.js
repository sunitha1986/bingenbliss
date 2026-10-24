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
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
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

function getIndiaDrawMonth(value) {
  const indiaDate = new Date(new Date(value).getTime() + 330 * 60 * 1000);
  return `${indiaDate.getUTCFullYear()}-${String(
    indiaDate.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

function toSpin(spin) {
  if (!spin || typeof spin.id !== "string" || !spin.winner) {
    throw new TypeError("Lucky draw spin record is invalid");
  }
  const spunAt = new Date(spin.spunAt);
  if (!Number.isFinite(spunAt.getTime())) {
    throw new TypeError("Lucky draw spin timestamp is invalid");
  }
  return {
    id: spin.id,
    winner: spin.winner,
    spunAt: spunAt.toISOString(),
  };
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

function fromSpin(row) {
  const winner =
    typeof row.winner === "string" ? JSON.parse(row.winner) : row.winner;
  return {
    id: row.spin_id,
    winner,
    spunAt: row.spun_at,
  };
}

function isDisconnectError(error) {
  if (!error) return false;
  const code = error.code || "";
  const message = error.message || "";
  return (
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EPIPE" ||
    code === "PROTOCOL_ENVELOPE_AFTER_DISCONNECT" ||
    code === "ER_SOCKET_UNEXPECTED_CLOSE" ||
    code === "PROTOCOL_PACKETS_OUT_OF_ORDER" ||
    error.fatal === true ||
    message.includes("Connection lost") ||
    message.includes("read ECONNRESET")
  );
}

async function retryAfterLostConnection(operation, maxRetries = 3) {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      return await operation();
    } catch (error) {
      if (attempts < maxRetries && isDisconnectError(error)) {
        console.warn(
          `[MySQL] Connection reset/lost (${error.code || error.message}), retrying query (attempt ${attempts}/${maxRetries})...`,
        );
        initialization = undefined;
        await new Promise((resolve) => setTimeout(resolve, 300 * attempts));
        continue;
      }
      throw error;
    }
  }
}

async function findCustomerById(id) {
  return retryAfterLostConnection(async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM lucky_draw_customers WHERE id = ?",
      [id],
    );
    return rows[0] ? toCustomer(rows[0]) : null;
  });
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
      .then(() =>
        pool.execute(
          `CREATE TABLE IF NOT EXISTS lucky_draw_spins (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          spin_id CHAR(36) NOT NULL UNIQUE,
          winner LONGTEXT NOT NULL,
          spun_at DATETIME(3) NOT NULL,
          draw_month CHAR(7) NOT NULL,
          INDEX idx_lucky_draw_spins_draw_month (draw_month),
          INDEX idx_lucky_draw_spins_spun_at (spun_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        ).then(() =>
          pool.execute(
            "ALTER TABLE lucky_draw_spins DROP INDEX uq_lucky_draw_spins_draw_month",
          ).catch(() => {}),
        ),
      )
      .then(() =>
        pool.execute(
        `CREATE TABLE IF NOT EXISTS lucky_draw_spin_cycles (
        draw_month CHAR(7) NOT NULL PRIMARY KEY,
        spin_id CHAR(36) NOT NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        ),
      )
      .then(() =>
        pool.query(
        `INSERT IGNORE INTO lucky_draw_spin_cycles (draw_month, spin_id)
         SELECT DATE_FORMAT(DATE_ADD(spun_at, INTERVAL 330 MINUTE), '%Y-%m'),
           MIN(spin_id)
         FROM lucky_draw_spins
         GROUP BY DATE_FORMAT(DATE_ADD(spun_at, INTERVAL 330 MINUTE), '%Y-%m')`,
        ),
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
  return retryAfterLostConnection(async () => {
    const [rows] = await pool.query(
      "SELECT * FROM lucky_draw_customers ORDER BY id",
    );
    return rows.map(toCustomer);
  });
}

export async function readLuckyDrawSpins() {
  await initializeLuckyDrawDatabase();
  return retryAfterLostConnection(async () => {
    const [rows] = await pool.query(
      `SELECT spin_id, winner,
        DATE_FORMAT(spun_at, '%Y-%m-%dT%H:%i:%s.%fZ') AS spun_at
       FROM lucky_draw_spins
       ORDER BY spun_at, id`,
    );
    return rows.map(fromSpin);
  });
}

export async function readLatestLuckyDrawSpin() {
  await initializeLuckyDrawDatabase();
  return retryAfterLostConnection(async () => {
    const [rows] = await pool.query(
      `SELECT spin_id, winner,
        DATE_FORMAT(spun_at, '%Y-%m-%dT%H:%i:%s.%fZ') AS spun_at
       FROM lucky_draw_spins
       ORDER BY spun_at DESC, id DESC
       LIMIT 1`,
    );
    return rows[0] ? fromSpin(rows[0]) : null;
  });
}

export async function appendLuckyDrawSpin(spin, { isRespin = false } = {}) {
  await initializeLuckyDrawDatabase();
  const record = toSpin(spin);
  const drawMonth = getIndiaDrawMonth(record.spunAt);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (isRespin) {
      await connection.execute(
        `INSERT INTO lucky_draw_spin_cycles (draw_month, spin_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE spin_id = VALUES(spin_id), recorded_at = CURRENT_TIMESTAMP`,
        [drawMonth, record.id],
      );
    } else {
      await connection.execute(
        `INSERT INTO lucky_draw_spin_cycles (draw_month, spin_id)
         VALUES (?, ?)`,
        [drawMonth, record.id],
      );
    }
    await connection.execute(
      `INSERT INTO lucky_draw_spins (spin_id, winner, spun_at, draw_month)
       VALUES (?, ?, ?, ?)`,
      [
        record.id,
        JSON.stringify(record.winner),
        toMysqlDateTime(record.spunAt),
        drawMonth,
      ],
    );
    await connection.commit();
    return record;
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      const duplicateError = new Error(
        "This month's lucky draw already has a winner. Use Re-spin to select another winner.",
      );
      duplicateError.code = "DUPLICATE_LUCKY_DRAW_CYCLE";
      throw duplicateError;
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function withLuckyDrawCycleLock(cycle, action) {
  await initializeLuckyDrawDatabase();
  const connection = await pool.getConnection();
  const lockName = `bnb-lucky-draw-${cycle}`;
  let lockAcquired = false;
  try {
    const [rows] = await connection.execute(
      "SELECT GET_LOCK(?, 0) AS acquired",
      [lockName],
    );
    lockAcquired = Number(rows[0]?.acquired) === 1;
    if (!lockAcquired) return { acquired: false };

    return { acquired: true, value: await action() };
  } finally {
    try {
      if (lockAcquired) {
        await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
      }
    } finally {
      connection.release();
    }
  }
}

export async function importLuckyDrawSpins(spins) {
  await initializeLuckyDrawDatabase();
  const connection = await pool.getConnection();
  let imported = 0;
  try {
    await connection.beginTransaction();
    for (const spin of spins.map(toSpin)) {
      const drawMonth = getIndiaDrawMonth(spin.spunAt);
      const [result] = await connection.execute(
        `INSERT INTO lucky_draw_spins (spin_id, winner, spun_at, draw_month)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE spin_id = spin_id`,
        [
          spin.id,
          JSON.stringify(spin.winner),
          toMysqlDateTime(spin.spunAt),
          drawMonth,
        ],
      );
      if (result.affectedRows === 1) imported += 1;
    }
    await connection.commit();
    return imported;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

export async function updateLuckyDrawCustomer(
  id,
  {
    name,
    phone,
    occasion,
    celebrationDate,
    dob,
    guests,
    consent,
    submittedAt,
  },
) {
  await initializeLuckyDrawDatabase();
  await retryAfterLostConnection(() =>
    pool.execute(
      `UPDATE lucky_draw_customers
       SET name = ?, phone = ?, occasion = ?, celebration_date = ?,
           date_of_birth = ?, guests = ?, consent = ?, submitted_at = ?
       WHERE id = ?`,
      [
        name,
        phone,
        occasion,
        toMysqlDate(celebrationDate),
        toMysqlDate(dob),
        guests,
        consent,
        toMysqlDateTime(submittedAt),
        id,
      ],
    ),
  );
  return retryAfterLostConnection(() => findCustomerById(id));
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
