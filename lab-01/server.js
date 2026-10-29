const express = require("express");
const app = express();

// Route 1: GET / -> Welcome text
app.get("/", (req, res) => {
  res.status(200).send("Welcome to Lab 1 Node.js and Express Server");
});

// Route 2: GET /about -> JSON containing name and section
// TODO: Replace the placeholder values below with your actual Name and Section
app.get("/about", (req, res) => {
  res.status(200).json({
    name: "YOUR_NAME_HERE",
    section: "YOUR_SECTION_HERE",
  });
});

// Route 3: GET /time -> Current date and time using new Date()
app.get("/time", (req, res) => {
  const currentTime = new Date();
  res.status(200).send(`Current Date and Time: ${currentTime.toString()}`);
});

// 404 Handler for unknown paths
app.use((req, res) => {
  res.status(404).send("404 - Route Not Found");
});

// Start the server on port 3000
app.listen(3000);

