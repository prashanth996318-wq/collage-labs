const fs = require("fs");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "books.db");
const initSqlPath = path.join(__dirname, "init.sql");

async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  const initSql = fs.readFileSync(initSqlPath, "utf-8");
  await db.exec(initSql);

  const countRow = await db.get("SELECT COUNT(*) AS count FROM book;");
  console.log(`Initialized database at: ${dbPath}`);
  console.log(`Total records in 'book' table: ${countRow.count}`);

  await db.close();
}

initializeDatabase().catch((err) => {
  console.error("Error initializing database:", err.message);
  process.exit(1);
});

