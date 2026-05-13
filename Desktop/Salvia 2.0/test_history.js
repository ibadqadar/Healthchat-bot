const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const triggerMapTool = {
        name: 'trigger_openstreet_maps',
        description: 'Triggers the OpenStreetMap tool. ONLY use this tool IMMEDIATELY for Critical Emergencies (chest pain, stroke, severe bleeding, unconsciousness, severe breathing issues). For ALL other routine issues (headache, flu, fever, back pain, etc.), you MUST ask the user for permission first and ONLY use this tool if the user explicitly replies "Yes".',
        parameters: {
            type: 'OBJECT',
            properties: {
                facilityType: {
                    type: 'STRING',
                    description: 'The type of facility to search for (e.g., "hospital", "doctor", "pharmacy", "dentist").',
                    enum: ['hospital', 'doctor', 'pharmacy', 'dentist']
                }
            },
            required: ['facilityType']
        }
    };
    const SYSTEM_INSTRUCTION = "You are the 'AWKUM Health Assistant'. DO NOT output disclaimers.";
    
    const history = [
        { role: 'user', parts: [{ text: 'I have a headache' }] },
        { role: 'model', parts: [{ text: 'Here are tips. Want a doctor?' }] },
        { role: 'user', parts: [{ text: 'yes suggest me' }] }
    ];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: history,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ functionDeclarations: [triggerMapTool] }],
            }
        });
        console.log("SUCCESS:", response.text, response.functionCalls);
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}
test();
