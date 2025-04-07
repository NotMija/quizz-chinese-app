// Requerimos los paquetes necesarios
require('dotenv').config(); // Para cargar las variables del .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Inicializamos Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Para poder manejar datos en formato JSON

// Conexión a MongoDB usando Mongoose
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✔️ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB', error);
    process.exit(1); // Si la conexión falla, cerramos el proceso
  }
};

// Llamamos a la función para conectar a la base de datos
connectDB();

// Definir el esquema de la colección de palabras
const palabraSchema = new mongoose.Schema({
  chino: { type: String, required: true },
  pinyin: { type: String, required: true },
  español: { type: String, required: true },
  nivel: { type: Number, required: true },
});

// Crear el modelo de palabras
const Palabra = mongoose.model('Palabra', palabraSchema);

// 🟢 Endpoint para obtener una palabra aleatoria según los niveles seleccionados
app.get('/api/palabra', async (req, res) => {
  const niveles = req.query.niveles ? req.query.niveles.split(',').map(Number) : [10];

  try {
    const palabrasFiltradas = await Palabra.find({ nivel: { $in: niveles } });

    if (palabrasFiltradas.length === 0) {
      return res.status(404).json({ error: 'No hay palabras disponibles para los niveles seleccionados.' });
    }

    const palabraAleatoria = palabrasFiltradas[Math.floor(Math.random() * palabrasFiltradas.length)];
    res.json(palabraAleatoria);
  } catch (error) {
    console.error('❌ Error al obtener la palabra', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// 🟢 Endpoint para obtener todas las palabras filtradas por niveles
app.get('/api/palabras', async (req, res) => {
  const niveles = req.query.niveles ? req.query.niveles.split(',').map(Number) : [10];

  try {
    const palabrasFiltradas = await Palabra.find({ nivel: { $in: niveles } });
    res.json(palabrasFiltradas);
  } catch (error) {
    console.error('❌ Error al obtener las palabras', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Arrancar el servidor en el puerto especificado
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
