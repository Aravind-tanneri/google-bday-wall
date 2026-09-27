import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import Wish from './models/Wish.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'google-bday-wall',
    allowedFormats: ['jpg', 'png', 'jpeg', 'gif'],
    transformation: [{ width: 200, height: 200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
  }
});

const parser = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google-bday-wall')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Get all wishes
app.get('/api/wishes', async (req, res) => {
  try {
    const wishes = await Wish.find({});
    res.json(wishes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishes' });
  }
});

// Create a wish with an image upload
app.post('/api/wishes', parser.single('image'), async (req, res) => {
  try {
    const { 
      index, width, height, name, rollNumber, message, presetEmoji,
      searchPersonality, twoAmSearch, randomSearch, nitApSearch, relationshipStatus, birthdayWish
    } = req.body;
    
    // Check if square is already taken
    const existing = await Wish.findOne({ index: parseInt(index) });
    if (existing) {
      return res.status(400).json({ error: 'Square is already taken' });
    }

    const newWish = new Wish({
      index: parseInt(index),
      width: parseInt(width) || 1,
      height: parseInt(height) || 1,
      name,
      rollNumber,
      message,
      presetEmoji: presetEmoji || null,
      imageUrl: req.file ? req.file.path : null,
      searchPersonality,
      twoAmSearch,
      randomSearch,
      nitApSearch,
      relationshipStatus,
      birthdayWish
    });

    await newWish.save();
    res.status(201).json(newWish);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save wish' });
  }
});

// Ping route to keep server alive
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Self-ping every 14 minutes (14 * 60 * 1000 = 840000 ms)
const PING_INTERVAL = 14 * 60 * 1000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

setInterval(async () => {
  try {
    const res = await fetch(`${SERVER_URL}/ping`);
    if (res.ok) {
      console.log(`Pinged server at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('Failed to ping server:', err.message);
  }
}, PING_INTERVAL);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
