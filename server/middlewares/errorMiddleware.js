const { INTERNAL_SERVER_ERROR } = require("../constants/statusCodes");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || INTERNAL_SERVER_ERROR;

  // Log the error in the console
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  // Send a clean JSON response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only reveal the stack trace if in development mode
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
