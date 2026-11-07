const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "database", "books.db");

let db = null;

// Allowlist for sort columns to avoid SQL injection
const ALLOWED_ORDER_BY = ["id", "title", "author", "price", "pages"];
const ALLOWED_ORDER = ["ASC", "DESC"];

// Helper function to validate bookId parameter
function parseBookId(bookIdParam) {
  const id = Number(bookIdParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

// Helper function to validate request body for POST
function validatePostBookBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a valid JSON object";
  }

  const { title, author, price, pages } = body;

  if (title === undefined) {
    return "Title is required";
  }
  if (typeof title !== "string" || title.trim() === "") {
    return "Title must be a non-empty string";
  }

  if (author === undefined) {
    return "Author is required";
  }
  if (typeof author !== "string" || author.trim() === "") {
    return "Author must be a non-empty string";
  }

  if (price === undefined) {
    return "Price is required";
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number";
  }

  // pages is optional; if provided, must be a positive integer
  if (pages !== undefined) {
    if (typeof pages !== "number" || !Number.isInteger(pages) || pages <= 0) {
      return "Pages must be a positive integer";
    }
  }

  return null;
}

// Helper function to validate request body for PUT (full update)
function validatePutBookBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a valid JSON object";
  }

  const { title, author, price, pages } = body;

  if (title === undefined) {
    return "Title is required";
  }
  if (typeof title !== "string" || title.trim() === "") {
    return "Title must be a non-empty string";
  }

  if (author === undefined) {
    return "Author is required";
  }
  if (typeof author !== "string" || author.trim() === "") {
    return "Author must be a non-empty string";
  }

  if (price === undefined) {
    return "Price is required";
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number";
  }

  if (pages !== undefined) {
    if (typeof pages !== "number" || !Number.isInteger(pages) || pages <= 0) {
      return "Pages must be a positive integer";
    }
  }

  return null;
}

// Single asynchronous initialization function
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

// Health check / welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Lab 3: REST API, Query Parameters, Validation & Debugging Server",
    endpoints: [
      "GET /books/?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=",
      "GET /books/:bookId/",
      "POST /books/",
      "PUT /books/:bookId/",
      "DELETE /books/:bookId/",
    ],
  });
});

// Endpoint 1: GET /books/ -> Search, Sorting, Pagination, and Price-range filtering
app.get("/books/", async (req, res, next) => {
  try {
    const {
      search_q,
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    const conditions = [];
    const params = [];

    // 1. Partial title search using SQL LIKE
    if (search_q !== undefined) {
      conditions.push("title LIKE ?");
      params.push(`%${search_q}%`);
    }

    // 2. Minimum price filter
    let parsedMinPrice = null;
    if (min_price !== undefined) {
      parsedMinPrice = Number(min_price);
      if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({ message: "min_price must be a non-negative number" });
      }
      conditions.push("price >= ?");
      params.push(parsedMinPrice);
    }

    // 3. Maximum price filter
    let parsedMaxPrice = null;
    if (max_price !== undefined) {
      parsedMaxPrice = Number(max_price);
      if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({ message: "max_price must be a non-negative number" });
      }
      conditions.push("price <= ?");
      params.push(parsedMaxPrice);
    }

    // Reject min_price > max_price
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: "min_price cannot be greater than max_price",
      });
    }

    // 4. Validate order_by against allowlist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_BY.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by column. Allowed columns: ${ALLOWED_ORDER_BY.join(", ")}`,
      });
    }

    // 5. Validate order against allowlist
    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER.includes(normalizedOrder)) {
      return res.status(400).json({
        message: "Invalid order direction. Allowed values: ASC, DESC",
      });
    }

    // 6. Validate pagination (limit & offset)
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "limit must be a positive integer",
      });
    }
    if (parsedLimit > 100) {
      return res.status(400).json({
        message: "limit cannot exceed maximum allowed value of 100",
      });
    }

    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "offset must be a non-negative integer",
      });
    }

    // Construct the SQL query
    let query = `SELECT * FROM book`;
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    // Safe interpolation of validated allowlist identifiers
    query += ` ORDER BY ${normalizedOrderBy} ${normalizedOrder} LIMIT ? OFFSET ?;`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(query, params);
    res.status(200).json({ books });
  } catch (error) {
    next(error);
  }
});

// Endpoint 2: GET /books/:bookId/ -> Retrieve a single book
app.get("/books/:bookId/", async (req, res, next) => {
  try {
    const bookId = parseBookId(req.params.bookId);
    if (bookId === null) {
      return res.status(400).json({ message: "Invalid bookId. Must be a positive integer." });
    }

    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// Endpoint 3: POST /books/ -> Create a new book with input validation
app.post("/books/", async (req, res, next) => {
  try {
    const validationError = validatePostBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price, pages = null } = req.body;
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      Math.round(price),
      pages,
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: Math.round(price),
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

// Endpoint 4: PUT /books/:bookId/ -> Full update of an existing book
app.put("/books/:bookId/", async (req, res, next) => {
  try {
    const bookId = parseBookId(req.params.bookId);
    if (bookId === null) {
      return res.status(400).json({ message: "Invalid bookId. Must be a positive integer." });
    }

    const validationError = validatePutBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price, pages = null } = req.body;
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    const result = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Math.round(price),
      pages,
      bookId,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book updated successfully",
      book: {
        id: bookId,
        title: title.trim(),
        author: author.trim(),
        price: Math.round(price),
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
      return res.status(400).json({ message: "Invalid bookId. Must be a positive integer." });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    const result = await db.run(deleteBookQuery, [bookId]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book deleted successfully",
      id: bookId,
    });
  } catch (error) {
    next(error);
  }
});

// 404 Catch-all handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "404 - Route Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Database/Server Error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

initializeDBAndServer();

