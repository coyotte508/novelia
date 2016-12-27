const validator = require('validator');
const co = require('co');

var LocalStrategy   = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var User            = require('../app/models/user');
var configAuth      = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      var process_signup = () => co(function*() { 
        try {
          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          var username = validator.validateUser(req.body.username);
          email = validator.validateEmail(email);
          validator.validatePassword(password);

          var user = yield User.findOne().or([
            { $text : { $search : username } },
            {'local.email': email},
            {'google.email': email}
          ]);

          // check to see if theres already a user with that email
          if (user) {
            var message;
            if (user.local.username.toLowerCase().localeCompare(username.toLowerCase()) == 0) {
              message = `${user.local.username} is already taken.`;
            } else if (user.local.email == email) {
              message = "That email is already taken.";
            } else {
              message = "That email is already taken by a social account, use social  login instead!";
            }

            throw new Error(message);
          }

          // if there is no user with that email
          // create the user
          var newUser            = new User();

          // set the user's local credentials
          newUser.local.username = username;
          newUser.local.email    = email;
          newUser.local.password = newUser.generateHash(password);

          // save the user
          yield newUser.save();

          return done(null, newUser);
        } catch (err) {
          //return done(err);
          return done(null, false, req.flash('signupMessage', err.message));
        }
      });

      process.nextTick(process_signup);
    })
  );

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({ 'local.email' :  email }, function(err, user) {
        email = validator.normalizeEmail(email);
        // if there are any errors, return the error before anything else
        if (err)
          return done(err);

        // if no user is found, return the message
        if (!user)
            return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

        // if the user is found but the password is wrong
        if (!user.validPassword(password))
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return done(null, user);
      });
    })
  );

  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use(new GoogleStrategy({
    clientID        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret,
    callbackURL     : configAuth.googleAuth.callbackURL,
  },
  function(token, refreshToken, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {
        // try to find the user based on their google id
        User.findOne().or([{ 'google.id' : profile.id },
          {'local.email': profile.emails[0].value}], function(err, user) {
          if (err) {
            return done(err);
          }

          if (user) {
            // if a user is found, log them in
            return done(null, user);
          }
          
          // if the user isnt in our database, create a new user
          var newUser          = new User();

          // set all of the relevant information
          newUser.google.id    = profile.id;
          newUser.google.token = token;
          newUser.google.name  = profile.displayName;
          newUser.google.email = profile.emails[0].value; // pull the first email

          // save the user
          newUser.save(function(err) {
            if (err)
              return done(err);
            return done(null, newUser);
          });
        });
      });

    }));
};