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

/* ⭐ Add this text index */
blogSchema.index({
  title: 'text',
  content: 'text',
  keywords: 'text',
  username: 'text',
});

module.exports = mongoose.model('Blog', blogSchema);
