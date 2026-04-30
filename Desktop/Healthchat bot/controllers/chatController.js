const ChatLog = require('../models/ChatLog');
const FAQ = require('../models/FAQ');
const { askGemini } = require('../config/gemini');

// Cache a simple map of sessionId for a simple setup, or pass from frontend
exports.handleChat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let botResponse = '';

        // Attempt to call Google Gemini API
        try {
            if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
                botResponse = await askGemini(message);
            }
        } catch (geminiError) {
            console.error('Gemini Error Details:', geminiError.message || geminiError);
            // Fallback gracefully to FAQ below
        }

        // Fallback: If Gemini fails or is not configured, search FAQ database
        if (!botResponse) {
            const faqs = await FAQ.find();
            const lowerMessage = message.toLowerCase();
            let matchedFaq = null;

            for (let faq of faqs) {
                const hasMatch = faq.keywords.some(kw => {
                    const regex = new RegExp(`\\b${kw}\\b`, 'i');
                    return regex.test(lowerMessage);
                });
                if (hasMatch) {
                    matchedFaq = faq;
                    break;
                }
            }

            if (matchedFaq) {
                botResponse = matchedFaq.answer;
            } else {
                botResponse = "I'm sorry, I couldn't understand that. Could you please rephrase your health-related question?";
            }
        }

        // Save to Database
        const chatLog = new ChatLog({
            user_message: message,
            bot_response: botResponse,
        });
        await chatLog.save();

        res.json({ reply: botResponse });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
