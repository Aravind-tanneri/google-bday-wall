import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import Wish from './models/Wish.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cleanDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google-bday-wall');
    console.log('Connected to MongoDB');

    const wishes = await Wish.find({});
    console.log(`Found ${wishes.length} wishes to delete.`);

    for (const wish of wishes) {
      if (wish.imageUrl) {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
        // With folder: https://res.cloudinary.com/demo/image/upload/v1312461204/folder/sample.jpg
        const urlParts = wish.imageUrl.split('/');
        const filePart = urlParts[urlParts.length - 1];
        const folderPart = urlParts[urlParts.length - 2];
        
        const publicId = `${folderPart}/${filePart.split('.')[0]}`;
        
        console.log(`Deleting image from Cloudinary: ${publicId}`);
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete ${publicId} from Cloudinary:`, err.message);
        }
      }
    }

    await Wish.deleteMany({});
    console.log('Deleted all wishes from the MongoDB database.');

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanDb();
