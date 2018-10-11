import validator from './validator';
import limiter from './limits';
import locks from 'mongo-locks';
import constants from './constants';
import { Request } from '../types';

import {Strategy as LocalStrategy} from 'passport-local';
import {OAuth2Strategy as GoogleStrategy} from 'passport-google-oauth';

// load up the user model
import User from '../models/user';
import configAuth from './auth';

// expose this function to our app using module.exports
export default (passport) => {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
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
    async (req: Request, email, password, done) => {
      let free = () => {};
      try {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        const username = validator.validateUser(req.body.username);
        email = validator.validateEmail(email);
        validator.validatePassword(password);

        const count = await User.count({"security.lastIp": req.ip}).limit(constants.maxAccountsPerIp);
        if (count >= constants.maxAccountsPerIp || !(await limiter.possible(req.ip, "accountip"))) {
          throw new Error("Too many users with that ip, you can't create a new account");
        }

        free = await locks.lock("account", req.ip);

        const user = await User.findOne().or([
          {'local.username': username},
          {'local.email': email},
          {'google.email': email}
        ]);

        // check to see if theres already a user with that email
        if (user) {
          let message;
          if (user.local.username.toLowerCase().localeCompare(username.toLowerCase()) === 0) {
            message = `${user.local.username} is already taken.`;
          } else if (user.local.email === email) {
            message = "That email is already taken.";
          } else {
            message = "That email is already taken by a social account, use social  login instead!";
          }

          throw new Error(message);
        }

        // if there is no user with that email
        // create the user
        const newUser            = new User();

        // set the user's local credentials
        newUser.local.username = username;
        newUser.local.email    = email;
        newUser.local.password = await User.generateHash(password);
        newUser.fillInSecurity(req.ip);

        // save the user
        await newUser.save();

        await limiter.action(req.ip, "accountip", email);

        newUser.sendConfirmationEmail();

        return done(null, newUser);
      } catch (err) {
        free();
        return done(null, false, req.flash('signupMessage', err.message));
      }
    })
  );

  passport.use('local-reset', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    async (req: Request, email, password, done) => {
      try {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        email = validator.validateEmail(email);
        validator.validatePassword(password);

        const user = await User.findOne({'local.email': email});

        // check to see if theres already a user with that email
        if (!user) {
          throw new Error("A user with that email does not exist.");
        }

        user.validateResetKey(req.body.resetKey);

        // set the user's local credentials
        await user.resetPassword(password);

        await user.notifyLogin(req.ip);

        done(null, user);
      } catch (err) {
        // return done(err);
        done(null, false, req.flash('resetMessage', err.message));
      }
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
    async (req: Request, email, password, done) => {
      try {
        const user = await User.findOne({ 'local.email' :  email });
        // if no user is found, return the message
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'No user found.'));
        } // req.flash is the way to set flashdata using connect-flash

        // if the user is found but the password is wrong
        if (!(await user.validPassword(password))) {
          return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
        }

        // all is well, return successful user
        await user.notifyLogin(req.ip);

        done(null, user);
      } catch (err) {
        done(err);
      }
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
  (token, refreshToken, profile, done) => {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(() => {
        const email = validator.validateEmail(profile.emails[0].value);

        // try to find the user based on their google id
        User.findOne().or([{ 'google.id' : profile.id },
          {'local.email': email}]).exec((err, user) => {
          if (err) {
            return done(err);
          }

          if (user) {
            // if a user is found, log them in
            return done(null, user); // return user.notifyLogin(req.ip).then(() => done(null, user), done);
          }

          // if the user isnt in our database, create a new user
          const newUser          = new User();

          // set all of the relevant information
          newUser.google.id    = profile.id;
          newUser.google.token = token;
          newUser.google.name  = profile.displayName;
          newUser.google.email = email; // pull the first email
          newUser.new = true; // newUser.fillInSecurity(req.ip);

          // save the user
          newUser.save(_err => {
            if (_err) {
              return done(_err);
            }
            return done(null, newUser);
          });
        });
      });

    }));
};
