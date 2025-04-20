const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');


// Get blogs with pagination
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 }) // Sort blogs by creation date (newest first)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const totalBlogs = await Blog.countDocuments(); // Total blog count for pagination
        const totalPages = Math.ceil(totalBlogs / limit); // Calculate total pages

        res.json({ blogs, totalPages });
    } catch (err) {
        console.error('❌ Error fetching blogs:', err);
        res.status(500).json({ message: 'Unable to fetch blogs' });
    }
});

router.post('/create', async (req, res) => {
    try {
        const { title, keywords, content, email } = req.body;
        // console.log(`title : ${title}\nkeywords : ${keywords}\ncontent : ${content}\nemail : ${email}`);
        // Validate required fields
        if (!title || !keywords || !content || !email) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const newBlog = new Blog({
            title,
            keywords,
            content,
            email: user.email,
            username: user.username,
            author: user._id,
            likes: 0,
            dislikes: 0,
        });

        await newBlog.save();

        res.status(201).json({ message: 'Blog created successfully.' });
    } catch (err) {
        console.error('Error creating blog:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// GET /api/blogs/:id
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        console.error('❌ Error fetching blog by ID:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
