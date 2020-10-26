const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('./../utils/APIFeatures');
const { Model } = require('mongoose');
const { populate, model } = require('../models/tourModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { modelName } = { ...Model };
    console.log(modelName);
    if (modelName === 'Review') {
      const tempUser = await Model.findById(req.params.id);
      const reqUser = JSON.stringify(req.user._id);
      const tempeUser = JSON.stringify(tempUser.user._id);
      //      const bool = Object.is(req.user._id, tempUser.user._id);
      console.log(bool);
      if (tempeUser !== reqUser) {
        console.log(tempeUser);
        console.log(reqUser);
        return next(new AppError('Dnt have an access', 404));
      }
    }

    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //Becouse this new updated doc is the one that will be returned
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    //console.log(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body); //this tour create return a promise we wait
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query; //findbyIdd is shorthand
    //populate means biasically to fill out the field called guieds in our model
    //Tour.findOne({_id:req.params.id})
    //Only in thequery not in the actual databse
    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //Executing query
    //this is returned becouase filter doesnot return any value for thew next methode so thts why we use
    //return this  will  entire object
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    // const doc = await features.query.explain(); //query will contain find(JSON.parse(queryString));
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc,
      },
    });
  });
