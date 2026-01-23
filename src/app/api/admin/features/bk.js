// server.js
const express = require("express");
const app = express();

app.get("/api/data", (req, res) => {
  try {
    // Corrected code: Ensure variables are defined or handle potential undefined states
    // For demonstration, let's assume 'someUndefinedVariable' was a typo and we meant a mock data.
    const mockData = { id: 1, name: "Example" };
    const data = mockData.property; // Now 'property' of mockData is undefined, which is safer
    // but still might not be what you intend.
    // Real fix involves ensuring 'mockData' has 'property' or handling its absence.
    res.json({ message: "Data fetched", data });
  } catch (error) {
    console.error("Error in /api/data:", error); // Log the error on the server
    res
      .status(500)
      .json({ message: "Internal Server Error", details: error.message }); // Send a helpful error to client
  }
});

// It's also good practice to have a global error handler for Express apps
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.stack);
  res.status(500).send("Something broke!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
