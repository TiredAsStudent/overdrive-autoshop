const AppError = require("../utils/AppError");

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //  send the friendly message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error (e.g., database connection lost)
    console.error("ERROR", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong on the server.",
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.code === "23505") {
      error = new AppError(
        "Duplicate field value entered. Please use another value.",
        400,
      );
    }
    // Handle invalid data types sent to Postgres
    if (error.code === "22P02") {
      error = new AppError(
        "Invalid data format provided to the database.",
        400,
      );
    }

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
