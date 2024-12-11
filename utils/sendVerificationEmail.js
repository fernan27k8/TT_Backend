const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Cambia esto si usas otro proveedor
    auth: {
      user: process.env.SMTP_USER, // Tu correo electrónico
      pass: process.env.SMTP_PASS, // Tu contraseña o token de aplicación
    },
    tls:{
        rejectUnauthorized:false,
    }
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verifica tu cuenta',
    html: `
      <h1>Bienvenido</h1>
      <p>Gracias por registrarte. Tu código de verificación es:</p>
      <h2>${verificationCode}</h2>
      <p>Por favor, ingrésalo en la aplicación para completar tu registro.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
