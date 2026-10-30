const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "books.db");

async function inspectDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log("=== SQLite Database Inspection (database/books.db) ===\n");

  const tables = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
  );
  console.log("sqlite> .tables");
  console.log(tables.map((t) => t.name).join("  ") + "\n");

  const schema = await db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='book';"
  );
  console.log("sqlite> .schema book");
  console.log((schema ? schema.sql : "Table 'book' not found") + ";\n");

  const books = await db.all("SELECT * FROM book ORDER BY id ASC;");
  console.log("sqlite> SELECT * FROM book;");
  console.table(books);

  await db.close();
}

inspectDatabase().catch((err) => {
  console.error("Error inspecting database:", err.message);
  process.exit(1);
});

