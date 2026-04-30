require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSDK() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Just reply with the word 'Hello'");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("SDK FAIL:", e.message);
    }
}
testSDK();
