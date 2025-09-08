import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Children from "../../models/Children.js";
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

router.post("/", protectedRoute, upload.single("file"), async (req, res) => {
  await connectToDatabase();
  console.log(req.body);
  try {
    const { name, dateOfBirth, owner, fileBase64, fileName, fileType } =
      req.body;
    // generate profileImage fallback
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      name || "profile"
    )}`;

    let imageMeta = null;

    // 1) If multer parsed a file (mobile FormData)
    if (req.file && req.file.buffer) {
      imageMeta = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname || `${name || "children"}.png`,
        req.file.mimetype || "image/png"
      );
    }
    // 2) If client sent base64 (web/Expo)
    else if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      imageMeta = await uploadBufferToGridFS(
        buffer,
        fileName || `${name || "children"}.png`,
        fileType || "image/png"
      );
    }

    const children = await Children.create({
      owner,
      name,
      dateOfBirth,
      profileImage,
      imageFileId: imageMeta?.fileId || null,
      imageFileName: imageMeta?.filename || null,
      imageContentType: imageMeta?.contentType || null,
    });

    // add to user
    const user = await Users.findById(owner);
    if (user) {
      user.children.push(children._id);
      await user.save();
    }

    return res.status(201).json({ children });
  } catch (err) {
    console.error("Error in child POST route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get paginated list of contacts
router.get("/", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = request.query.search?.trim();

    // 1. Get the logged-in user with their contacts array
    const user = await Users.findById(request.user._id).select("children");
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    // 2. Build query
    let query = { _id: { $in: user.children } };

    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      query = {
        ...query,
        $or: [{ name: regex }],
      };
    }

    // 3. Query contacts
    const children = await Children.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name profileImage");

    // 4. Count for pagination
    const totalChildren = await Children.countDocuments(query);
    const totalPages = Math.ceil(totalChildren / limit);

    return response.status(200).json({
      children,
      currentPage: page,
      totalChildren,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("Error in children route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

router.get("/list", protectedRoute, async (request, response) => {

  await connectToDatabase();

  try {
    const user = await Users.findById(request.user._id).select("children");
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    const children = await Children.find({ _id: { $in: user.children } }).select("_id name");


    return response.status(200).json({ children });
  } catch (error) {
    console.error("Error in children route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});


// Get all contacts for the logged-in user (non-paginated)
router.get("/user", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const children = await Children.find({ owner: request.user._id })
      .sort({ createdAt: -1 })
      .populate("owner", "name");

    return response.status(200).json(children);
  } catch (error) {
    console.error("Error in children/user route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Delete a children from owner
router.delete("/:_id", protectedRoute, async (request, response) => {
  await connectToDatabase();
  const _id = request.params._id;

  try {
    const user = await Users.findById(request.user._id);

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    const children = await Children.findById(_id);

    if (!children) {
      return response.status(404).json({ message: "Child not found" });
    }

    if (children.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    user.children = user.children.filter(
      (children) => children._id.toString() !== _id
    );
    request.user = user;

    await user.save();

    return response
      .status(200)
      .json({ message: "Children deleted successfully" });
  } catch (error) {
    console.error("Error deleting children", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Update a children (with GridFS image upload)
router.put("/:_id", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const { name, fileBase64, fileName, fileType } = req.body;
    const children = await Children.findById(req.params._id);

    if (!children) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (children.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update text fields
    if (name !== undefined) children.name = name;

    // If a new image was sent, upload it to GridFS
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");

      const imageMeta = await uploadBufferToGridFS(
        buffer,
        fileName || `${name || "children"}.png`,
        fileType || "image/png"
      );

      children.imageFileId = imageMeta.fileId;
      children.imageFileName = imageMeta.filename;
      children.imageContentType = imageMeta.contentType;
    }

    await children.save();
    return res.status(200).json({ children });
  } catch (error) {
    console.error("Error updating children", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get a children
router.get("/:_id", protectedRoute, async (request, response) => {
  await connectToDatabase();

  try {
    const children = await Children.findById(request.params._id);

    if (!children) {
      return response.status(404).json({ message: "Child not found" });
    }

    if (children.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    return response.status(200).json({ children });
  } catch (error) {
    console.error("Error updating children", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// routes/children/contacts.js — image route
router.get("/:id/image", async (req, res) => {
  try {
    const { bucket } = await connectToDatabase();
    const children = await Children.findById(req.params.id).select(
      "imageFileId imageContentType"
    );
    if (!children || !children.imageFileId)
      return res.status(404).json({ message: "Image not found" });

    const fileId = new mongoose.Types.ObjectId(children.imageFileId);
    res.set(
      "Content-Type",
      children.imageContentType || "application/octet-stream"
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
