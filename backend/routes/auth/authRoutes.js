import express from "express";
import jwt from "jsonwebtoken";
import Users from "../../models/User.js";

const router = express.Router();

// Generate JWT
const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// @route   POST /auth/register
router.post("/register", async (request, response) => {
  try {
    const { email, username, password } = request.body;
    console.log("Registering: ", email, username, password);

    if (!email || !username || !password) {
      return response.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 3) {
      return response.status(400).json({ message: "Password must be at least 3 characters" });
    }

    if (username.length < 3) {
      return response.status(400).json({ message: "Username must be at least 3 characters" });
    }

    const existingEmail = await Users.findOne({ email });
    
    if (existingEmail) {
      return response.status(409).json({ message: "That email already exists" });
    }

    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = new Users({
      email,
      username,
      password,
      profileImage,

    });
    await user.save()
    const token = generateToken(user._id);
   
    return response.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      message: "Sign up successful",
    });
  } catch (error) {
    console.error("Error in register route:", error);
    return response.status(500).json({ message: "Internal server error", error });
  }
});

// @route   POST /auth/login
router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "All fields are required" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return response.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return response.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    return response.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
    });
  } catch (error) {
    console.error("Error in login route:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

export default router;
