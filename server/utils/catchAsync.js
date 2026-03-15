const catchAsync = (fn) => {
  return (req, res, next) => {
    // Executes the controller function and automatically catches any rejected promises
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
