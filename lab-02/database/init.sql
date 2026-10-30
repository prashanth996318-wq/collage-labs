CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
(1, 'The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 650, 352),
(2, 'Clean Code', 'Robert C. Martin', 599, 464),
(3, 'Introduction to Algorithms', 'Thomas H. Cormen', 899, 1312),
(4, 'Design Patterns', 'Erich Gamma et al.', 750, 395),
(5, 'You Don''t Know JS Yet', 'Kyle Simpson', 450, 143),
(6, 'Eloquent JavaScript', 'Marijn Haverbeke', 499, 472),
(7, 'Node.js Design Patterns', 'Mario Casciaro', 680, 660),
(8, 'Database System Concepts', 'Abraham Silberschatz', 820, 1376),
(9, 'Computer Networking: A Top-Down Approach', 'James F. Kurose', 790, 864),
(10, 'Operating System Concepts', 'Abraham Silberschatz', 775, 976);

