import crypto from 'crypto';
import { connectToDatabase } from '../../utils/database';
import User from '../../models/User';
import jwt from 'jsonwebtoken';

export async function generateAndStoreRefreshToken(email) {
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return null;

  const refreshToken = crypto.randomBytes(40).toString('hex');
  user.refreshToken = refreshToken;
  await user.save();

  return refreshToken;
}
export async function verifyRefreshTokenAndGenerateAccessToken(refreshToken) {
  await connectToDatabase();
  const user = await User.findOne({ refreshToken });
  if (!user) return null;

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: '15m' }
  );

  return accessToken;
}
