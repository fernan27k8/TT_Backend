const express = require('express');
const { registerUser, loginUser, recoverPassword, resetPassword, verifyEmail } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/password-recovery', recoverPassword);
router.post('/reset-password/:token', resetPassword);
router.post("/verify-email", verifyEmail);
  

module.exports = router;
