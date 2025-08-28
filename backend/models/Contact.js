import mongoose from "mongoose";


const ContactSchema = new mongoose.Schema({
    // childId: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Children'
    // },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // groupId: {
    //     type: Schema.Types.ObjectId,
    //     ref: "LogGroup",
    //     required: true
    // },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }, // Profile picture
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    relationship: {
        type: String
    },
    profileImage: {
        type: String
    },

    
}, { timestamps: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export default Contact;