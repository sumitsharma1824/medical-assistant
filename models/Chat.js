import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  user_Id: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['patient', 'student'],
  },
  user_message: {
    type: String,
    required: true,
  },
  ai_response: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 259200 // 3 days in seconds
  }
});

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
