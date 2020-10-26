const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1)Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour.summary);
  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    //accept array in object  one object is for product
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, //the amt is expected in cents  1dollar equal to 100cents to convert it to cents multiply 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  //3)Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only TEMPORARY,because it's UNSECURE: everyone can bookings without paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  // eslint-disable-next-line prettier/prettier
  await Booking.create({tour,user,price});
  res.redirect(req.originalUrl.split('?')[0]);
  next();
});

exports.protectReview = catchAsync(async (req, res, next) => {
  console.log('Tour', req.body.tour);
  const data = await Booking.find({ tour: req.body.tour });
  data.map((el) => console.log('Protecyt', el));

  if (!data[0]) return next(new AppError('No tour booked', 404));
  console.log('Ysrer', data[0].user._id, req.body.user);
  if (!(data[0].user._id === req.body.user))
    return next(
      new AppError('You cant write Review unless you book this tour', 400)
    );
  next();
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
