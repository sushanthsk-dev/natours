//All of the applicaton setup
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT Exception! SHUTTING DOWN');
  console.log(err, err.message);
  process.exit(1); //) for success 1 stands for uncaught exception
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  //.connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successfull');
  });

const port = process.env.PORT || 3000; //So this port is coming from config enviroment variable
const server = app.listen(port, () => {
  console.log('Listening');
});
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! SHUTTING DOWN');
  console.log(err.name, err.message);
  server.close(() => {
    //by doing this we give server a time to finish  all the request that still pending and handling then only shutdowned
    process.exit(1); //) for success 1 stands for uncaught exception
  });
});

/*
function stripProperty(obj, prop) {
  // write your code here
        let str = prop.split(" ");
        //str.forEach((el)=> delete obj[el])
        Object.keys(obj).forEach((el)=> {if(str.includes(el)){ delete obj[el]}})
       
  return obj;
}
*/
