# Debugging Exercise: Four Common Backend Errors

This document demonstrates four common backend errors identified in **Lab 3**, explaining their symptoms, root causes, detection methods, and how to fix them with concrete code/terminal examples.

---

## Error 1: Port Already in Use (`EADDRINUSE`)

### Problem & Typical Symptom
When starting the server, Node.js throws an unhandled exception:
```text
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    at ...
Emitted 'error' event on Server instance at: ... {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

### Root Cause
Another process (such as a previous instance of `node server.js`, another terminal tab running Nodemon, or a different service) is already listening on port `3000`. Only one process can bind to a specific IP and port combination at a time.

### How to Identify It
On Windows PowerShell:
```powershell
netstat -ano | findstr :3000
```
This displays the active connection and the Process ID (PID), for example:
```text
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       14820
```

### Correct Fix
1. **Terminate the conflicting process safely** using its PID:
   ```powershell
   taskkill /PID 14820 /F
   ```
2. **Make the port configurable** in `server.js` using environment variables:
   ```javascript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`Server is running at http://localhost:${PORT}`);
   });
   ```
   This allows running on a different port whenever needed (e.g., `PORT=3001 node server.js`).

---

## Error 2: Wrong Import Path (`MODULE_NOT_FOUND`)

### Problem & Typical Symptom
Starting the application crashes immediately before running any route logic:
```text
node:internal/modules/cjs/loader:1252
  throw err;
  ^

Error: Cannot find module '../database/connection'
Require stack:
- C:\Users\prash\Downloads\lab reports\lab-03\server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1249:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1037:19)
    at Module._load (node:internal/modules/cjs/loader:1075:12)
    at Module.require (node:internal/modules/cjs/loader:1311:12)
    at require (node:internal/modules/helpers:136:16) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '.../server.js' ]
}
```

### Root Cause
A `require()` or `import` statement specified an incorrect relative or absolute path (e.g. `../database/connection` instead of `./database/init-db`), or a required npm dependency was not installed in `package.json`.

### How to Identify It
Inspect the project directory tree and verify the exact file name and relative location compared to the calling script:
```powershell
Get-ChildItem -Recurse
```

### Correct Fix
Adjust the relative path to match the real directory structure:
```javascript
// Incorrect:
// const db = require("./db/books");

// Correct:
const path = require("path");
const dbPath = path.join(__dirname, "database", "books.db");
```
Always use `path.join(__dirname, ...)` for file system paths in CommonJS to avoid directory mismatches across different operating systems.

---

## Error 3: Wrong Table Name (`no such table`)

### Problem & Typical Symptom
When a route is requested, SQLite throws a runtime database error:
```text
SQLITE_ERROR: no such table: books
```
The client receives a `500 Internal Server Error` or the server process crashes if unhandled.

### Root Cause
1. Mismatch between the table name created in SQL (`book`) and the name referenced in the query (`books`):
   ```sql
   -- Table created as:
   CREATE TABLE book (...);

   -- Query mistakenly using plural:
   SELECT * FROM books;
   ```
2. Or connecting to a blank `.db` file in the wrong directory before running table migrations/seeds.

### How to Identify It
1. Inspect the database schema using SQLite CLI or a helper script:
   ```bash
   node database/inspect-db.js
   ```
   Or:
   ```bash
   sqlite3 database/books.db
   .tables
   .schema book
   ```
2. Check the table list to confirm whether the table is `book` or `books`.

### Correct Fix
Synchronize the SQL query string in `server.js` with the exact schema:
```javascript
// Incorrect:
// const getBooksQuery = "SELECT * FROM books;";

// Correct:
const getBooksQuery = "SELECT * FROM book;";
const books = await db.all(getBooksQuery);
```

---

## Error 4: Missing `await` on Asynchronous Calls

### Problem & Typical Symptom
A route handler performs a database query but omits `await`:
```javascript
// Faulty code:
app.get("/books/", (req, res) => {
  const books = db.all("SELECT * FROM book;"); // Missing await!
  res.status(200).json({ books: books });
});
```
The client receives an empty Promise object:
```json
{
  "books": {}
}
```
Or when attempting to access properties of the result (e.g. `books.length`), it throws:
```text
TypeError: Cannot read properties of undefined (or unexpected promise inspection)
```

### Root Cause
Database queries in `sqlite` return a **JavaScript `Promise`**. Without `await`, execution proceeds synchronously before SQLite retrieves the data from disk, so the Promise reference itself is serialized to JSON `{}`.

### How to Identify It
Check console logs or JSON responses. If an array or object returns `{}` or `Promise { <pending> }`, an asynchronous operation was not awaited.

### Correct Fix
Mark the route handler function as `async` and use `await` on all SQLite calls:
```javascript
// Correct implementation:
app.get("/books/", async (req, res, next) => {
  try {
    const books = await db.all("SELECT * FROM book;");
    res.status(200).json({ books });
  } catch (error) {
    next(error);
  }
});
```

Similarly, in `initializeDBAndServer()`, `await open(...)` guarantees that the database connection is fully open before `app.listen(...)` begins accepting HTTP traffic.

