const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const userRouter = express.Router();

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword); //which will recive token and resets password
// After this middle ware all protect middleware runs
//Protect all routes after this middleware
userRouter.use(authController.protect);
userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
userRouter.delete('/deleteMe', authController.protect, userController.deleteMe);

userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

//PROTECTECT to ADMIN
userRouter.use(authController.restrictTo('admin'));
userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

//POST /tour/234fda/reviews
//POST /tour/234fda/reviews
//POST /tour/234fda/reviews/98554u

module.exports = userRouter;
