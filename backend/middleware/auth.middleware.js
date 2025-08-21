import jwt from "jsonwebtoken";
import Users from "../models/User.js";

const protectedRoute = async (request, response, next) => {
    try {
        const token = request.header("Authorization").replace("Bearer ", "")
        if (!token) return response.status(401).json({ message: "No authentication toekn, access denied" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Users.findById(decoded.user_id).select("-password")
        if (!user) return response.status(401).json({ message: "Invalid Token" })

        request.user = user
        next();


    } catch (error) {

    }
}

export default protectedRoute;