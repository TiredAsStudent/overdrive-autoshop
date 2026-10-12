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
  const isServerError = statusCode >= 500;

  const shouldHideDetails = isServerError && !isDev;

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: shouldHideDetails ? null : details,
    },
  });
};

module.exports = { sendSuccess, sendError };
