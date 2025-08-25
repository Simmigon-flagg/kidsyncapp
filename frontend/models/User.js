import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: [true, 'Email already exists'],
      required: [true, 'Email is required'],
    },
    name: String,
    image: String, 
    imageId: {
      type: Schema.Types.ObjectId,
      ref: 'uploads.files',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    todos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Todo',
      },
    ],
    refreshToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password)
}
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); 

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return resetToken;
};

const User = models.User || model('User', UserSchema);
export default User;
