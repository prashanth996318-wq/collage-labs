const http = require("http");

// Create a plain HTTP server using Node's built-in http module
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello");
});

// Listen on port 3000
server.listen(3000, () => {
  console.log("Plain HTTP server is running at http://localhost:3000");
});

