const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan'); // Importar morgan
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');

dotenv.config();

connectDB();

const app = express();

// Middleware para aceptar JSON
app.use(express.json());

// Middleware para registrar solicitudes HTTP
app.use(morgan('dev')); // Muestra detalles de las solicitudes en la consola

//Middleware para manejar cookies
app.use(cookieParser());
// Configurar CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://localhost:3000';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack); // Muestra el error en la consola
  res.status(500).send('Ocurrió un error en el servidor.'); // Respuesta genérica para el cliente
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

