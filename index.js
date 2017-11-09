const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const model = require('./models/User');
const passportConfig = require('./config/passport');

module.exports = function(core) {
  app.set('model', model);
  app.set('views', path.join(__dirname, 'views'));
  app.set('service', passportConfig(app));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
  app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
      req.session.returnTo = req.path;
    } else if (req.user &&
      req.path === '/account') {
      req.session.returnTo = req.path;
    }
    next();
  });
  app.use((req, res, next) => {
    res.locals.baseurl = app.path();
    next();
  });

  const routes = require('./routes/account')(app);

  app.use('/', routes)

  return app
};