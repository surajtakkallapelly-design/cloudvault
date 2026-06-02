import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// Helper to determine if Firebase credentials are fully configured
const isFirebaseConfigured = () => {
  return (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PROJECT_ID !== 'your_firebase_project_id' &&
    process.env.FIREBASE_CLIENT_EMAIL !== 'your_firebase_client_email'
  );
};

// Initialize Firebase Admin SDK
try {
  if (isFirebaseConfigured()) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    // Prevent app from failing to start; initialize with project ID context
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project-id',
    });
    console.warn('Firebase credentials not set. Using local mock verification fallback.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
}

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user (password will be hashed automatically by schema pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // Save to user record
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Log the OTP clearly for development testing & verification
    console.log(`\n======================================`);
    console.log(`[OTP Verification] Email: ${email}`);
    console.log(`[OTP Verification] Code: ${otp}`);
    console.log(`======================================\n`);

    // Send email
    const subject = 'CloudVault - Password Reset OTP';
    const messageText = `Hello ${user.name},\n\nYou requested a password reset for your CloudVault account.\n\nYour One-Time Password (OTP) code is:\n\n${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`;
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfcfc;">
        <h2 style="color: #4f46e5; text-align: center;">CloudVault Security Verification</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested a password reset for your CloudVault account. Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #e0e7ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #c7d2fe;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This code is valid for <strong>15 minutes</strong>. If you did not initiate this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">Secure Vault Cloud Storage Storage • Do not share your OTP with anyone.</p>
      </div>
    `;

    const { sendEmail } = await import('../services/emailService.js');
    await sendEmail({
      to: user.email,
      subject,
      text: messageText,
      html: messageHtml,
    });

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error sending password reset OTP', error: error.message });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP matches and is not expired
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code entered' });
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Reset password & clear OTP fields (password is automatically hashed on pre-save hook)
    user.password = newPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    console.log(`[OTP Verification] User ${email} password successfully reset!`);

    // Authenticate user directly and return token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

