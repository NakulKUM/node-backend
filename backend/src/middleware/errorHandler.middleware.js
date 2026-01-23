import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    
  let error = err;
  // If error is not ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    error = new ApiError(
      statusCode,
      message,
      [],
      err.stack
    );
  }

  return res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    errors: error.errors,
    data: error.data
  });
};

export default errorHandler;
