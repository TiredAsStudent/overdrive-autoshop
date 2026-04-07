const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

const validate = (schema) => (req, res, next) => {
  if (!schema) {
    console.error("Validation Middleware Error: Schema is undefined.");
    return sendError(
      res,
      STATUS_CODES.INTERNAL_ERROR,
      "Internal Server Error: Route validation is misconfigured.",
    );
  }

  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    let errorMessages = "Validation failed: Invalid input data.";

    try {
      if (result.error && Array.isArray(result.error.issues)) {
        errorMessages = result.error.issues.map((e) => e.message).join(" | ");
      } else if (result.error && Array.isArray(result.error.errors)) {
        errorMessages = result.error.errors.map((e) => e.message).join(" | ");
      }
    } catch (fallbackError) {
      console.error("Could not format Zod error cleanly:", fallbackError);
    }

    return sendError(
      res,
      STATUS_CODES.BAD_REQUEST,
      "Validation Failed",
      errorMessages,
    );
  }

  next();
};

module.exports = validate;
