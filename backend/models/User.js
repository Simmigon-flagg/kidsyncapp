import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from "crypto";
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
    profileImage: String, // quick-access URL (optional)

    // ✅ add these three fields to match your PUT route
    imageFileId: {
      type: Schema.Types.ObjectId,
      ref: 'uploads.files',
    },
    imageFileName: String,
    imageContentType: String,

    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    refreshToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);


UserSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password)
}
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); 

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min

  return resetToken;
};


const User = models.User || model('User', UserSchema);
export default User;
