import { Readable } from 'stream';
import { connectToDatabase } from '../../utils/database'; // adjust relative path as needed
import User from '../../models/user'; // adjust relative path as needed

export async function uploadImageToGridFS(bucket, file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const uploadStream = bucket.openUploadStream(file.name, {
    contentType: file.type,
  });

  stream.pipe(uploadStream);

  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
}

export async function getImageFileUrl(bucket, imageId) {
  const image = await bucket.find({ _id: imageId }).toArray();
  if (image && image.length > 0) {
    return `/api/images/${image[0]._id.toString()}`;
  }
  return null;
}

export async function updateUserImageIdByEmail(email, imageId) {
  await connectToDatabase();
  return User.findOneAndUpdate({ email }, { imageId }, { new: true });
}
