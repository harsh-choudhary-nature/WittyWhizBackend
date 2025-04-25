const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true }, // Markdown content
  keywords:  [{ type: String }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username:  { type: String, required: true },
  email:     { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
