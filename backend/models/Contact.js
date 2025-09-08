import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    // childId: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Children'
    // },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // groupId: {
    //     type: Schema.Types.ObjectId,
    //     ref: "LogGroup",
    //     required: true
    // },
    child: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Children" }, // optional reference
      name: { type: String }, // human-friendly display name
    },
    // GridFS reference for profile picture
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "uploads.files", // GridFS bucket
    },
    imageFileName: { type: String },
    imageContentType: { type: String },

    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: { type: String },
    phone: { type: String },
    relationship: { type: String },

    // dicebear avatar fallback
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

export default Contact;
