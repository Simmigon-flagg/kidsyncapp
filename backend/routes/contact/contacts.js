import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Contacts from "../../models/Contact.js";
import Users from "../../models/User.js";
import { connectToDatabase } from "../../lib/database.js";

const router = express.Router();

// Create a new contact
router.post("/", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const { email, relationship, imageId, name, phone, owner } = request.body;
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    const contact = await Contacts.create({
      owner, // using 'owner' as the field for the user
      email,
      imageId,
      name,
      phone,
      relationship,
      profileImage,
    });

    const user = await Users.findById(owner);
    await contact.save();

    user.contacts.push(contact._id);
    await user.save();

    return response.status(201).json({ contact });
  } catch (error) {
    console.error("Error in the contact route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Get paginated list of contacts
// Get paginated list of contacts
router.get("/", protectedRoute, async (request, response) => {
  await connectToDatabase();
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 5;
    const skip = (page - 1) * limit;

    // 1. Get the logged-in user with their contacts array
    const user = await Users.findById(request.user._id).select("contacts");
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    // 2. Query contacts using those IDs
    const contacts = await Contacts.find({ _id: { $in: user.contacts } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name profileImage"); // Include owner details if needed

    // 3. Count for pagination
    const totalContacts = await Contacts.countDocuments({
      _id: { $in: user.contacts },
    });
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

export default router;
