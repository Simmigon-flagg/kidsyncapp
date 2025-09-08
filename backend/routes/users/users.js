import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Users from "../../models/User.js";
import { connectToDatabase } from "../../lib/database.js";
import multer from "multer";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const router = express.Router();
// memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

export async function uploadBufferToGridFS(
  buffer,
  filename = `${Date.now()}`,
  contentType = "application/octet-stream"
) {
  
 const { bucket } = await connectToDatabase(); // use shared bucket

  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { contentType });
    stream.on("error", (err) => reject(err));
    stream.on("finish", () => {
      resolve({
        fileId: stream.id, // <- correct place to read the file id
        filename,
        length: Buffer.byteLength(buffer),
        contentType,
      });
    });
    stream.end(buffer);
  });
}

router.put("/:_id", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const { fileBase64, fileName, fileType } = req.body;
    const user = await Users.findById(req.params._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Fix auth check
    if (req.user._id.toString() !== req.params._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ If a new image was sent, upload it to GridFS
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");

      const imageMeta = await uploadBufferToGridFS(
        buffer,
        fileName || `${user.name || "user"}.png`,
        fileType || "image/png"
      );

      user.imageFileId = imageMeta.fileId;
      user.imageFileName = imageMeta.filename;
      user.imageContentType = imageMeta.contentType;

      // store a quick-access URL (optional)
      user.profileImage = `/api/v1/users/${user._id}/image`;
    }

    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error updating user", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});




router.get("/:id/image", async (req, res) => {
 
  try {
    const { bucket } = await connectToDatabase();
    const user = await Users.findById(req.params.id).select(
      "imageFileId imageContentType"
    );
    if (!user || !user.imageFileId)
      return res.status(404).json({ message: "Image not found" });

    
 
    const fileId = new mongoose.Types.ObjectId(user.imageFileId);
    res.set(
      "Content-Type",
      user.imageContentType || "application/octet-stream"
    );

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      console.error("GridFS stream error:", err);
      res.sendStatus(500);
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error("Error streaming image:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
