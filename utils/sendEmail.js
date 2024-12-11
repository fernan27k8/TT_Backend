const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Configurar el transporte SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes usar 'gmail' o tu propio servidor SMTP
    auth: {
      user: process.env.SMTP_USER, // Tu correo electrónico
      pass: process.env.SMTP_PASS, // Tu contraseña de correo
    },
    tls:{
      rejectUnauthorized:false,
  }
  });

  // Definir las opciones de correo
  const mailOptions = {
    from: 'tu-correo@gmail.com', // Dirección del remitente
    to: options.email, // Destinatario
    subject: options.subject, // Asunto del correo
    text: options.message, // Contenido del correo
  };

  // Enviar el correo
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

