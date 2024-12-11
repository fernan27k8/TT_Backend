const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: false, 
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  resetPasswordToken: String, // Token para recuperación de contraseña
  resetPasswordExpire: Date,  // Fecha de expiración del token
}, { timestamps: true }); // Agrega timestamps para tener createdAt y updatedAt automáticamente

// Encriptar contraseña antes de guardarla en la base de datos
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para verificar la contraseña
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generar y configurar token de recuperación de contraseña
userSchema.methods.getResetPasswordToken = function () {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hashear el token y guardarlo en la base de datos
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Establecer la expiración del token en 1 hora
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hora

  return resetToken;
};

// Generar un código de verificación para nuevos usuarios
userSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
  this.verificationCode = code;
  return code;
};

const User = mongoose.model('User', userSchema);

module.exports = User;


