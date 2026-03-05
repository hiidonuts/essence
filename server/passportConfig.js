const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');

// In-memory user storage (same as in auth.js)
const users = {};
let nextUserId = 1;

module.exports = function(passport) {
  console.log('Starting passport configuration...');
  
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    const user = users[email];
    if (!user) return done(null, false);
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return done(null, false);
    return done(null, user);
  }));
  console.log('Local strategy registered');

  // Always initialize Google OAuth strategy
  try {
    console.log('Initializing Google OAuth strategy...');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'not set');
    
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://essence-silk.vercel.app/api/auth/google/callback'
        : '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return done(new Error('Google OAuth credentials not configured'));
      }
      
      console.log('Google OAuth callback received for:', profile.emails?.[0]?.value);
      console.log('Google profile data:', JSON.stringify(profile, null, 2));
      
      let user = Object.values(users).find(u => u.googleId === profile.id);
      if (!user) {
        const id = String(nextUserId++);
        user = {
          id,
          googleId: profile.id,
          name: profile.displayName || profile.name?.givenName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          profilePicture: profile.photos?.[0]?.value || null,
          provider: 'google'
        };
        users[user.email] = user;
        console.log('Created new Google user:', user.email);
      } else {
        // Update existing user with latest profile data
        user.name = profile.displayName || user.name;
        user.profilePicture = profile.photos?.[0]?.value || user.profilePicture;
        console.log('Updated existing Google user:', user.email);
      }
      return done(null, user);
    }));
    console.log('Google strategy registered successfully');
  } catch (error) {
    console.error('Failed to register Google strategy:', error);
  }

  // Always initialize GitHub OAuth strategy
  try {
    console.log('Initializing GitHub OAuth strategy...');
    console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'set' : 'not set');
    console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'set' : 'not set');
    
    passport.use('github', new GithubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://essence-silk.vercel.app/api/auth/github/callback'
        : '/api/auth/github/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return done(new Error('GitHub OAuth credentials not configured'));
      }
      
      console.log('GitHub OAuth callback received for:', profile.emails?.[0]?.value);
      console.log('GitHub profile data:', JSON.stringify(profile, null, 2));
      
      let user = Object.values(users).find(u => u.githubId === profile.id);
      if (!user) {
        const id = String(nextUserId++);
        user = {
          id,
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.local`,
          profilePicture: profile.photos?.[0]?.value || null,
          provider: 'github'
        };
        users[user.email] = user;
        console.log('Created new GitHub user:', user.email);
      } else {
        // Update existing user with latest profile data
        user.name = profile.displayName || profile.username || user.name;
        user.profilePicture = profile.photos?.[0]?.value || user.profilePicture;
        console.log('Updated existing GitHub user:', user.email);
      }
      return done(null, user);
    }));
    console.log('GitHub strategy registered successfully');
  } catch (error) {
    console.error('Failed to register GitHub strategy:', error);
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    const user = Object.values(users).find(u => u.id === id);
    done(null, user);
  });
};
