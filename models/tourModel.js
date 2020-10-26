const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 character'],
      minlength: [5, 'A tour name must have more or equal than 10 character'],
      //  validate: [validator.isAlpha, ' A tour must contain charcter'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour musst have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy,medium,difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //4.6666 ,46.66666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // This will works in This  create not in update Query

          //This only points to current doc on NEW document creation
          // callback has acess to value that is inputted
          return val < this.price; // 100 < 200
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //images in Array.Array of strings
    createdAt: {
      type: Date,
      default: Date.now(), //Automatically created datestamp
      select: false, // select is basically permanently hide from the output
    },
    startDates: [Date], //Srts om different dates. Mongo parse into date
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      {
        //Embeded doc //sub doc
        type: mongoose.Schema.ObjectId, //We expect a type of each of element in the guides array to be a MongoDb Id //IT shout inside object
        ref: 'User', //How we establish  ref b/w diff data set in Mongoose
      },
    ],
  },
  //schema type options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//toursSchema.index({ price: 1 });
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });
//2D sphere index
toursSchema
  .virtual('durationWeeks')
  .get(function () //this get fucntion is getter
  {
    //   in arrow function doesnot give access this
    return this.duration / 7;
  });
//This is virtual Populate
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // in order to connect two models
  localField: '_id', //we need to do for current field
});
//DOCUMENT MIDDLEWARE: runs before, save() and create()  and insertMany wont work in middleware
toursSchema.pre('save', function (next) {
  //console.log(this); //in a save middleware this will point to the current document is processed
  this.slug = slugify(this.name, { lower: true }); //sliug is not defined in schema so thts why its not saving in database
  next();
}); //Before the actuall event
// toursSchema.pre('save', function () {
//   console.log('Will save document');
// });
// toursSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });
//
//Embeding tour guide doc into a tour doc
// toursSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });

toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
//QUery MiddleWare
toursSchema.pre(/^find/, function (next) {
  //this regular expression is enuff for find findOne findByID || all the strings
  //starts with find
  //toursSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } }); //this points to query object
  //this is query object we can add all chained method
  this.start = Date.now();
  next();
});
toursSchema.post(/^find/, function (doc, next) {
  console.log(`Query took ${Date.now() - this.start}`);
  next();
});

//AGGREGATION MIDDLEWARE

// toursSchema.pre('aggregate', function (next) {
//   // console.log(this.pipeline());
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
//   console.log(this.pipeline());
// });
const Tour = mongoose.model('Tour', toursSchema); //Creating Model out of schema || Tour is model name
module.exports = Tour;
