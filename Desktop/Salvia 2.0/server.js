require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const { verifyToken, isAdmin } = require('./middleware/auth');
const FAQ = require('./models/FAQ');
const Medicine = require('./models/Medicine');

// Configure multer storage for temporary local file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'med_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Express setup & Gemini API initialization
const app = express();
const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Constants & Prompts
const DISCLAIMER = "\n\n⚠️ Disclaimer: I am Salvia AI, a health assistant, not a doctor. Consult a professional for diagnosis.";

const SYSTEM_INSTRUCTION = `You are Salvia AI, a friendly health assistant.
- If the user asks if they can upload an image, identify a medication, or show you a pill/medicine box, or a syrup bottle, tell them YES! I can assist/help you with it , Instruct them to use the "Upload" or "Camera" button directly in the chat interface. Do not tell them you cannot see images.
- Emergencies (chest pain, stroke, severe bleeding): First, provide immediate, crucial first-aid advice in bullet points, AND THEN trigger 'trigger_openstreet_maps'.
- Routine (headache, flu, back pain): Give advice first, then ASK 'Would you like me to find a doctor or pharmacy nearby?'. 
- ONLY use the map tool for routine issues if the user says 'Yes'.`;

const triggerMapTool = {
    functionDeclarations: [{
        name: 'trigger_openstreet_maps',
        description: 'Finds nearby medical facilities.',
        parameters: {
            type: 'OBJECT',
            properties: {
                facilityType: { type: 'STRING', enum: ['hospital', 'doctor', 'pharmacy', 'dentist'] }
            },
            required: ['facilityType']
        }
    }]
};

// Apply Middleware & Connect DB
connectDB();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Routes ---
app.use('/api/auth', authRoutes);

// --- API Endpoints ---

// Admin dashboard test route
app.get('/api/admin/dashboard', verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Admin Dashboard Access Granted", user: req.user });
});

