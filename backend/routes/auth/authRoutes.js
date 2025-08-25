import express from "express";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { sendEmail } from "../../lib/sendEmail.js";
import { connectToDatabase } from "../../lib/database.js";

const router = express.Router();

// Generate JWT
const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// ---------------------- REGISTER ----------------------
router.post("/register", async (req, res) => {
  await connectToDatabase();
  try {
    console.log(req.body)
    const { email, name, password } = req.body;
   
    if (!email || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 3) {
      return res
        .status(400)
        .json({ message: "Password must be at least 3 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    const user = new User({ email, name, password, profileImage });
    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        imageId: user.profileImage 
      },
      message: "Sign up successful",
    });
  } catch (error) {
    console.error("Error in register route:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

// ---------------------- LOGIN ----------------------
router.post("/login", async (req, res) => {
  await connectToDatabase();
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in login route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------- FORGOT PASSWORD ----------------------
router.post("/forgot-password", async (req, res) => {
  await connectToDatabase();
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Always respond success to avoid revealing if email exists
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link will be sent" });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      "Password Reset Request",
      `Click this link to reset your password: ${resetURL}\nIf you did not request this, ignore this email.`
    );

    return res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------- RESET PASSWORD ----------------------
router.post("/reset-password", async (req, res) => {
  await connectToDatabase();
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    // Hash token for comparison
    const crypto = await import("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error in reset-password route:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
});

export default router;
