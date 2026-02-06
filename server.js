
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(bodyParser.json());

// --- CONFIGURACIÓN Y VARIABLES DE ENTORNO ---
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'omni_secret_123';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

// Inicializar Cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- ALMACENAMIENTO TEMPORAL (In-Memory) ---
let messagesDB = [];
let clients = []; // Active SSE clients
// Store history per platform/user to maintain context
let userContexts = {}; 

// --- RUTAS ---

app.get('/api/messages', (req, res) => {
  res.json(messagesDB);
});

app.get('/api/events', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  res.write(`data: {"type": "ping"}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

function broadcastMessage(message) {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(message)}\n\n`);
  });
}

app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('✅ Webhook verificado correctamente por Meta.');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Fallo en verificación de token.');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const entry = body.entry[0].changes[0].value;
      const message = entry.messages[0];
      
      const contactName = entry.contacts ? entry.contacts[0].profile.name : 'Usuario';
      const from = message.from; 
      const messageId = message.id;
      const messageType = message.type;
      
      if (messageType === 'text') {
        const textBody = message.text.body;
        console.log(`📩 [IN] Mensaje de ${contactName} (${from}): ${textBody}`);
        
        const incomingMsg = {
          id: messageId,
          contactName: contactName,
          lastMessage: textBody,
          timestamp: new Date(),
          platform: 'whatsapp',
          unread: true,
          avatar: 'WA'
        };
        messagesDB.unshift(incomingMsg); 
        broadcastMessage(incomingMsg); 

        // Update context for this user
        if (!userContexts[from]) userContexts[from] = [];
        userContexts[from].push({ role: 'user', parts: [{ text: textBody }] });

        res.sendStatus(200);

        await handleSmartReply(from, textBody, contactName);

      } else {
        console.log(`⚠️ Tipo de mensaje no soportado: ${messageType}`);
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});

// --- FUNCIÓN DE LÓGICA DE IA ---

async function handleSmartReply(to, userText, userName) {
  try {
    const history = userContexts[to] || [];
    
    const systemInstruction = `
      Eres OmniAgent, un asistente virtual profesional y amable.
      Estás hablando con ${userName} por WhatsApp.
      Mantén tus respuestas breves, útiles y con un tono conversacional.
      Recuerda el contexto previo de la conversación para responder coherentemente.
      Evita usar formato Markdown complejo ya que WhatsApp tiene soporte limitado.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiText = response.text;
    console.log(`🤖 [AI] Respuesta Gemini: ${aiText}`);

    // Update history with AI response
    userContexts[to].push({ role: 'model', parts: [{ text: aiText }] });
    // Keep history manageable (last 10 messages)
    if (userContexts[to].length > 10) userContexts[to] = userContexts[to].slice(-10);

    if (META_ACCESS_TOKEN && META_PHONE_NUMBER_ID) {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: aiText },
            },
        });
        console.log(`📤 [OUT] Enviado a WhatsApp (${to})`);
    } else {
        console.warn("⚠️ [DEV] Meta Credentials no configuradas. Mensaje no enviado a WhatsApp real.");
    }

    const outgoingMsg = {
        id: `resp_${Date.now()}`,
        contactName: "OmniAgent (AI)", 
        lastMessage: aiText,
        timestamp: new Date(),
        platform: 'whatsapp',
        unread: false,
        avatar: 'OA'
    };
    messagesDB.unshift(outgoingMsg);
    broadcastMessage(outgoingMsg); 

  } catch (error) {
    console.error('❌ Error en el flujo de IA/Meta:', error.response ? error.response.data : error.message);
  }
}

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR BACKEND OMNIAGENT INICIADO`);
  console.log(`➜  Local:   http://localhost:${PORT}`);
  console.log(`➜  Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`➜  SSE:     http://localhost:${PORT}/api/events`);
  console.log(`➜  Estado:  Esperando mensajes...\n`);
});
