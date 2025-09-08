import mongoose from "mongoose";

const ChildrenSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"], // or remove required if optional
    },
    // GridFS reference for profile picture
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "uploads.files", // GridFS bucket
    },
    imageFileName: { type: String },
    imageContentType: { type: String },
    // dicebear avatar fallback
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

const Children =
  mongoose.models.Children || mongoose.model("Children", ChildrenSchema);

export default Children;
