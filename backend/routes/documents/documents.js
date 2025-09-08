// routes/document/documents.js
import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Documents from "../../models/Document.js";
import Users from "../../models/User.js";
import { connectToDatabase } from "../../lib/database.js";
import multer from "multer";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ---- Upload helper ----
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
        fileId: stream.id,
        filename,
        length: Buffer.byteLength(buffer),
        contentType,
      });
    });
    stream.end(buffer);
  });
}
// ---- Update document ----
router.put("/:_id", protectedRoute, upload.single("file"), async (req, res) => {
  await connectToDatabase();

  try {
    const { title } = req.body;
    const updatedDocument = await Documents.findById(req.params._id);
    if (!updatedDocument)
      return res.status(404).json({ message: "Document not found" });
    if (updatedDocument.owner.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // Update title if provided
    if (title !== undefined) updatedDocument.title = title;

    if (req.file && req.file.buffer) {
      const imageMeta = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname || updatedDocument.fileName,
        req.file.mimetype || updatedDocument.contentType
      );

      updatedDocument.fileId = imageMeta.fileId;
      updatedDocument.fileName = imageMeta.filename;
      updatedDocument.contentType = imageMeta.contentType;
    }

    const document = await updatedDocument.save();

    console.log("PUT +++ document", document);
    return res.status(200).json({ document });
  } catch (err) {
    console.error("Error updating document:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Create Document ----
router.post("/", protectedRoute, upload.single("file"), async (req, res) => {
  await connectToDatabase();
  try {
    const { title, fileBase64, fileName, fileType, child } = req.body;

    const childData = JSON.parse(child);

    const owner = req.user._id;

    let imageMeta = null;

    if (req.file && req.file.buffer) {
      // File uploaded via FormData
      imageMeta = await uploadBufferToGridFS(
        req.file.buffer,
        req.file.originalname || `${title || "document"}.bin`,
        req.file.mimetype || "application/octet-stream"
      );
    } else if (fileBase64) {
      // File uploaded as base64
      const buffer = Buffer.from(fileBase64, "base64");
      imageMeta = await uploadBufferToGridFS(
        buffer,
        fileName || `${title || "document"}.bin`,
        fileType || "application/octet-stream"
      );
    }

    const document = await Documents.create({
      owner,
      title, // <-- matches schema
      child: {
        _id: childData._id,
        name: childData.name,
      },
      fileId: imageMeta?.fileId || null,
      fileName: imageMeta?.filename || null,
      contentType: imageMeta?.contentType || null,
    });

    const user = await Users.findById(owner);
    if (user) {
      user.documents.push(document._id);
      await user.save();
    }

    return res.status(201).json({ document });
  } catch (err) {
    console.error("Error in document POST route:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Get paginated documents ----
router.get("/", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const user = await Users.findById(req.user._id).select("documents");
    if (!user) return res.status(404).json({ message: "User not found" });

    let query = { _id: { $in: user.documents } };

    if (search) {
      const regex = new RegExp(search, "i");
      query = { ...query, $or: [{ title: regex }, { imageFileName: regex }] };
    }

    const documents = await Documents.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "title");
    console.log("documents", documents);
    const totalDocuments = await Documents.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    return res.status(200).json({
      documents,
      currentPage: page,
      totalDocuments,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    console.error("Error in documents GET:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Get user documents (all) ----
router.get("/user", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const documents = await Documents.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate("owner", "name");
    return res.status(200).json(documents);
  } catch (err) {
    console.error("Error in documents/user GET:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Delete a document ----
router.delete("/:_id", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const { _id } = req.params;
    const user = await Users.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const document = await Documents.findById(_id);
    if (!document)
      return res.status(404).json({ message: "Document not found" });
    if (document.owner.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    user.documents = user.documents.filter((docId) => docId.toString() !== _id);
    await user.save();
    await document.deleteOne();

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Get one document ----
router.get("/:_id", protectedRoute, async (req, res) => {
  await connectToDatabase();
  try {
    const document = await Documents.findById(req.params._id);
    console.log("_id +++++++", req.params._id);
    if (!document)
      return res.status(404).json({ message: "Document not found" });
    if (document.owner.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });
    console.log("GET *****", document);
    return res.status(200).json({ document });
  } catch (err) {
    console.error("Error fetching document:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---- Get document image ----
// ---- Get document file ----
router.get("/:id/file", async (req, res) => {
  try {
    const { bucket } = await connectToDatabase(); // use the shared bucket
    const document = await Documents.findById(req.params.id).select(
      "fileId contentType"
    );
    const fileId = new mongoose.Types.ObjectId(document.fileId);
    res.set("Content-Type", document.contentType || "application/octet-stream");

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

  //   if (!document || !document.fileId)
  //     return res.status(404).json({ message: "File not found" });

  //   const fileId = new mongoose.Types.ObjectId(document.fileId);
  //   res.set("Content-Type", document.contentType || "application/octet-stream");

  //   bucket
  //     .openDownloadStream(fileId)
  //     .pipe(res)
  //     .on("error", (err) => {
  //       console.error("GridFS stream error:", err);
  //       res.sendStatus(500);
  //     });
  // } catch (err) {
  //   console.error("Error streaming file:", err);
  //   res.status(500).json({ message: "Internal server error" });
  // }
});

export default router;
