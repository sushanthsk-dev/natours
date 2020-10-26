const path = require('path'); //which is used to manipulate path names
const express = require('express');
const http = require('http');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const golbalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); //http parameter pollution
const cookieParser = require('cookie-parser');
// create express
const app = express();

app.set('view engine', 'pug'); //setting for the view engine  // automatically supports most common engines out of the box
// dnt need to require pug all of these are included internally inside express
// ---- Pug templates are actually called views in express
// These templates are the views in the model view controller architecture
// === In which folder our views are actually located in all we need to do again is to say app.set
app.set('views', path.join(__dirname, 'views')); // BTS  create a path joining the directory name /views
//Serving static Files
app.use(express.static(path.join(__dirname, 'public'))); // BTS automatically puts slash

// 1)GLOBAL MIDDLEWARE
//Set security HTTP headers
app.use(helmet());
//console.log(process.env.NODE_ENV);
//Developement loggingh
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit request from same API
const limiter = rateLimit({
  max: 100, //This will allow 100 request from the same IP in one hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP,please try again in an hour!',
});

app.use('/api', limiter); //we basicallly wants to apply to /api

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //we can limit the amt of data that comes in the body
//reads the data then only  after that clean that data
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //The way the form sends data to the server is actually also called URL encoded
app.use(cookieParser());
// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // looks at request body and the request query string, and also req.params  filter out all the dollar signs and dot

//Data sanitization against XSS
app.use(xss());
//clean  any user ipnut from malicious html code //

//Prevent Pararameter pollution

app.use(
  hpp({
    whitelist: [
      //array of properties which allow us to duplicate in query string
      'duration',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use((req, res, next) => {
  console.log('HELLO FROM THE MIDDLEWARE');
  next();
});
//Test MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  //console.log(req.headers);
  next();
});
//3)ROUTE

//START the SERVER
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //This is called moutning. mounting new router on a router
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Failed',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`); //we basically use built in constructor in order to create an error
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(golbalErrorHandler);
//* astands for everything
//all for all the get post patch delete
//These are sub routing
module.exports = app;
