const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true }, // Markdown content
  keywords:  [{ type: String }],
  likes:     { type: Number, default: 0 },
  dislikes:  { type: Number, default: 0 },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username:  { type: String, required: true },
  email:     { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
