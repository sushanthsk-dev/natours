module.exports = (fn) => {
  return (req, res, next) => {
    //this function is get called as soon as there is new tour should be created
    fn(req, res, next).catch(next); //this is the catch method which passes the error into the next function which will
    //make our error ends up in our global error handling middleware
    //this line of code where  all the magic happens
  }; //this is a func the express is going to call  so there is where we then specify req,res,next
};
