import User from '../../models/user';
import { connectToDatabase } from '../../utils/database';
import { sendEmail } from '../../utils/sendEmail';
import crypto from 'crypto';

export async function updateUserByEmail(email, data) {
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return null;

  Object.assign(user, data);
  await user.save();
  return user;
}

export async function getUserProfile(email) {
  const { bucket } = await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return null;

  let imagefileUrl = null;
  if (user.imageId) {
    const image = await bucket.find({ _id: user.imageId }).toArray();
    if (image.length > 0) {
      imagefileUrl = `/api/images/${image[0]._id.toString()}`;
    }
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    imagefileUrl,
    children: user.children,
  };
}

export async function checkUserExists(email) {
  await connectToDatabase();
  return User.findOne({ email }).select('_id');
}

export async function resetPassword(token, newPassword) {
  await connectToDatabase();

  if (!token || !newPassword) {
    throw { status: 400, message: 'Missing token or password' };
  }

  // Clean token and hash it
  token = token.trim().replace(/\s/g, '');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw { status: 400, message: 'Token invalid or expired' };
  }

  // Just set plain password; pre-save hook will hash it
  user.password = newPassword;

  // Clear reset token fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  return true;
}

export async function requestPasswordReset(email) {

  if (!email) {
    throw { status: 400, message: 'Email is required' };
  }


  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user) {
    // Always return success to avoid revealing if email exists
    return;
  }

  // Model instance method generates token + expiry
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

  await sendEmail(
    user.email,
    'Password Reset Request',
    `You requested a password reset.\n\nPlease click this link to reset your password: ${resetURL}\n\nIf you did not request this, ignore this email.`
  );
}
