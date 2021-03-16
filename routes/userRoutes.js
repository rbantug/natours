const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router.post('/signup1', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); // not a 'post' or 'update' request  since we will only get a cookie.

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
// resetToken route is a patch request because we will modify the password field in the document

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadUserPhoto, userController.editUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.route('/me').get(userController.getMe, userController.getSingleUser);

router.use(authController.restrictedTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getSingleUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
