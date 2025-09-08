import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // childId: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Children'
    // },
    // GridFS reference for profile picture
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "uploads.files", // GridFS bucket
    },
    fileName: { type: String },
    contentType: { type: String },
    title: { type: String }, // <-- Human-friendly title
    // groupId: {
    //     type: Schema.Types.ObjectId,
    //     ref: "LogGroup",
    //     required: true
    // },
  },
  { timestamps: true }
);

const Document =
  mongoose.models.Document || mongoose.model("Document", DocumentSchema);

export default Document;
