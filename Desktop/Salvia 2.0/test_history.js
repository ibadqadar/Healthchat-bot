const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const triggerMapTool = {
        functionDeclarations: [{
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
        }]
    };
    const SYSTEM_INSTRUCTION = "You are the 'AWKUM Health Assistant'. DO NOT output disclaimers.";
    
    const history = [
        { role: 'user', parts: [{ text: 'I have a headache' }] },
        { role: 'model', parts: [{ text: 'Here are tips. Want a doctor?' }] },
    ];
    
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.1-flash-lite',
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const chat = model.startChat({
            history: history,
            tools: [triggerMapTool]
        });

        const response = await chat.sendMessage('yes suggest me');
        const calls = response.response.functionCalls ? response.response.functionCalls() : null;
        console.log("SUCCESS:", response.response.text(), calls);
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}
test();
