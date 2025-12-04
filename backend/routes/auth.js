const express = require('express');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const { authValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Sign Up
router.post('/signup', authLimiter, authValidation.signUp, async (req, res) => {
  try {
    const { email, password, full_name, company_name, phone } = req.body;

    // Create auth user using Supabase Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        company_name: company_name || '',
        phone: phone || '',
        points: 0,
        role: 'user'
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    // Generate JWT token
    const token = generateToken(authData.user.id);

    res.status(201).json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
        points: profile.points,
        role: profile.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign In
router.post('/signin', authLimiter, authValidation.signIn, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!authData.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Generate JWT token
    const token = generateToken(authData.user.id);

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
        points: profile.points,
        role: profile.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (requires authentication)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
        points: profile.points,
        role: profile.role
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

