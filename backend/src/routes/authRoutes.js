/**
 * ReviewGuard AI - Authentication Routes
 * Handles user login, profile retrieval, session validation, and logout.
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const TOKEN_EXPIRY = "24h";

// 1. User Registration (Self-service Analyst Account)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error_type: "Validation Error",
        message: "Username, email, and password are required for registration."
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        error_type: "Validation Error",
        message: "Username must be at least 3 characters long."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error_type: "Validation Error",
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error_type: "Validation Error",
        message: "Password must be at least 6 characters long."
      });
    }

    const existingEmail = await db.users.findByEmail(trimmedEmail);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error_type: "Duplicate Error",
        message: "An account with this email address already exists."
      });
    }

    const existingUsername = await db.users.findByUsername(trimmedUsername);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error_type: "Duplicate Error",
        message: "Username is already taken. Please choose another username."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      username: trimmedUsername,
      email: trimmedEmail,
      passwordHash,
      role: "analyst", // Self-registration defaults to analyst
      name: (name && name.trim()) || trimmedUsername
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    await db.auditLogs.log({
      username: newUser.username,
      action: "USER_REGISTER",
      entity_type: "AUTH",
      details: `New analyst user ${newUser.username} registered.`
    });

    res.status(201).json({
      success: true,
      message: `Account registered successfully! Welcome, ${newUser.name}.`,
      token,
      expiresIn: TOKEN_EXPIRY,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error_type: "Server Error",
      message: "Registration failed: " + err.message
    });
  }
});

// 2. User Login (Email or Username)
router.post("/login", async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.username || req.body.email || req.body.login;
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error_type: "Validation Error",
        message: "Email/username and password are required."
      });
    }

    // Try finding by email or username
    let user = await db.users.findByEmail(identifier.trim());
    if (!user) {
      user = await db.users.findByUsername(identifier.trim());
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error_type: "Authentication Error",
        message: "Invalid credentials. Please verify your email/username and password."
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error_type: "Account Suspended",
        message: "Your account is deactivated. Contact an administrator."
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error_type: "Authentication Error",
        message: "Invalid credentials. Please verify your email/username and password."
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Audit log
    await db.auditLogs.log({
      username: user.username,
      action: "USER_LOGIN",
      entity_type: "AUTH",
      details: `User ${user.username} successfully logged in as ${user.role}.`
    });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      expiresIn: TOKEN_EXPIRY,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error_type: "Server Error",
      message: "Login failed: " + err.message
    });
  }
});

// 2. Current User Profile
router.get("/me", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 3. User Logout
router.post("/logout", authenticateToken, async (req, res) => {
  await db.auditLogs.log({
    username: req.user.username,
    action: "USER_LOGOUT",
    entity_type: "AUTH",
    details: `User ${req.user.username} logged out.`
  });

  res.json({
    success: true,
    message: "Logged out successfully."
  });
});

module.exports = router;
