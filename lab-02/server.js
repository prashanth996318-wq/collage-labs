const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const PORT = 3000;
const dbPath = path.join(__dirname, "database", "books.db");

let db = null;

// Helper function to validate bookId parameter
function parseBookId(bookIdParam) {
  const id = Number(bookIdParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

// Helper function to validate book request body for POST and PUT
function validateBookBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a valid JSON object.";
  }

  const { title, author, price, pages } = body;

  if (typeof title !== "string" || title.trim() === "") {
    return "Field 'title' is required and must be a non-empty string.";
  }

  if (typeof author !== "string" || author.trim() === "") {
    return "Field 'author' is required and must be a non-empty string.";
  }

  if (typeof price !== "number" || !Number.isInteger(price) || price < 0) {
    return "Field 'price' is required and must be a non-negative integer.";
  }

  if (typeof pages !== "number" || !Number.isInteger(pages) || pages <= 0) {
    return "Field 'pages' is required and must be a positive integer.";
  }

  return null;
}

// Asynchronous function to initialize the SQLite database connection and start the server
async function initializeDBAndServer() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log(`Connected to SQLite database at: ${dbPath}`);

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to initialize database and server: ${error.message}`);
    process.exit(1);
  }
}

// Endpoint 1: GET /books/ -> Get all books
app.get("/books/", async (req, res, next) => {
  try {
    const getBooksQuery = `SELECT * FROM book ORDER BY id ASC;`;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

// Endpoint 2: GET /books/:bookId/ -> Get a single book by ID
app.get("/books/:bookId/", async (req, res, next) => {
  try {
    const bookId = parseBookId(req.params.bookId);
    if (bookId === null) {
      return res.status(400).json({ error: "Invalid bookId. Must be a positive integer." });
    }

    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// Endpoint 3: POST /books/ -> Add a new book
app.post("/books/", async (req, res, next) => {
  try {
    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = req.body;
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price,
      pages,
    };

    res.status(201).json({
      message: "Book created successfully",
      book: createdBook,
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint 4: PUT /books/:bookId/ -> Update an existing book
app.put("/books/:bookId/", async (req, res, next) => {
  try {
    const bookId = parseBookId(req.params.bookId);
    if (bookId === null) {
      return res.status(400).json({ error: "Invalid bookId. Must be a positive integer." });
    }

    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = req.body;
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    const result = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      bookId,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json({
      message: "Book updated successfully",
      book: {
        id: bookId,
        title: title.trim(),
        author: author.trim(),
        price,
        pages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint 5: DELETE /books/:bookId/ -> Delete a book by ID
app.delete("/books/:bookId/", async (req, res, next) => {
  try {
    const bookId = parseBookId(req.params.bookId);
    if (bookId === null) {
      return res.status(400).json({ error: "Invalid bookId. Must be a positive integer." });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    const result = await db.run(deleteBookQuery, [bookId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json({
      message: "Book deleted successfully",
      id: bookId,
    });
  } catch (error) {
    next(error);
  }
});

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "404 - Route Not Found" });
});

// Global error handler for unexpected database or server errors
app.use((err, req, res, next) => {
  console.error("Database/Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

initializeDBAndServer();

