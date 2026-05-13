require('dotenv').config();
const axios = require('axios');
const key = process.env.GEMINI_API_KEY;

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await axios.get(url);
        const models = res.data.models.map(m => m.name);
        console.log('Available models:', models);
    } catch (e) {
        console.error('ERROR RESPONSE:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
run();
