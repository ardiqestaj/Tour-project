class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // If status code start with 4 is a fail otherwise error
    // This because if errot start with error is fail and not error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // For error in our code
    this.isOperational = true;
    // This captureStackTrace to find the fail and show it in terminal
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
