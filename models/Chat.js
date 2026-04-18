import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  user_Id: {
    type: String,
    required: true,
    index: true,
  },
  session_id: {
    type: String,
    index: true,
    // Not required — old documents may not have this field
    default: () => `sess_legacy_${Date.now()}`,
  },
  session_title: {
    type: String,
    default: 'New Chat',
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
    expires: 259200, // 3 days in seconds
  },
});

// Force re-compile in dev so hot-reload always picks up schema changes
if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Chat;
}

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
