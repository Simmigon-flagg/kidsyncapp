import Users from './../../models/user';
import { connectToDatabase } from '../../utils/database';

export async function signupUser({ name, email, password }) {
  await connectToDatabase();

  // Check if user exists
  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    return { error: 'User already exists', status: 409 };
  }

  // Create user
  const user = await Users.create({
    name,
    email,
    password,
    imageId: null,
  });

  return { user, status: 201 };
}
