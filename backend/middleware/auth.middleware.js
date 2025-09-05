import jwt from "jsonwebtoken";
import Users from "../models/User.js";
import { connectToDatabase } from "../lib/database.js";

const protectedRoute = async (request, response, next) => {
  await connectToDatabase();
  try {
    const authHeader = request.header("Authorization");
    if (!authHeader)
      return response
        .status(401)
        .json({ message: "No authentication token, access denied" });

    const token = authHeader.replace("Bearer ", "");
    console.log(token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Users.findById(decoded.user_id).select(
      "-password -contacts"
    );
    
    if (!user) return response.status(401).json({ message: "Invalid Token" });

    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protectedRoute;
