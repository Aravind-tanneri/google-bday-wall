import mongoose from 'mongoose';

const wishSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  width: {
    type: Number,
    default: 1
  },
  height: {
    type: Number,
    default: 1
  },
  name: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  message: {
    type: String,
    maxLength: 50
  },
  presetEmoji: {
    type: String
  },
  imageUrl: {
    type: String
  },
  searchPersonality: String,
  twoAmSearch: String,
  randomSearch: String,
  nitApSearch: String,
  relationshipStatus: String,
  birthdayWish: String
}, { timestamps: true });

export default mongoose.model('Wish', wishSchema);
