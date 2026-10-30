# Lab 2: SQLite database and CRUD routes

## Student Details

```text
Name: ILLA ANANTHA SRI VENKATA PRASANTH
Registration Number: 252U1R8029
Section: CSE(Q.E)-2A
```

## Live Link

Not deployed yet

*(Note: Because this lab uses a local file-based SQLite database (`database/books.db`) and tests stateful CRUD operations locally via Postman and SQLite inspection, screenshots of all CRUD endpoints in Postman and the SQLite database verification are included below as required by the lab manual.)*

## Project Description

This project implements a RESTful Book Management API using **Node.js**, **Express**, and a **SQLite** database (`database/books.db`). It initializes the database connection asynchronously via `initializeDBAndServer()` before starting the Express server and provides five full CRUD endpoints (`GET /books/`, `GET /books/:bookId/`, `POST /books/`, `PUT /books/:bookId/`, and `DELETE /books/:bookId/`) using parameterized SQL queries (`?` placeholders) to prevent SQL injection.

## Requirements

- **Node.js** (v18+ / v24+) and **npm**
- **Packages**:
  - `express` — Web framework for routing and JSON body parsing
  - `sqlite` — Promise/async-await wrapper for SQLite in Node.js
  - `sqlite3` — SQLite3 database driver
  - `nodemon` (devDependency) — Automatically restarts the server on code changes
- **SQLite CLI** (`sqlite3`) or the included `npm run inspect-db` utility for inspecting `database/books.db`

## How to Install and Run

1. Navigate into the `lab-02` folder:
   ```bash
   cd lab-02
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. *(Optional)* Initialize or verify the sample records in `database/books.db`:
   ```bash
   npm run init-db
   ```

4. Start the server in development mode using **Nodemon**:
   ```bash
   npm run dev
   ```

5. Or start the server in normal production mode:
   ```bash
   npm start
   ```

- **Environment Variables**: None are required for this lab. The server listens on `http://localhost:3000` and connects to `lab-02/database/books.db`.

## Database

- **Database File Location**: `lab-02/database/books.db` (resolved reliably in `server.js` using `path.join(__dirname, "database", "books.db")`).
- **Schema (`book` table)**:
  ```sql
  CREATE TABLE book (
      id INTEGER PRIMARY KEY,
      title TEXT,
      author TEXT,
      price INTEGER,
      pages INTEGER
  );
  ```
- **Initial Sample Records**: 10 sample computer science and programming books are defined in `database/init.sql` and seeded into `database/books.db`. Initialization uses `CREATE TABLE IF NOT EXISTS` and `INSERT OR IGNORE` so it is safe to run multiple times without duplicating rows or overwriting existing records when the server starts.
- **How to Inspect the Database**:
  - Using the **SQLite CLI**:
    ```bash
    sqlite3 database/books.db
    .tables
    .schema book
    SELECT * FROM book;
    ```
  - Or using the built-in inspection script:
    ```bash
    npm run inspect-db
    ```

## Endpoints

| Method | Path | Purpose | Success Status | Error Statuses |
|---|---|---|---|---|
| `GET` | `/books/` | Retrieve all books from the `book` table | `200 OK` (JSON array) | `500 Internal Server Error` |
| `GET` | `/books/:bookId/` | Retrieve a single book by `bookId` | `200 OK` (JSON object) | `400 Bad Request` (invalid ID), `404 Not Found` (missing book) |
| `POST` | `/books/` | Add a new book record (`title`, `author`, `price`, `pages`) | `201 Created` (JSON confirmation + created book) | `400 Bad Request` (missing/invalid fields) |
| `PUT` | `/books/:bookId/` | Full update of an existing book by `bookId` | `200 OK` (JSON confirmation + updated book) | `400 Bad Request` (invalid ID/body), `404 Not Found` (missing book) |
| `DELETE` | `/books/:bookId/` | Delete a book by `bookId` | `200 OK` (JSON confirmation with deleted ID) | `400 Bad Request` (invalid ID), `404 Not Found` (missing book) |

## Screenshots

Postman and SQLite database screenshots will be added after manual verification:

- `screenshots/get-all-books.png`
- `screenshots/get-single-book.png`
- `screenshots/post-book.png`
- `screenshots/put-book.png`
- `screenshots/delete-book.png`
- `screenshots/invalid-book-404.png`
- `screenshots/postman-invalid-input.png`
- `screenshots/sqlite-database.png`

## Notes

### Problems Faced and How They Were Solved

1. **SQLite CLI Availability on Windows**:
   - Check whether `sqlite3.exe` is in the system `PATH` or installed via `sqlite3` tools. In addition to supporting standard `sqlite3 database/books.db` CLI commands, reproducible SQL (`database/init.sql`) and Node/SQLite helper scripts (`database/init-db.js` and `database/inspect-db.js`) were included so database initialization and `.tables` / `.schema book` / `SELECT * FROM book;` verification can be run consistently across any terminal environment.
2. **Preventing Accidental Duplicate Databases**:
   - Used `path.join(__dirname, "database", "books.db")` inside `server.js` so the Express server always connects to `lab-02/database/books.db` regardless of the current working directory.

