const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const VERIFY_TOKEN = 'omni_secret_123';

app.use(cors());
app.use(express.json());

// --- 1. RUTA DE SALUD (Para saber que el servidor vive) ---
app.get('/health', (req, res) => {
  res.status(200).send('✅ SERVIDOR ACTIVO');
});

// --- 2. WEBHOOK META ---
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Token Inválido');
  }
});
app.post('/api/webhook', (req, res) => res.sendStatus(200));

// --- 3. CONEXIÓN EN TIEMPO REAL (SSE) ---
// Esta es la ruta que tu Dashboard busca para ponerse VERDE
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no'
  });
  // Enviamos un ping inmediato
  res.write(`data: {"type": "ping", "msg": "conectado"}\n\n`);
  
  // Mantenemos la conexión viva
  const interval = setInterval(() => {
    res.write(`data: {"type": "ping"}\n\n`);
  }, 10000);

  req.on('close', () => clearInterval(interval));
});

// Evitar errores 404 en llamadas vacías
app.get('/api/messages', (req, res) => res.json([]));

// --- 4. SERVIR LA PÁGINA WEB (VITE) ---
// Esto busca la carpeta 'dist' que se crea en el paso de build
app.use(express.static(path.join(__dirname, 'dist')));

// Cualquier ruta que no sea API, devuelve la web (React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});