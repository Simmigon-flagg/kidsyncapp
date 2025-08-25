import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { Readable } from 'stream';
import User from '../../models/user';
import Todo from '../../models/todo';

export async function findUserByEmail(email) {
  return User.findOne({ email }).select('_id todos');
}

export async function uploadFileToGridFS(file) {
  if (!file || typeof file === 'string') return null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type,
    });
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      resolve({ fileId: uploadStream.id, filename: file.name });
    });
    uploadStream.on('error', reject);
  });
}

export async function createTodoForUser(userId, { title, notes, fileData }) {
  const newTodo = new Todo({
    title,
    notes,
    completed: false,
    fav: false,
    file: fileData,
    userId,
  });

  const saved = await newTodo.save();
  return saved;
}

export async function addTodoToUser(user, todoId) {
  user.todos.push(todoId);
  await user.save();
}

export async function getTodosByUser(
  userId,
  filters = {},
  pagination = {},
  sortConfig = {}
) {
  const query = { userId };

  // Filters (search, date range, completed, fav)
  if (filters.search) {
    query.title = { $regex: filters.search.trim(), $options: 'i' };
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate && !isNaN(new Date(filters.startDate))) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate && !isNaN(new Date(filters.endDate))) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.completed === 'true' || filters.completed === 'false') {
    query.completed = filters.completed === 'true';
  }

  if (filters.fav === 'true' || filters.fav === 'false') {
    query.fav = filters.fav === 'true';
  }

  // Pagination defaults
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 5;
  const skip = (page - 1) * limit;

  // Sorting defaults
  const sortBy =
    sortConfig.sortBy === 'date'
      ? 'createdAt'
      : sortConfig.sortBy || 'createdAt';
  const sortOrder = sortConfig.sortOrder === 'asc' ? 1 : -1;

  const todos = await Todo.find(query)
    .sort({ [sortBy]: sortOrder })
    .collation(sortBy === 'title' ? { locale: 'en', strength: 2 } : undefined)
    .skip(skip)
    .limit(limit);

  const total = await Todo.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  return { todos, total, totalPages };
}
