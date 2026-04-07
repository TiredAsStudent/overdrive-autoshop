const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const errorMessages = err.errors.map((e) => e.message).join(", ");
    return sendError(
      res,
      STATUS_CODES.BAD_REQUEST,
      "Validation Failed",
      errorMessages,
    );
  }
};

module.exports = validate;
