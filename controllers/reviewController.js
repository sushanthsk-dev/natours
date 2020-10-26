const Review = require('./../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
exports.getAllReviews = factory.getAll(Review);
exports.updateReview = factory.updateOne(Review);

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  console.log(req.params.tourId);

  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getReview = factory.getOne(Review);
exports.createReviews = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);
