import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/authRoutes.js";
import usersRoutes from "./routes/users/users.js";
import childrenRoutes from "./routes/children/children.js";
import contactsRoutes from "./routes/contacts/contacts.js";
import documentsRoutes from "./routes/documents/documents.js";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));

// Increase JSON & URL-encoded body size to handle large base64 images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: ["http://localhost:8081", "http://192.168.1.238:8081"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/children", childrenRoutes);
app.use("/api/v1/contacts", contactsRoutes);
app.use("/api/v1/documents", documentsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at:`);
  console.log(`   Local:    http://localhost:${PORT}`);
});
