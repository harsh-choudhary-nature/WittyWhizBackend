const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');


// Get blogs with pagination
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    let userEmail = null;
    // Extract email from token if present
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userEmail = decoded.email;
        } catch (err) {
            console.warn('Invalid token — proceeding without user email');
        }
    }

    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 }) // Sort blogs by creation date (newest first)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const totalBlogs = await Blog.countDocuments(); // Total blog count for pagination
        const totalPages = Math.ceil(totalBlogs / limit); // Calculate total pages

        const formattedBlogs = blogs.map(blog => {
            return {
                title: blog.title,
                content: blog.content,
                keywords: blog.keywords,
                likes: blog.likes,
                dislikes: blog.dislikes,
                username: blog.username,
                creator: userEmail && blog.email === userEmail
            };
        });


        res.json({ blogs: formattedBlogs, totalPages });
    } catch (err) {
        console.error('❌ Error fetching blogs:', err);
        res.status(500).json({ message: 'Unable to fetch blogs' });
    }
});

router.post('/create', authenticateToken, async (req, res) => {
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
    let userEmail = null;

    // Optional token decoding
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userEmail = decoded.email;
        } catch (err) {
            console.warn('Invalid token — proceeding without user email');
        }
    }

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        const response = {
            title: blog.title,
            content: blog.content,
            keywords: blog.keywords,
            likes: blog.likes,
            dislikes: blog.dislikes,
            username: blog.username,
            creator: userEmail && blog.email === userEmail
        };

        res.json(response);
    } catch (err) {
        console.error('❌ Error fetching blog by ID:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/blogs/:id - Edit a blog
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, keywords, content } = req.body;

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        // Check if the logged-in user is the blog's author
        if (blog.email !== req.user.email) {
            return res.status(403).json({ message: 'You are not authorized to edit this blog.' });
        }

        // Update fields if provided
        if (title) blog.title = title;
        if (keywords) blog.keywords = keywords;
        if (content) blog.content = content;

        await blog.save();

        res.json({ message: 'Blog updated successfully.' });
    } catch (err) {
        console.error('❌ Error editing blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// DELETE /api/blogs/:id - Delete a blog
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        if (blog.email !== req.user.email) {
            return res.status(403).json({ message: 'You are not authorized to delete this blog.' });
        }

        await blog.deleteOne();

        res.json({ message: 'Blog deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting blog:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
