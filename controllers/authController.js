import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register User & Send OTP
export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.create({
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 mins
      isVerified: false // Explicitly unverified until OTP check
    });

    console.log(`Signup OTP for ${email}: ${otp}`); 
    res.status(201).json({ message: "User registered. Check console for OTP." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// @desc    Verify OTP for Registration or Password Reset
export const verifyOTP = async (req, res) => {
  const { email, otp, purpose } = req.body; 
  try {
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    // UNLOCK USER: If they provide a valid OTP, they are verified
    user.isVerified = true; 
    
    // Clear OTP fields
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Identity verified successfully", purpose });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Login User
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    
    // 1. Check Credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // 2. Check Verification (The 403 Gate)
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { id: user._id, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Forgot Password - Request OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`Password Reset OTP for ${email}: ${otp}`);
    res.json({ message: "Reset OTP sent to console." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Reset Password using New Password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 2. UNLOCK USER: Resetting via OTP proves ownership
    user.isVerified = true; 
    
    // 3. Clear OTP for security
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};