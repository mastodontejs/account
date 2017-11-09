const express = require('express');
const router = express.Router();
const passport = require('passport');

module.exports = (app) => {
  /**
   * API keys and Passport configuration.
   */
  const service = app.get('service');
  
  /**
   * Controllers (route handlers).
   */
  const userController = require('../controllers/user')(app);
  
  router.get('/', service.isAuthenticated, userController.getAccount);
  router.get('/login', userController.getLogin);
  router.post('/login', userController.postLogin);
  router.get('/logout', userController.logout);
  router.get('/signup', userController.getSignup);
  router.post('/signup', userController.postSignup);
  router.post('/profile', service.isAuthenticated, userController.postUpdateProfile);
  router.post('/password', service.isAuthenticated, userController.postUpdatePassword);
  router.post('/delete', service.isAuthenticated, userController.postDeleteAccount);
  
  return router;
}