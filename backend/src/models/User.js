const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    userId: this.userId,
    displayName: this.displayName,
  };
};

module.exports = mongoose.model('User', userSchema);
