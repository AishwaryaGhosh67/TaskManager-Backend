const User = require('../models/User');
const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });

    const user = await User.create({ name, email, password });
    const token = createToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ msg: 'Invalid credentials' });

    const token = createToken(user);
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
