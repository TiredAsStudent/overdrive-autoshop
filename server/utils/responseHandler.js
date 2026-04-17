const { STATUS_CODES } = require("../constants/statusCodes");

const sendSuccess = (
  res,
  statusCode = STATUS_CODES.SUCCESS,
  data = null,
  message = "Success",
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res,
  statusCode = STATUS_CODES.INTERNAL_ERROR,
  message = "Internal Server Error",
  details = null,
) => {
  const isDev = process.env.NODE_ENV === "development";

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: isDev ? details : null,
    },
  });
};

module.exports = { sendSuccess, sendError };
