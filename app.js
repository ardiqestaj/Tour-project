const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utilis/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middleware
// Serving static file
// For views
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
// Just for MAPBOX commentit out/ dont forget to uncomment
// app.use(helmet());

// Development loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Max limit of request per IP from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in one hour!',
});
// Limit to all rote that start with API
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against cross site scriptin atacks (XSS)
app.use(xss());

// Prevent parameter pollution
app.use(
  // Here we write fields name, that we want to duplicate in url
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// app.use((req, res, next) => {
//     console.log('Hello from middleware');
//     next();
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// For root that dosen not exist and passing errors
// Dont forget to uncomment this middleware
// app.all('*', (req, res, next) => {
//   // console.log('dasdsad', req)
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error Handling Middleware
// Here We pass all errors
app.use(globalErrorHandler);

module.exports = app;
