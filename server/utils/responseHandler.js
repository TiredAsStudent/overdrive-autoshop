// Standardizes all API responses
const sendSuccess = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
  });
};

module.exports = { sendSuccess, sendError };
