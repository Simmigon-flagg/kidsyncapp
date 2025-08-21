import "dotenv/config";
import express from "express";
import cors from "cors"
import authRoutes from "./routes/auth/authRoutes.js"
import contactsRoutes from "./routes/contact/contacts.js"
import { connectToDatabase } from "./lib/database.js"
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/contacts", contactsRoutes)

console.log({ PORT });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectToDatabase()
});
