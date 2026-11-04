const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const generateToken = require('../utils/generateToken');

// @desc Register new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body || {};
  const preferredLanguage = req.body?.preferredLanguage === 'km' ? 'km' : 'en';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof name !== 'string' || !name.trim() || !normalizedEmail || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Name, a valid email, and password are required' });
  }

  try {
    const userExists = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash, preferredLanguage }
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, preferredLanguage: user.preferredLanguage },
      token: generateToken(user.id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'A valid email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, preferredLanguage: user.preferredLanguage },
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };