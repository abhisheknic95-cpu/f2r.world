import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

export const initializePassport = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials not configured. Skipping Google auth setup.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const profilePicture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Check if user exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists with Google ID, update profile picture if changed
            if (profilePicture && user.profilePicture !== profilePicture) {
              user.profilePicture = profilePicture;
              await user.save();
            }
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.isVerified = true;
            if (profilePicture && !user.profilePicture) {
              user.profilePicture = profilePicture;
            }
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || 'Google User',
            email,
            phone: `google_${profile.id}`, // Temporary placeholder, user should update
            googleId: profile.id,
            profilePicture,
            isVerified: true,
            role: 'customer',
          });

          done(null, user);
        } catch (error) {
          console.error('Google OAuth Error:', error);
          done(error);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export default passport;
