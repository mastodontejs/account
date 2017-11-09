const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

module.exports = (app) => {
  const User = app.get('model');

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  /**
   * Sign in using Email and Password.
   */
  passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      user.comparePassword(password, (err, isMatch) => {
        if (err) { return done(err); }
        if (isMatch) {
          return done(null, user);
        }
        return done(null, false, { msg: 'Invalid email or password.' });
      });
    });
  }));
  return {
    /**
    * Login Required middleware.
    */
    isAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect(`${app.path()}/login`);
    },
    /**
    * Authorization Required middleware.
    */
    isAuthorized(req, res, next) {
      const provider = req.path.split('/').slice(-1)[0];
      const token = req.user.tokens.find(token => token.kind === provider);
      if (token) {
        next();
      } else {
        res.redirect(`${app.path()}/auth/${provider}`);
      }
    }
  }
}