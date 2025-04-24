const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,    // Replace with your email
        pass: process.env.EMAIL_PASS, // Replace with your app password
    },
});


function generateOtp(length = 6) {
    return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
}

async function storeOtp(email, otp) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);  // 5 minutes expiration
    await Otp.findOneAndUpdate(
        { email },
        { otp, expiresAt },
        { upsert: true, new: true }
    );

}

async function getOtp(email) {
    const entry = await Otp.findOne({ email });
    if (!entry || new Date() > entry.expiresAt) {
        await Otp.deleteOne({ email });
        return null;
    }
    return entry.otp;
}

async function deleteOtp(email) {
    await Otp.deleteOne({ email });
}

async function sendOtpEmail(email, otp) {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`
    });
    // Send the email
    await transporter.sendMail(info);
    // console.log("Email sent!")
}

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        const otp = generateOtp();
        storeOtp(email, otp);

        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP sent to your email.' });

    } catch (err) {
        console.error('❌ Failed to send OTP:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

});

router.post('/register', async (req, res) => {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password || !otp) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const storedOtp = await getOtp(email);
        if (!storedOtp) {
            return res.status(400).json({ message: 'OTP expired or not found.' });
        }

        if (storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        await deleteOtp(email);

        // console.log(`✅ Registered user: ${username}, ${email}`);
        res.status(200).json({ message: 'Registration successful!' });

    } catch (err) {
        console.error('❌ Error in registration:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ message: 'Login successful', username: user.username  , token });

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.delete('/delete-account', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOneAndDelete({ email: decoded.email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('❌ Delete account error:', err);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;