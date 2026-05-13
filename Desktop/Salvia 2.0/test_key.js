require('dotenv').config();
const axios = require('axios');
const key = process.env.GEMINI_API_KEY;

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
    try {
        const res = await axios.post(url, {
            contents: [{ parts: [{ text: 'Say hi.' }] }]
        });
        console.log('SUCCESS! Reply:', res.data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error('ERROR RESPONSE:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
run();
