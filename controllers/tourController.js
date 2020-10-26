const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
// const toursData = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// 2( ROUTE HANDLER)
                                                       
const multerStorage = multer.memoryStorage(); //this way the image will then be stored as a buffer
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
// multer is a very popular middleware to handle  multi part form Data , which is a form in coding  thats used to upload files from a form
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
//when there is mixture use FIELDS
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('images'); // when there is single
// upload.array('images', 5); //when there is multiple  //req.files
// 1) COVER
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  // 2)IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
//  const tour = await await Tour.findById(req.params.id).populate('reviews'); //findbyIdd is shorthand

//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid id',
//   });

//TO get rid of the try catch block we create one function that catches errors
// in the catchAsync  we are returning anonymous function that funciton is get called when there is new user
// it calls createTour

//createTour should be a really be a function but not a result of calling function
exports.createTour = factory.createOne(Tour);
/*try {
    //   console.log(req.body); //body is the properties availble on the requerst becouse we  used middlerware
    //const newTour = new Tour({});
    //newTour.save();
    const newTour = await Tour.create(req.body); //this tour create return a promise we wait

    res.status(201).json({
      status: 'sucess',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
    //400 stand for bad req
  }
  */

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'SUccess',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTour: { $sum: 1 }, //each document basically added 1 to sum
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 }, //1 for ascending
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, //which will exclude thew not easy,
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //array of two or diff tours in one fields pish will push the name fields to tours
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //project is used get rid of the fields  each of the fields o 0 or 1 0 means no longer show up
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'SUccess',
    data: plan,
  });
});

// router.route(
//   '/tours-within/:distance/center/:latlng/unit/:unit',
//   tourController.getToursWithin
// );
// /tours-distance?distance=233&center=13.058042, 74.994978&unit=mi
// /tour-distance/233/center/13.058042, 74.994978/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // 3963.2 is radians of earth in miles
  //6378.1is radius of earth in km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        404
      )
    );
  }
  //geoSpace querying
  //start points is te geospatial point where each tour starts
  //geoWithin within a certain gemmetry
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // 3963.2 is radians of earth in miles
  //6378.1is radius of earth in km 1meter in miles
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // 1 meter in miles and 1 meter in km
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        404
      )
    );
  }

  const distance = await Tour.aggregate([
    {
      //this is only geospatial aggregation pipeline stage that actually exists
      //geoNear always needs to be the first stage
      //iT requres that atleast one of our fields contains a geospatial index
      //If there is only one field with a geospatial index tjem thios geoNear stage here will automatically
      // use that index in order to perform calculation
      //if u have mutliple fields with geospatial indexes then you need to use keys parameters in order to define
      //the field that u want to use inorder to calculate
      //!remember geoNear is only valid as the first stage in a pipeline
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', //this is the field that will be created and where all the calc distance will be stored
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distance,
    },
  });
});
