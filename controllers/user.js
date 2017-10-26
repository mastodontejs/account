const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const passport = require('passport');
const User = require('../models/User');

module.exports = (app) => {
  return {
    /**
    * GET /login
    * Login page.
    */
    getLogin(req, res) {
      if (req.user) {
        return res.redirect('/');
      }
      res.render('login', {
        title: 'Login'
      });
    },
    /**
    * POST /login
    * Sign in using email and password.
    */
    postLogin(req, res, next) {
      req.assert('email', 'Email is not valid').isEmail();
      req.assert('password', 'Password cannot be blank').notEmpty();
      req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

      const errors = req.validationErrors();

      if (errors) {
        req.flash('errors', errors);
        return res.redirect(`${app.path()}/login`);
      }

      passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
          req.flash('errors', info);
          return res.redirect(`${app.path()}/login`);
        }
        req.logIn(user, (err) => {
          if (err) { return next(err); }
          req.flash('success', { msg: 'Success! You are logged in.' });
          res.redirect(req.session.returnTo || '/');
        });
      })(req, res, next);
    },
    /**
    * GET /logout
    * Log out.
    */
    logout(req, res) {
      req.logout();
      res.redirect('/');
    },
    /**
    * GET /signup
    * Signup page.
    */
    getSignup(req, res) {
      if (req.user) {
        return res.redirect('/');
      }
      res.render('signup', {
        title: 'Create Account'
      });
    },
    /**
    * POST /signup
    * Create a new local account.
    */
    postSignup(req, res, next) {
      req.assert('email', 'Email is not valid').isEmail();
      req.assert('password', 'Password must be at least 4 characters long').len(4);
      req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
      req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

      const errors = req.validationErrors();

      if (errors) {
        req.flash('errors', errors);
        return res.redirect(`${app.path()}/signup`);
      }

      const user = new User({
        email: req.body.email,
        password: req.body.password
      });

      User.findOne({ email: req.body.email }, (err, existingUser) => {
        if (err) { return next(err); }
        if (existingUser) {
          req.flash('errors', { msg: 'Account with that email address already exists.' });
          return res.redirect(`${app.path()}/signup`);
        }
        user.save((err) => {
          if (err) { return next(err); }
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect('/');
          });
        });
      });
    },
    /**
    * GET /account
    * Profile page.
    */
    getAccount(req, res) {
      res.render('profile', {
        title: 'Account Management'
      });
    },
    /**
    * POST /account/profile
    * Update profile information.
    */
    postUpdateProfile(req, res, next) {
      req.assert('email', 'Please enter a valid email address.').isEmail();
      req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

      const errors = req.validationErrors();

      if (errors) {
        req.flash('errors', errors);
        return res.redirect(app.path());
      }

      User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.location = req.body.location || '';
        user.profile.website = req.body.website || '';
        user.save((err) => {
          if (err) {
            if (err.code === 11000) {
              req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
              return res.redirect(app.path());
            }
            return next(err);
          }
          req.flash('success', { msg: 'Profile information has been updated.' });
          res.redirect(app.path());
        });
      });
    },
    /**
    * POST /account/password
    * Update current password.
    */
    postUpdatePassword(req, res, next) {
      req.assert('password', 'Password must be at least 4 characters long').len(4);
      req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

      const errors = req.validationErrors();

      if (errors) {
        req.flash('errors', errors);
        return res.redirect(app.path());
      }

      User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user.password = req.body.password;
        user.save((err) => {
          if (err) { return next(err); }
          req.flash('success', { msg: 'Password has been changed.' });
          res.redirect(app.path());
        });
      });
    },
    /**
    * POST /account/delete
    * Delete user account.
    */
    postDeleteAccount(req, res, next) {
      User.remove({ _id: req.user.id }, (err) => {
        if (err) { return next(err); }
        req.logout();
        req.flash('info', { msg: 'Your account has been deleted.' });
        res.redirect('/');
      });
    },
    /**
    * GET /account/unlink/:provider
    * Unlink OAuth provider.
    */
    getOauthUnlink(req, res, next) {
      const provider = req.params.provider;
      User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user[provider] = undefined;
        user.tokens = user.tokens.filter(token => token.kind !== provider);
        user.save((err) => {
          if (err) { return next(err); }
          req.flash('info', { msg: `${provider} account has been unlinked.` });
          res.redirect(app.path());
        });
      });
    }
  }
}