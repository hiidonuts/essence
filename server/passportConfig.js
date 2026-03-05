const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');

// In-memory user storage (same as in auth.js)
const users = {};
let nextUserId = 1;

module.exports = function(passport) {
  // Check if required environment variables are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials not found in environment variables');
  }
  
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn('GitHub OAuth credentials not found in environment variables');
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    const user = users[email];
    if (!user) return done(null, false);
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return done(null, false);
    return done(null, user);
  }));

  // Only initialize Google OAuth if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Initializing Google OAuth strategy');
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://essence-silk.vercel.app/api/auth/google/callback'
        : '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      console.log('Google OAuth callback received for:', profile.emails?.[0]?.value);
      let user = Object.values(users).find(u => u.googleId === profile.id);
      if (!user) {
        const id = String(nextUserId++);
        user = {
          id,
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        };
        users[user.email] = user;
        console.log('Created new Google user:', user.email);
      }
      return done(null, user);
    }));
  } else {
    console.log('Google OAuth credentials not found, skipping Google strategy');
  }

  // Only initialize GitHub OAuth if credentials are available
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log('Initializing GitHub OAuth strategy');
    passport.use('github', new GithubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://essence-silk.vercel.app/api/auth/github/callback'
        : '/api/auth/github/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      console.log('GitHub OAuth callback received for:', profile.emails?.[0]?.value);
      let user = Object.values(users).find(u => u.githubId === profile.id);
      if (!user) {
        const id = String(nextUserId++);
        user = {
          id,
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.local`,
        };
        users[user.email] = user;
        console.log('Created new GitHub user:', user.email);
      }
      return done(null, user);
    }));
  } else {
    console.log('GitHub OAuth credentials not found, skipping GitHub strategy');
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    const user = Object.values(users).find(u => u.id === id);
    done(null, user);
  });
};
