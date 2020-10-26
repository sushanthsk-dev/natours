const fs = require('fs');
const http = require('http');
const express = require('express');

const app = express(); //This is how we use middle weare
app.use(express.json());
// app.get('/', (req, res) => {
//   res.json({ message: 'Hello express', status: 00 });
// });
const toursData = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'Sucess',
    results: toursData.length,
    data: toursData,
  });
});

app.post('/api/v1/tours', (req, res) => {
  //   console.log(req.body); //body is the properties availble on the requerst becouse we  used middlerware

  const newId = toursData[toursData.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  toursData.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(toursData),
    (err) => {
      res.status(201).json({
        status: 'sucess',
        data: {
          tour: newTour,
        },
      });
    }
  );
  // allow us to create a new object by merging two existing objects
});

app.listen(3000, () => {
  console.log('Listening on the port 3000');
});
