const { analyzeImageWithGemini } = require('../config/gemini');
const Medicine = require('../models/Medicine');
const fs = require('fs');

exports.scanMedicine = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image.' });
        }

        const filePath = req.file.path;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
            // Simulated response for easy local testing
            console.log(`[Simulation] Image uploaded to ${filePath}`);
            
            // Search DB for 'Paracetamol' as a fallback test
            const fallbackMed = await Medicine.findOne({ name: new RegExp('Paracetamol', 'i') });
            
            return res.json({ 
                text: "SIMULATED TEXT: PARACETAMOL 500MG", 
                medicine: fallbackMed || { name: 'Paracetamol (Simulated)', uses: ['Pain relief', 'Fever reducer'], precautions: ['Do not exceed recommended dose'] },
                warning: 'Gemini API not configured. Returning simulated data.'
            });
        }

        // Read file as base64
        const fileData = fs.readFileSync(filePath);
        const base64Image = fileData.toString('base64');
        const mimeType = req.file.mimetype;

        let extractedText = '';
        try {
            extractedText = await analyzeImageWithGemini(base64Image, mimeType);
        } catch (visionError) {
            console.error('Gemini Vision Error:', visionError.message || visionError);
            return res.status(500).json({ error: 'Failed to analyze image with Gemini' });
        }

        // Search the database for any matching medicine name
        let matchedMedicine = null;
        if (extractedText) {
            // Find all medicines to do a simple string matching 
            const allMedicines = await Medicine.find();
            
            for (let med of allMedicines) {
                // simple case-insensitive substring match
                if (extractedText.toLowerCase().includes(med.name.toLowerCase())) {
                    matchedMedicine = med;
                    break;
                }
            }
        }

        // Clean up the uploaded file to save space (Optional)
        // fs.unlinkSync(filePath);

        res.json({
            text: extractedText,
            medicine: matchedMedicine
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
};
