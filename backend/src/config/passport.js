const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const env = require('./env');
const { User, Role } = require('../models');
const { comparePassword } = require('../utils/bcrypt');

// ─── Local Strategy ────────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: { email: email.toLowerCase().trim() },
          include: [{ model: Role, as: 'role' }],
        });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.is_active) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        if (!user.password_hash) {
          return done(null, false, { message: 'Please sign in with Google' });
        }

        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ─── Google Strategy ───────────────────────────────────────────────────────────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          const emailVerified = profile.emails && profile.emails[0] && profile.emails[0].verified;

          if (!email) {
            return done(null, false, { message: 'No email from Google account' });
          }

          if (!emailVerified) {
            return done(null, false, { message: 'Google email is not verified' });
          }

          // Return the profile — service layer handles find-or-create
          return done(null, { googleProfile: profile, email, emailVerified });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

module.exports = passport;
