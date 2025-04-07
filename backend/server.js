require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Middleware para parsear JSON bodies
app.use(express.json());

// --- Conexión a MongoDB ---
const connectDB = async () => {
  try {
    // Conexión usando la variable de entorno MONGO_URI
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✔️ Conectado a MongoDB'); 
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB', error);
    process.exit(1);
  }
};

connectDB();

const palabraSchema = new mongoose.Schema({
  chino: { type: String, required: true },
  pinyin: { type: String, required: true },
  español: { type: String, required: true },
  nivel: { type: Number, required: true },
}, { collection: 'Palabras' });

const Palabra = mongoose.model('Palabra', palabraSchema);


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

// Endpoint para obtener todas las palabras filtradas
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

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  // Mensaje cuando el servidor arranca y escucha en el puerto correcto
  // En Render, PORT será asignado por la plataforma (ej: 10000)
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});