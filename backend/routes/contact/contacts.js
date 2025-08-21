import express from "express";
import protectedRoute from "../../middleware/auth.middleware.js";
import Contacts from "../../models/Contact.js";

const router = express.Router();

// Create a new contact
router.post("/", protectedRoute, async (request, response) => {
  try {
    const { email, relationship, imageId, name, phone } = request.body;

    const contact = await Contacts.create({
      owner: request.user._id, // using 'owner' as the field for the user
      email,
      imageId,
      name,
      phone,
      relationship,
    });

    await contact.save();

    return response.status(201).json({ contact });
  } catch (error) {
    console.error("Error in the contact route", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});

// Get paginated list of contacts
// Get paginated list of contacts
router.get("/", protectedRoute, async (request, response) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Fetch contacts for logged-in user with pagination
    const contacts = await Contacts.find({ owner: request.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "name profileImage"); // Include only needed fields

    // Total for pagination UI
    const totalContacts = await Contacts.countDocuments({ owner: request.user._id });
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

// Delete a contact
router.delete("/:id", protectedRoute, async (request, response) => {
  try {
    const contact = await Contacts.findById(request.params.id);

    if (!contact) {
      return response.status(404).json({ message: "Contact not found" });
    }

    if (contact.owner.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    await contact.deleteOne();

    return response.status(204).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact", error);
    return response.status(500).json({ message: "Internal server error" });
  }
});


// Update a contact
router.put("/:id", protectedRoute, async (request, response) => {
  try {
    const { name, phone, email, relationship, imageId } = request.body;

    const contact = await Contacts.findById(request.params.id);

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
