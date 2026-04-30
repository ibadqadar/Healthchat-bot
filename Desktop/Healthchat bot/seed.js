require('dotenv').config();
const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
const Medicine = require('./models/Medicine');
const connectDB = require('./config/db');

// Sample OpenFDA / WHO inspired dataset

const faqs = [
    {
        question: "Hello / Hi / Greetings",
        keywords: ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "howdy", "hii", "heyo", "good evening"],
        answer: "Hello! I am your AI Health Assistant. How can I help you today? You can ask me about symptoms, conditions, or uses of common medicines."
    },
    {
        question: "How are you?",
        keywords: ["how are you", "how do you do", "what's up"],
        answer: "I'm a bot, so I don't have feelings, but I'm fully operational and ready to help you with your health-related questions!"
    },
    {
        question: "Who are you?",
        keywords: ["who are you", "what are you", "your name", "who made you"],
        answer: "I am an Artificial Intelligence Health Assistance Chatbot, created as a Final Year Project to help provide accessible healthcare information."
    },
    {
        question: "Feeling sick / Not feeling well",
        keywords: ["sick", "ill", "not feeling well", "feel bad", "feeling sick", "unwell", "feel terrible", "feeling weak", "not well"],
        answer: "I'm sorry to hear you're not feeling well today. Could you describe your specific symptoms? For example, do you have a fever, headache, stomach pain, or a cough?"
    },
    {
        question: "What should I do for a fever?",
        keywords: ["fever", "temperature", "hot"],
        answer: "A fever is your body's way of fighting infection. Here is how to manage it:\n\nRecommended First Aid:\n1. Fluids: Drink plenty of water, broth, or electrolyte solutions.\n2. Cool Down: Use a lukewarm sponge bath (avoid ice water).\n3. Clothing: Wear light, breathable clothing and avoid heavy blankets.\n4. Rest: Your body needs energy to fight the infection.\n\n⚠️ Consult a doctor if your temperature exceeds 103°F (39.4°C), lasts >3 days, or is accompanied by severe headache/rash."
    },
    {
        question: "How to treat a headache?",
        keywords: ["headache", "migraine", "head hurts"],
        answer: "Headaches can often be managed at home, but pay attention to severity.\n\nRecommended First Aid:\n1. Hydration: Drink 1-2 glasses of water immediately.\n2. Rest: Lie down in a dark, quiet room to reduce sensory overload.\n3. Compress: Apply a cold pack to your forehead or a warm cloth to your neck.\n4. OTC Medication: Acetaminophen or Ibuprofen can help.\n\n⚠️ Consult a doctor immediately if you have a sudden 'thunderclap' headache, stiff neck, slurred speech, or vision loss."
    },
    {
        question: "How to cure stomach pain and nausea?",
        keywords: ["stomach", "nausea", "vomit", "stomach pain"],
        answer: "Stomach distress requires careful diet management to avoid irritation.\n\nRecommended First Aid:\n1. Hydrate: Sip clear fluids (water, ginger ale, sports drinks) slowly.\n2. BRAT Diet: Once stable, try Bananas, Rice, Applesauce, and Toast.\n3. Avoid: Dairy, caffeine, fatty foods, and spicy meals.\n4. Rest: Avoid lying completely flat immediately after eating.\n\n⚠️ Consult a doctor if you see blood in stool/vomit, have severe abdominal pain, or signs of dehydration."
    },
    {
        question: "How to treat a cut or bleeding?",
        keywords: ["cut", "bleed", "wound", "bleeding"],
        answer: "Minor cuts can be treated at home to prevent infection.\n\nRecommended First Aid:\n1. Clean: Rinse the wound gently with cool water.\n2. Pressure: Apply firm pressure with a clean cloth to stop bleeding.\n3. Protect: Apply an antibiotic ointment and cover with a sterile bandage.\n4. Monitor: Watch for redness, swelling, or pus (signs of infection).\n\n⚠️ Consult a doctor if the cut is deep, gaping, won't stop bleeding after 10 mins pressure, or is from a rusty object."
    },
    {
        question: "How to treat a cold, cough, or sore throat?",
        keywords: ["cold", "cough", "sore throat", "congestion"],
        answer: "For a common cold, cough, or sore throat, focus on symptom relief.\n\nRecommended First Aid:\n1. Hydration: Drink warm fluids like tea with honey or warm water.\n2. Rest: Get plenty of sleep to help your body heal.\n3. Soothe Throat: Gargle with warm salt water or use throat lozenges.\n4. Congestion: Use a humidifier or inhale steam.\n\n⚠️ Consult a doctor if symptoms last more than 10 days, you have a high fever, or experience shortness of breath."
    },
    {
        question: "What to do for diarrhea?",
        keywords: ["diarrhea", "loose motion", "loose stools"],
        answer: "Diarrhea can quickly lead to dehydration, so fluid replacement is key.\n\nRecommended First Aid:\n1. Hydrate: Drink plenty of water or oral rehydration solutions (ORS).\n2. Diet: Stick to bland foods like the BRAT diet (Bananas, Rice, Applesauce, Toast).\n3. Avoid: Avoid dairy, caffeine, very sweet or greasy foods.\n\n⚠️ Consult a doctor if it lasts more than 2 days, accompanied by severe pain, or if you notice signs of severe dehydration."
    },
    {
        question: "How to handle an allergic reaction?",
        keywords: ["allergy", "allergic reaction", "rash", "hives"],
        answer: "Mild allergic reactions can often be managed at home.\n\nRecommended First Aid:\n1. Identify & Remove: Move away from the allergen (e.g., pet dander, pollen).\n2. Antihistamine: Take an over-the-counter antihistamine (like Cetirizine) if appropriate.\n3. Cool Compress: Apply a cool cloth to itchy skin or rashes.\n\n🚨 EMERGENCY: Call 911 immediately if you have trouble breathing, swelling of the face/throat, or severe dizziness (Anaphylaxis)."
    },
    {
        question: "How to treat a minor burn?",
        keywords: ["burn", "burnt"],
        answer: "For minor burns (first-degree), prompt action reduces damage.\n\nRecommended First Aid:\n1. Cool: Run cool (not cold) water over the burn for 10-15 minutes. Do NOT use ice.\n2. Protect: Cover with a sterile, non-fluffy bandage or clean cloth.\n3. Pain Relief: Take OTC pain relievers if needed.\n4. Avoid: Do not apply butter, oil, or pop any blisters.\n\n⚠️ Consult a doctor if the burn is larger than 3 inches, on the face/hands, or if it looks deep (white or charred)."
    },
    {
        question: "What to do for chest pain?",
        keywords: ["chest", "heart attack", "chest pain"],
        answer: "🚨 CRITICAL WARNING: Chest pain is a serious symptom.\n\nCALL EMERGENCY SERVICES (911) IMMEDIATELY. Do not drive yourself to the hospital. Chew an aspirin if not allergic and advised by dispatch."
    },
    {
        question: "What are the symptoms of flu?",
        keywords: ["flu", "influenza", "symptoms"],
        answer: "Common flu symptoms include fever, chills, muscle aches, cough, congestion, runny nose, headaches, and fatigue."
    },
    {
        question: "What is paracetamol used for?",
        keywords: ["paracetamol", "acetaminophen", "panadol"],
        answer: "Paracetamol is a common painkiller used to treat aches and pain. It can also be used to reduce a high temperature."
    },
    {
        question: "How long should I wash my hands?",
        keywords: ["wash", "hands", "hygiene"],
        answer: "The WHO recommends washing your hands for at least 20 seconds using soap and water to effectively prevent the spread of infections."
    }
];

