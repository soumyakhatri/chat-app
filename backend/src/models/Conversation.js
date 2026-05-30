const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    members: {
      type: [String],
      required: true,
      validate: {
        validator(members) {
          if (this.type === 'direct') return members.length === 2;
          if (this.type === 'group') return members.length >= 2;
          return false;
        },
        message: 'Direct chats need exactly 2 members; groups need at least 2.',
      },
    },
    readState: {
      type: [
        {
          userId: { type: String, required: true },
          lastReadAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

conversationSchema.index({ type: 1, members: 1 });
conversationSchema.index({ members: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
