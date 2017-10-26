const express = require('express');
const router = express.Router();
const passport = require('passport');

module.exports = (app) => {
  /**
   * API keys and Passport configuration.
   */
  const passportConfig = require('../config/passport')(app);
  
  /**
   * Controllers (route handlers).
   */
  const userController = require('../controllers/user')(app);
  
  router.get('/', passportConfig.isAuthenticated, userController.getAccount);
  router.get('/login', userController.getLogin);
  router.post('/login', userController.postLogin);
  router.get('/logout', userController.logout);
  router.get('/signup', userController.getSignup);
  router.post('/signup', userController.postSignup);
  router.post('/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
  router.post('/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
  router.post('/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
  router.get('/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
  
  /**
   * OAuth authentication routes. (Sign in)
   */
  router.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
  router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });

  return router;
}