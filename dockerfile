# Usa una imagen oficial de Node.js como base
FROM node:16

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código de la aplicación al contenedor
COPY . .

# Exponer el puerto en el que corre tu backend
EXPOSE 500

# Comando para correr la aplicación
CMD ["npm", "start"]