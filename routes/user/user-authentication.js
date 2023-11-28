const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const knex = require('../../knexfile.js');
const db = require('knex')(knex.development);
const saltRounds = 10; // Số vòng lặp bcrypt sử dụng để mã hóa
const crypto = require('crypto'); // Để tạo token ngẫn nhiên
const sendEmail = require('../../services/mailer.js');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db('users').where({ email }).first();

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ userId: user.id, role: user.role }, 'Gh7$0pQr9^jTn@2s', { expiresIn: '1h' });
      delete user.password;
      res.json({ user, token });
    } else {
      res.status(400).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Oops! It looks like that email is already associated with an account.' });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db('users').insert({
      name: username, email, password: hashedPassword, avatar: 'uploads/default-avatar.png'
    });
    const newUser = await db('users').where({ email }).first();
    if (!newUser || newUser.length === 0) {
      throw new Error('Failed to insert user');
    }
    const token = jwt.sign({ userId: newUser.id }, 'Gh7$0pQr9^jTn@2s', { expiresIn: '1h' });
    delete newUser.password;
    res.status(201).json({ user: newUser[0], token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Registration error.', error: error.message });
  }
});

// Route gửi OTP qua email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(400).json({ message: 'No account with that email address exists.' });
    }

    const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
    const otpExpires = new Date(Date.now() + 60000); // Tạo một đối tượng Date mới dựa trên thời gian hiện tại + 1 phút

    await db('users').where({ email }).update({
      otp: otp,
      otpExpires: otpExpires
    });

    // Cài đặt thông tin gửi mail
    const senderName = 'ShareRecipes Support';
    const subject = 'Password Reset OTP Code';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <p>Dear ${user.name || 'Customer'},</p>
        <p>You recently requested to reset your password for your ShareRecipes account. Below is the verification otp code you will need to complete the process:</p>
        <h2 style="text-align: center; color: #4CAF50;">${otp}</h2>
        <p>If you did not request a password reset, please ignore this email or contact support for assistance.</p>
        <p>Kind regards,</p>
        <p>${senderName}</p>
      </div>
    `;

    await sendEmail(email, subject, htmlContent, senderName);

    res.json({ message: 'OTP has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred.', error: error.message });
  }
});

// Route kiểm tra OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await db('users').where({ email }).first();

    if (!user || user.otp !== otp || Date.now() > new Date(user.otpExpires).getTime()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = jwt.sign({ userId: user.id }, 'Gh7$0pQr9^jTn@2s', { expiresIn: '15m' });
    res.json({ message: 'OTP verified. You can now reset your password.', resetToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred.', error: error.message });
  }
});

// Route đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, 'Gh7$0pQr9^jTn@2s');

    // Mã hóa mật khẩu mới (sử dụng bcrypt hoặc một thư viện tương tự)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db('users').where({ id: decoded.userId }).update({ password: hashedPassword });

    res.json({ message: 'Password successfully reset.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred.', error: error.message });
  }
});

module.exports = router;