// Primary chat endpoint with local DB fallback and triage
app.post('/api/chat', verifyToken, async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // 1. Local Database Lookup (Context & Fallback)
        const userMsg = message.toLowerCase();

        // Search local MongoDB for FAQs using exact word boundaries
        // This allows multi-word keywords like "not feeling well" to match correctly
        const allFaqs = await FAQ.find({});
        let matchedFaqs = allFaqs.filter(faq => {
            return faq.keywords.some(kw => {
                // Check if the keyword exists as a distinct word/phrase in the user's message
                const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()}\\b`, 'i');
                return regex.test(userMsg);
            });
        });

        // Search local MongoDB for medicines (Match if any word >= 4 letters is in the name)
        const words = userMsg.replace(/[^\w\s]/g, '').split(/\s+/);
        const significantWords = words.filter(w => w.length > 3);
        let matchedMeds = [];
        if (significantWords.length > 0) {
            matchedMeds = await Medicine.find({
                name: { $regex: significantWords.join('|'), $options: 'i' }
            });
        }



        let customDatabaseContext = "";
        let directOfflineAnswer = "";

        // Format data if found
        if (matchedMeds.length > 0) {
            const med = matchedMeds[0];
            customDatabaseContext += `Official Medicine Data: ${med.name}. Uses: ${med.uses.join(', ')}. Precautions: ${med.precautions.join(', ')}.\n`;
            directOfflineAnswer += `**${med.name}**\n*Uses:* ${med.uses.join(', ')}\n*Precautions:* ${med.precautions.join(', ')}\n\n`;
        }
        if (matchedFaqs.length > 0) {
            customDatabaseContext += `Official FAQ Protocol: ${matchedFaqs[0].answer}\n`;
            directOfflineAnswer += `${matchedFaqs[0].answer}\n`;
        }

        // 2. Gemini Cloud Model Initialization
        // Helper function to initialize the Gemini model and handle chat session state.
        const tryCloudModel = async (modelName) => {
            let DYNAMIC_INSTRUCTION = SYSTEM_INSTRUCTION;

            // Inject the local database context so Gemini sounds smart when online
            if (customDatabaseContext !== "") {
                DYNAMIC_INSTRUCTION += `\n\nCRITICAL CONTEXT FROM OUR DATABASE:\nThe user is asking about something in our official records. Use the following verified data to answer them. Do not contradict this data:\n${customDatabaseContext}`;
            }

            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: DYNAMIC_INSTRUCTION
            });

            const chat = model.startChat({
                history: (history || []).map(item => ({
                    role: item.role === 'model' ? 'model' : 'user',
                    parts: item.parts.map(p => {
                        if (p.text) return { text: p.text.replace(DISCLAIMER, '').trim() };
                        return p;
                    })
                })),
                tools: [triggerMapTool]
            });
            return await chat.sendMessage(message);
        };

        // 3. Execution & Triage Logic
        let result;
        try {
            console.log("☁️ Attempting Cloud: Gemini 3.1 Flash-Lite...");
            result = await tryCloudModel("gemini-3.1-flash-lite");

            const response = result.response;
            const calls = response.functionCalls ? response.functionCalls() : null;

            // Process tool calls (e.g., OpenStreetMap triggers)
            if (calls && calls.length > 0) {
                const facilityType = calls[0].args.facilityType || 'hospital';
                let emergencyAdvice = `🚨 Emergency Protocol: Locating a ${facilityType} for you immediately.`;

                try {
                    const textPart = response.text();
                    if (textPart && textPart.trim().length > 0) {
                        emergencyAdvice = textPart;
                    }
                } catch (e) { }

                return res.json({
                    reply: emergencyAdvice + "\n\nI am opening maps for you to locate nearby health facilities." + DISCLAIMER,
                    action: 'OPEN_MAP',
                    facilityType
                });
            }

            let replyText = "";
            try {
                replyText = response.text();
            } catch (e) {
                replyText = "I am processing your medical inquiry.";
            }

            return res.json({ reply: replyText + DISCLAIMER });

        } catch (error) {
            // 4. Offline Fallback Handling
            // Trigger offline mode if network request fails (e.g., fetch failure or ENOTFOUND)
            if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND' || error.message.includes('network')) {
                console.warn("⚠️ NETWORK FAILURE DETECTED! Triggering Offline Database Mode.");

                if (directOfflineAnswer !== "") {
                    return res.json({ reply: "🔌 *(Offline Mode)*\n\n" + directOfflineAnswer + DISCLAIMER });
                } else {
                    return res.json({ reply: "🔌 *(Offline Mode)*\nI am currently disconnected from the cloud and couldn't find an answer to that specific question in my local emergency database. Please check your internet connection." + DISCLAIMER });
                }
            }
            // Handle standard busy errors (503/429) fallback here...
            else if (error.status === 503 || error.status === 429) {
                console.warn(`☁️ Cloud Busy. Falling back to Gemini 2.5 Flash...`);
                result = await tryCloudModel("gemini-2.5-flash");
                return res.json({ reply: result.response.text() + DISCLAIMER });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Fatal Chat Error:', error);
        res.status(500).json({ error: 'System Error', details: "Ensure your MongoDB is running locally." });
    }
});

// Medication Identification Endpoint (with Tiered Fallbacks)
app.post('/api/identify', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Image file required' });

        // 1. Get the path to where Multer saved the file on your PC
        const filePath = req.file.path;
        // 2. Create the lightweight URL that will be saved in localStorage
        const imageUrlForFrontend = `/uploads/${req.file.filename}`;

        // 3. Read the file from your PC to send to Gemini
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        const tryVisionModel = async (modelName) => {
            console.log(`[Vision] Attempting identification with: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                { inlineData: { data: base64Data, mimeType: req.file.mimetype } },
                "Identify this medication. Provide: 1. Name, 2. Primary Uses, 3. General Dosage. End with a medical disclaimer."
            ]);
            return result.response.text();
        };

        let reply;
        try {
            reply = await tryVisionModel("gemini-3.1-flash-lite");
        } catch (err1) {
            if (err1.status === 503 || err1.status === 429) {
                try {
                    console.warn("[Vision] 3.1 Busy. Falling back to Tier 2...");
                    reply = await tryVisionModel("gemini-2.5-flash");
                } catch (err2) {
                    if (err2.status === 503 || err2.status === 429) {
                        console.warn("[Vision] 2.5 Flash Busy. Falling back to Tier 3...");
                        reply = await tryVisionModel("gemini-2.5-flash-lite");
                    } else { throw err2; }
                }
            } else { throw err1; }
        }

        // Return BOTH the AI reply and the lightweight image URL
        res.json({ reply: reply + DISCLAIMER, imageUrl: imageUrlForFrontend });

    } catch (error) {
        console.error('Final Vision Error:', error);
        res.status(500).json({
            error: 'The scanning service is currently at capacity.',
            details: "Please try again in a few seconds."
        });
    }
});
// 5. Start Server
app.listen(PORT, () => console.log(`🚀 Salvia AI running on http://localhost:${PORT}`));

