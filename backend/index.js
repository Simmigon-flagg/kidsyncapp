import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/authRoutes.js";
import contactsRoutes from "./routes/contact/contacts.js";
import os from "os";
import morgan from "morgan";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:8081", "http://192.168.1.238:8081"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contacts", contactsRoutes);

app.listen(PORT, () => {

  console.log(`🚀 Server running at:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  
});
