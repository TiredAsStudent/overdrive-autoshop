class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    this.isOperational = true;

    // Captures exactly where the error happened in the code
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
