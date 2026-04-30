const { GoogleGenerativeAI } = require('@google/generative-ai');

const HEALTH_SYSTEM_PROMPT = `You are HealthBot, a friendly AI health assistant for a university Final Year Project web application.
Your job is to answer health-related questions clearly and helpfully.
Always remind users to consult a qualified doctor for diagnosis or treatment.
Never diagnose a condition or prescribe medication.
Be empathetic, concise, and easy to understand.
If the question involves serious symptoms, end with: "⚠️ Please consult a qualified doctor for proper diagnosis and treatment."

User question: `;

const askGemini = async (userMessage) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Missing or invalid Gemini API key");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(HEALTH_SYSTEM_PROMPT + userMessage);
    return result.response.text();
};

const analyzeImageWithGemini = async (base64Image, mimeType) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Missing or invalid Gemini API key");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
        "Extract all text from this image, particularly focusing on medicine names.",
        {
            inlineData: {
                data: base64Image,
                mimeType: mimeType || 'image/jpeg'
            }
        }
    ]);
    return result.response.text();
};

module.exports = { askGemini, analyzeImageWithGemini };
