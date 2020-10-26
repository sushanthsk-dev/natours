const app = require('../app');

class appError extends Error {
  constructor(message, statusCode) {
    super(message); //when we extend parent class we call super in order to call the parent constructor
    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // so these errors are operational error
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
    //when  new object is crerated and constructor function is called then that function call is not
    //gonna appear in the stack trace and will not pull over it
  }
}

module.exports = appError;
