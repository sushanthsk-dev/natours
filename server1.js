const app = require('./app');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const DB = process.env.DATABASE1.replace(
  '<PASSWORD>',
  process.env.DATABASE1_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB success');
  });
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'It should have name'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'It should have PRice'],
  },
});

const Tour = new mongoose.model('tours', tourSchema);
const testTour = new Tour({
  name: 'The stree',
  rating: 4.5,
  price: 500,
});
testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on the port ${PORT}`);
});
