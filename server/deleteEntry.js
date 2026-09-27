import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import readline from 'readline';
import Wish from './models/Wish.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
};

const extractPublicId = (url) => {
  if (!url) return null;
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  if (matches && matches[1]) {
    return matches[1];
  }
  const parts = url.split('/');
  const file = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${file}`;
};

const deleteEntry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google-bday-wall');
    console.log(' Connected to MongoDB');

    const args = process.argv.slice(2);
    let target = null;
    let query = {};

    // 1. Check command line arguments:
    // Examples:
    // node deleteEntry.js 45
    // node deleteEntry.js --id 45
    // node deleteEntry.js --roll 422101
    // node deleteEntry.js --name "Bad User"
    if (args.length > 0) {
      if (args[0] === '--roll' && args[1]) {
        query = { rollNumber: new RegExp(`^${args[1]}$`, 'i') };
      } else if (args[0] === '--name' && args[1]) {
        query = { name: new RegExp(args[1], 'i') };
      } else if (args[0] === '--id' && args[1]) {
        const num = parseInt(args[1], 10);
        // Supports Cell ID 1-10000 or index 0-9999
        query = { $or: [{ index: num - 1 }, { index: num }] };
      } else {
        const num = parseInt(args[0], 10);
        if (!isNaN(num)) {
          // If a direct number is provided, treat it as Cell ID (1-based) or index (0-based)
          query = { $or: [{ index: num - 1 }, { index: num }] };
        } else {
          query = { rollNumber: new RegExp(`^${args[0]}$`, 'i') };
        }
      }
    } else {
      // Interactive Mode: Show recent wishes and prompt
      const recentWishes = await Wish.find({}).sort({ createdAt: -1 }).limit(10);
      console.log('\n--- 📋 Recent 10 Wishes ---');
      recentWishes.forEach(w => {
        console.log(`Cell #${w.index + 1} | Name: ${w.name} | Roll: ${w.rollNumber || 'N/A'} | Msg: ${w.message?.slice(0, 30) || 'None'} | HasImage: ${!!w.imageUrl}`);
      });
      console.log('---------------------------\n');

      const input = await askQuestion('Enter Cell # (1-10000) or Roll Number to delete: ');
      if (!input) {
        console.log('Operation cancelled.');
        process.exit(0);
      }

      const num = parseInt(input, 10);
      if (!isNaN(num) && num >= 1 && num <= 10000) {
        query = { $or: [{ index: num - 1 }, { index: num }] };
      } else {
        query = { rollNumber: new RegExp(`^${input}$`, 'i') };
      }
    }

    const matches = await Wish.find(query);

    if (matches.length === 0) {
      console.log('❌ No wish found matching your criteria.');
      process.exit(0);
    }

    console.log(`\nFound ${matches.length} matching entry(ies):`);
    for (const wish of matches) {
      console.log(`\n----------------------------------------`);
      console.log(`Cell ID: #${wish.index + 1} (Index: ${wish.index}, Size: ${wish.width || 1}x${wish.height || 1})`);
      console.log(`Name:    ${wish.name}`);
      console.log(`Roll:    ${wish.rollNumber || 'N/A'}`);
      console.log(`Message: ${wish.message || 'N/A'}`);
      console.log(`Image:   ${wish.imageUrl || 'None'}`);
      console.log(`----------------------------------------`);

      // Delete from Cloudinary if image exists
      if (wish.imageUrl) {
        const publicId = extractPublicId(wish.imageUrl);
        console.log(`🗑️ Deleting image from Cloudinary: ${publicId}...`);
        try {
          const res = await cloudinary.uploader.destroy(publicId);
          console.log(` Cloudinary delete result:`, res.result);
        } catch (cErr) {
          console.error(`⚠️ Cloudinary deletion error:`, cErr.message);
        }
      }

      // Delete from MongoDB
      await Wish.deleteOne({ _id: wish._id });
      console.log(`✅ Wish at Cell #${wish.index + 1} removed from MongoDB successfully.`);
    }

    console.log('\n🎉 Cleanup complete! The cell(s) are now free for others to claim.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during entry deletion:', err);
    process.exit(1);
  }
};

deleteEntry();
