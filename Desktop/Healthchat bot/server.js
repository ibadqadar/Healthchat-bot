require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { GoogleGenAI } = require('@google/genai');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Google Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DISCLAIMER = "\n\n⚠️ **Disclaimer:** I am the AWKUM Health Assistant. This information is not a substitute for professional medical advice. Always consult a qualified doctor for diagnosis or treatment.";

// Connect to MongoDB
connectDB();

// Middleware (Increased limit for base64 image uploads)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Keep the hospital routes intact
const mapRoutes = require('./routes/mapRoutes');
app.use('/api/hospitals', mapRoutes);

// --- New Gemini 3.1 Flash-Lite Routes ---

// 1. Text-based medical info chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: message,
            config: {
                systemInstruction: "You are the 'AWKUM Health Assistant', a friendly AI health assistant created for an AWKUM Final Year Project. Provide helpful, concise health information and first aid advice.",
            }
        });

        // Append the medical disclaimer
        const replyText = response.text + DISCLAIMER;
        res.json({ reply: replyText });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to communicate with AI', details: error.message });
    }
});

// 2. Identify medication from base64 image
app.post('/api/identify', async (req, res) => {
    try {
        const { imageBase64, query } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

        const promptText = query || "Please identify this medication and explain its primary uses, dosage, and any common side effects.";

        // Strip the data:image/jpeg;base64, prefix if it exists
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg' // fallback standard
                    }
                },
                promptText
            ],
            config: {
                systemInstruction: "You are the 'AWKUM Health Assistant'. Analyze the image of the medicine and provide its name, uses, and precautions.",
            }
        });

        const replyText = response.text + DISCLAIMER;
        res.json({ reply: replyText });

    } catch (error) {
        console.error('Identify API Error:', error);
        res.status(500).json({ error: 'Failed to identify medication', details: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
