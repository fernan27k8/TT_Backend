const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // Importar el archivo sendEmail
const sendVerificationEmail = require('../utils/sendVerificationEmail');

// Función para generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Generar token para restablecimiento de contraseña
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Enviar email de restablecimiento de contraseña
exports.recoverPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const resetToken = generatePasswordResetToken();
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hora

    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace: ${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Restablecer contraseña',
      message,
    });

    res.status(200).json({ message: 'Correo de restablecimiento enviado' });
  } catch (error) {
    console.error('Error en la recuperación de contraseña:', error);

    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al enviar el correo de recuperación. Intenta más tarde.' });
    }
  }
};

// Restablecer contraseña
exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Validar que la contraseña cumpla con los requisitos
  const passwordRegex = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[@$!%*?&]/.test(password),
  };

  if (!Object.values(passwordRegex).every(Boolean)) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
    });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token no válido o ha expirado' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al restablecer la contraseña. Intenta más tarde.' });
    }
    next(error);
  }
};


// Registro de nuevo usuario
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validar que todos los campos estén presentes
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    // Validar requisitos de la contraseña
    const passwordRegex = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&]/.test(password),
    };

    if (!Object.values(passwordRegex).every(Boolean)) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    // Crear el usuario en la base de datos
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
    const user = new User({
      fullName,
      email,
      password,
      verificationCode,
      isVerified: false,
    });

    await user.save();

    // Enviar correo de verificación
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Registro exitoso. Por favor verifica tu correo electrónico.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error del servidor. Intenta de nuevo más tarde.' });
  }
};

// Inicio de sesión
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'El correo y la contraseña son obligatorios' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Correo electrónico no verificado.' });
      }

      // Generar token
      const token = generateToken(user._id);

      // Configurar la cookie
      res.cookie('authToken', token, {
        httpOnly: true, // La cookie no es accesible desde JavaScript
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'None', // Necesario para cookies de terceros
      });

      // Enviar respuesta sin incluir el token directamente
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        message: 'Inicio de sesión exitoso',
      });
    } else {
      return res.status(401).json({ message: 'Credenciales no válidas' });
    }
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ message: 'Error en el servidor. Intenta más tarde.' });
    next(error);
  }
};


// Validar código de verificación de correo
exports.verifyEmail = async (req, res) => {
  
  const { verificationCode } = req.body;
  console.log('Código de verificación recibido:', verificationCode);
  try {
    // Buscar al usuario por el código de verificación
    console.log('Buscando usuario con código de verificación:', verificationCode);
    const user = await User.findOne({ verificationCode });
    console.log('Usuario encontrado:', user);

    if (!user) {
      // Si el usuario no se encuentra, responde con un error 404
      return res.status(404).json({ message: 'Código de verificación incorrecto o usuario no encontrado' });
    }

    // El código de verificación ya se encuentra, solo debes eliminarlo después de la validación
    user.isVerified = true;  // Marca al usuario como verificado
    user.verificationCode = undefined; // Limpiar el código de verificación después de usarlo
    await user.save();  // Guarda los cambios en la base de datos

    res.status(200).json({ message: 'Correo verificado con éxito' });
  } catch (error) {
    console.error('Error al verificar el correo electrónico:', error.message, error.stack);
    res.status(500).json({ message: 'Error del servidor. Intenta de nuevo más tarde.' });
  }
};