const medicines = [
    {
        name: "Paracetamol 500mg",
        uses: ["Pain relief", "Fever reduction", "Headaches", "Muscle aches"],
        precautions: ["Do not exceed 4000mg per day", "Avoid alcohol", "Consult doctor if pregnant"]
    },
    {
        name: "Amoxicillin 250mg",
        uses: ["Bacterial infections", "Pneumonia", "Bronchitis", "Ear infections"],
        precautions: ["Complete the full course", "May cause stomach upset", "Allergic reactions possible (penicillin allergy)"]
    },
    {
        name: "Ibuprofen 400mg",
        uses: ["Inflammation", "Pain relief", "Fever", "Arthritis"],
        precautions: ["Take with food to avoid stomach upset", "Do not take if allergic to NSAIDs", "May increase risk of heart attack"]
    },
    {
        name: "Cetirizine 10mg",
        uses: ["Allergies", "Hay fever", "Hives"],
        precautions: ["May cause drowsiness", "Avoid driving immediately after taking", "Limit alcohol consumption"]
    }
];

const seedDB = async () => {
    try {
        await connectDB();
        
        console.log('Clearing existing data...');
        await FAQ.deleteMany();
        await Medicine.deleteMany();

        console.log('Inserting sample FAQs...');
        await FAQ.insertMany(faqs);

        console.log('Inserting sample Medicines...');
        await Medicine.insertMany(medicines);

        console.log('Database successfully seeded!');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
