import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Contacts from "../../models/Contact.js";
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
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: "images" });

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
  try {
    const {
      name,
      phone,
      email,
      relationship,
      owner,
      fileBase64,
      fileName,
      fileType,
    } = req.body;

    // generate profileImage fallback
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      name || "profile"
    )}`;

    let imageMeta = null;

    // 1) If multer parsed a file (mobile FormData)
    if (req.file && req.file.buffer) {
      imageMeta = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname || `${name || "contact"}.png`,
        req.file.mimetype || "image/png"
      );
    }
    // 2) If client sent base64 (web/Expo)
    else if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      imageMeta = await uploadBufferToGridFS(
        buffer,
        fileName || `${name || "contact"}.png`,
        fileType || "image/png"
      );
    }

    const contact = await Contacts.create({
      owner,
      name,
      phone,
      email,
      relationship,
      profileImage,
      imageFileId: imageMeta?.fileId || null,
      imageFileName: imageMeta?.filename || null,
      imageContentType: imageMeta?.contentType || null,
    });

    // add to user
    const user = await Users.findById(owner);
    if (user) {
      user.contacts.push(contact._id);
      await user.save();
    }

    return res.status(201).json({ contact });
  } catch (err) {
    console.error("Error in contact POST route:", err);
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
    const user = await Users.findById(request.user._id).select("contacts");
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    // 2. Build query
    let query = { _id: { $in: user.contacts } };

    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      query = {
        ...query,
        $or: [{ name: regex }, { phone: regex }, { email: regex }],
      };
    }

    // 3. Query contacts
    const contacts = await Contacts.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name profileImage");

    // 4. Count for pagination
    const totalContacts = await Contacts.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limit);

    return response.status(200).json({
      contacts,
      currentPage: page,
      totalContacts,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("Error in contacts route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});


// Get all contacts for the logged-in user (non-paginated)
router.get("/user", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const contacts = await Contacts.find({ owner: request.user._id })
      .sort({ createdAt: -1 })
      .populate("owner", "name");

    return response.status(200).json(contacts);
  } catch (error) {
    console.error("Error in contacts/user route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Delete a contact from owner
router.delete("/:_id", protectedRoute, async (request, response) => {
  await connectToDatabase();
  const _id = request.params._id;

  try {
    const user = await Users.findById(request.user._id);

    if (!user) {
      return response.status(404).json({ message: "Contact not found" });
    }

    const contact = await Contacts.findById(_id);

    if (!contact) {
      return response.status(404).json({ message: "Contact not found" });
    }

    if (contact.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    user.contacts = user.contacts.filter(
      (contact) => contact._id.toString() !== _id
    );
    request.user = user;

    await user.save();

    return response
      .status(200)
      .json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Update a contact
router.put("/:_id", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const { name, phone, email, relationship, imageId } = request.body;

    const contact = await Contacts.findById(request.params._id);

    if (!contact) {
      return response.status(404).json({ message: "Contact not found" });
    }

    if (contact.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    // Update only the fields provided
    if (name !== undefined) contact.name = name;
    if (phone !== undefined) contact.phone = phone;
    if (email !== undefined) contact.email = email;
    if (relationship !== undefined) contact.relationship = relationship;
    if (imageId !== undefined) contact.imageId = imageId;

    await contact.save();

    return response.status(200).json({ contact });
  } catch (error) {
    console.error("Error updating contact", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});
// Get a contact
router.get("/:_id", protectedRoute, async (request, response) => {
  await connectToDatabase();
  console.log("HERE", request.params._id);
  try {
    const contact = await Contacts.findById(request.params._id);

    if (!contact) {
      return response.status(404).json({ message: "Contact not found" });
    }

    if (contact.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    return response.status(200).json({ contact });
  } catch (error) {
    console.error("Error updating contact", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// routes/contact/contacts.js — image route
router.get("/:id/image", async (req, res) => {
  console.log("or here");
  try {
    await connectToDatabase();
    const contact = await Contacts.findById(req.params.id).select(
      "imageFileId imageContentType"
    );
    if (!contact || !contact.imageFileId)
      return res.status(404).json({ message: "Image not found" });

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "images",
    });
    const fileId = new mongoose.Types.ObjectId(contact.imageFileId);
    res.set(
      "Content-Type",
      contact.imageContentType || "application/octet-stream"
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
