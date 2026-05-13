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
        answer: "I am Salvia your Health Assistant , I am here to help provide accessible healthcare information."
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
        keywords: ["stomach", "nausea", "vomit", "stomach pain", "stomachache", "belly"],
        answer: "Stomach distress requires careful diet management to avoid irritation.\n\nRecommended First Aid:\n1. Hydrate: Sip clear fluids (water, ginger ale, sports drinks) slowly.\n2. BRAT Diet: Once stable, try Bananas, Rice, Applesauce, and Toast.\n3. Avoid: Dairy, caffeine, fatty foods, and spicy meals.\n4. Rest: Avoid lying completely flat immediately after eating.\n\n⚠️ Consult a doctor if you see blood in stool/vomit, have severe abdominal pain, or signs of dehydration."
    },
    {
        question: "How to treat a cut or bleeding?",
        keywords: ["cut", "bleed", "wound", "bleeding", "scrape", "scratch"],
        answer: "Minor cuts can be treated at home to prevent infection.\n\nRecommended First Aid:\n1. Clean: Rinse the wound gently with cool water.\n2. Pressure: Apply firm pressure with a clean cloth to stop bleeding.\n3. Protect: Apply an antibiotic ointment and cover with a sterile bandage.\n4. Monitor: Watch for redness, swelling, or pus (signs of infection).\n\n⚠️ Consult a doctor if the cut is deep, gaping, won't stop bleeding after 10 mins pressure, or is from a rusty object."
    },
    {
        question: "How to treat a cold, cough, or sore throat?",
        keywords: ["cold", "cough", "sore throat", "congestion", "sneezing", "runny nose"],
        answer: "For a common cold, cough, or sore throat, focus on symptom relief.\n\nRecommended First Aid:\n1. Hydration: Drink warm fluids like tea with honey or warm water.\n2. Rest: Get plenty of sleep to help your body heal.\n3. Soothe Throat: Gargle with warm salt water or use throat lozenges.\n4. Congestion: Use a humidifier or inhale steam.\n\n⚠️ Consult a doctor if symptoms last more than 10 days, you have a high fever, or experience shortness of breath."
    },
    {
        question: "What to do for diarrhea?",
        keywords: ["diarrhea", "loose motion", "loose stools", "bowel"],
        answer: "Diarrhea can quickly lead to dehydration, so fluid replacement is key.\n\nRecommended First Aid:\n1. Hydrate: Drink plenty of water or oral rehydration solutions (ORS).\n2. Diet: Stick to bland foods like the BRAT diet (Bananas, Rice, Applesauce, Toast).\n3. Avoid: Avoid dairy, caffeine, very sweet or greasy foods.\n\n⚠️ Consult a doctor if it lasts more than 2 days, accompanied by severe pain, or if you notice signs of severe dehydration."
    },
    {
        question: "How to handle an allergic reaction?",
        keywords: ["allergy", "allergic reaction", "rash", "hives", "itchy", "swelling"],
        answer: "Mild allergic reactions can often be managed at home.\n\nRecommended First Aid:\n1. Identify & Remove: Move away from the allergen (e.g., pet dander, pollen).\n2. Antihistamine: Take an over-the-counter antihistamine (like Cetirizine) if appropriate.\n3. Cool Compress: Apply a cool cloth to itchy skin or rashes.\n\n🚨 EMERGENCY: Call 911 immediately if you have trouble breathing, swelling of the face/throat, or severe dizziness (Anaphylaxis)."
    },
    {
        question: "How to treat a minor burn?",
        keywords: ["burn", "burnt", "scald", "fire"],
        answer: "For minor burns (first-degree), prompt action reduces damage.\n\nRecommended First Aid:\n1. Cool: Run cool (not cold) water over the burn for 10-15 minutes. Do NOT use ice.\n2. Protect: Cover with a sterile, non-fluffy bandage or clean cloth.\n3. Pain Relief: Take OTC pain relievers if needed.\n4. Avoid: Do not apply butter, oil, or pop any blisters.\n\n⚠️ Consult a doctor if the burn is larger than 3 inches, on the face/hands, or if it looks deep (white or charred)."
    },
    {
        question: "How to stop a nosebleed?",
        keywords: ["nosebleed", "nose", "bleeding nose", "bloody nose"],
        answer: "Nosebleeds are common and usually easy to stop.\n\nRecommended First Aid:\n1. Sit Upright: Lean slightly forward, not backward, so you don't swallow blood.\n2. Pinch: Pinch the soft part of your nose shut.\n3. Hold: Keep pinching firmly for 10-15 minutes without letting go to check.\n4. Cool Compress: Apply an ice pack to the bridge of your nose.\n\n⚠️ Consult a doctor if the bleeding doesn't stop after 20 minutes, is very heavy, or follows a head injury."
    },
    {
        question: "How to treat a sprain or muscle strain?",
        keywords: ["sprain", "strain", "twisted ankle", "pulled muscle", "swollen joint", "muscle"],
        answer: "For minor sprains and strains, remember the R.I.C.E. method.\n\nRecommended First Aid:\n1. Rest: Avoid putting weight on the injured area.\n2. Ice: Apply an ice pack wrapped in a towel for 15-20 minutes every few hours.\n3. Compression: Wrap the area snugly (but not too tightly) with an elastic bandage.\n4. Elevate: Keep the injured limb raised above heart level to reduce swelling.\n\n⚠️ Consult a doctor if you cannot put any weight on it, there is severe pain, or the area is numb."
    },
    {
        question: "What to do for sunburn?",
        keywords: ["sunburn", "sun", "peeling skin", "red skin", "sunbaked"],
        answer: "Sunburns require cooling and intense moisturizing.\n\nRecommended First Aid:\n1. Cool Down: Take a cool bath or shower.\n2. Moisturize: Apply aloe vera gel or a soy-based moisturizer while skin is still damp.\n3. Hydrate: Drink extra water to prevent dehydration.\n4. Pain Relief: Take an OTC pain reliever like ibuprofen to reduce inflammation.\n\n⚠️ Consult a doctor if severe blistering covers a large portion of the body, or if accompanied by high fever or chills."
    },
    {
        question: "What to do for acid reflux or heartburn?",
        keywords: ["heartburn", "acid", "reflux", "gerd", "chest burning", "indigestion"],
        answer: "Heartburn is uncomfortable but usually manageable with lifestyle tweaks.\n\nRecommended First Aid:\n1. Stand Up: Remain upright; do not lie down immediately after eating.\n2. Antacids: Take an over-the-counter antacid to neutralize stomach acid.\n3. Loosen Clothing: Unbutton tight pants or belts that press on your stomach.\n4. Sip Water: Drinking a small amount of water can help wash acid back down.\n\n⚠️ Consult a doctor if heartburn occurs multiple times a week, over-the-counter meds don't help, or if you have difficulty swallowing."
    },
    {
        question: "How to treat something in your eye?",
        keywords: ["eye", "dust", "irritation", "something in eye", "red eye"],
        answer: "Eye irritation requires gentle care to avoid scratching the cornea.\n\nRecommended First Aid:\n1. Wash Hands: Always clean your hands before touching your face.\n2. Flush: Use saline solution or clean, lukewarm water to gently flush the eye.\n3. Blink: Blinking rapidly can help tears wash the object out.\n4. Do NOT Rub: Never rub your eye, as this can scratch the surface.\n\n⚠️ Consult a doctor immediately if the object doesn't come out, vision is affected, or the pain worsens."
    },
    {
        question: "What to do for chest pain?",
        keywords: ["chest", "heart attack", "chest pain"],
        answer: "🚨 CRITICAL WARNING: Chest pain is a serious symptom.\n\nCALL EMERGENCY SERVICES (1122) IMMEDIATELY. Do not drive yourself to the hospital. Chew an aspirin if not allergic and advised by dispatch."
    },
    {
        question: "What are the symptoms of flu?",
        keywords: ["flu", "influenza", "symptoms"],
        answer: "Common flu symptoms include fever, chills, muscle aches, cough, congestion, runny nose, headaches, and fatigue."
    },
    {
        question: "What to do if someone is choking?",
        keywords: ["choking", "choke", "cant breathe", "airway", "blocked"],
        answer: "🚨 EMERGENCY: If the person cannot breathe, speak, or cough, act immediately.\n\nRecommended First Aid (Heimlich Maneuver):\n1. Stand behind them and wrap your arms around their waist.\n2. Make a fist with one hand and place the thumb side just above their belly button.\n3. Grasp your fist with your other hand.\n4. Give quick, upward thrusts as if trying to lift them off the ground.\n5. Repeat until the object pops out.\n\nCall emergency services (1122) immediately if the object does not dislodge."
    },
    {
        question: "How to treat a toothache?",
        keywords: ["toothache", "tooth", "teeth", "dental", "gum pain"],
        answer: "Toothaches indicate dental issues and require a dentist, but you can manage the pain temporarily.\n\nRecommended First Aid:\n1. Rinse: Swish warm salt water in your mouth to clean the area.\n2. Floss: Gently floss around the tooth to remove trapped food.\n3. Compress: Apply a cold compress to the outside of your cheek to reduce swelling.\n4. Pain Relief: Take an OTC pain reliever like Ibuprofen.\n\n⚠️ Consult a dentist as soon as possible. Do not put aspirin directly on your gums."
    },
    {
        question: "What to do for food poisoning?",
        keywords: ["food poisoning", "vomiting", "spoiled food", "stomach bug"],
        answer: "Food poisoning symptoms (nausea, vomiting, diarrhea) usually pass within 48 hours, but hydration is critical.\n\nRecommended First Aid:\n1. Rest Your Stomach: Let your stomach settle for a few hours without food.\n2. Hydrate: Sip clear liquids, water, or oral rehydration solutions slowly.\n3. Eat Bland: When you feel ready, start with the BRAT diet (Bananas, Rice, Applesauce, Toast).\n\n⚠️ Consult a doctor if you cannot keep liquids down for 24 hours, have blood in your vomit/stool, or experience a fever above 102°F (38.9°C)."
    },
    {
        question: "What to do for a mild asthma attack?",
        keywords: ["asthma", "wheezing", "shortness of breath", "breathing"],
        answer: "Asthma requires careful monitoring. If you have a prescribed inhaler, use it immediately.\n\nRecommended First Aid:\n1. Sit Up: Sit upright to open the airways; do not lie down.\n2. Inhaler: Take 1-2 puffs of your reliever inhaler (like Albuterol) slowly and steadily.\n3. Calm Down: Try to take slow, deep breaths to prevent hyperventilating.\n\n🚨 EMERGENCY: Call 1122 if your inhaler doesn't help, you are struggling to speak in full sentences, or your lips/face are turning blue."
    },
    {
        question: "How to relieve constipation?",
        keywords: ["constipation", "constipated", "bowel movement", "hard stool"],
        answer: "Constipation can usually be treated with dietary adjustments.\n\nRecommended Advice:\n1. Hydrate: Drink plenty of water throughout the day.\n2. Fiber: Eat high-fiber foods like prunes, beans, whole grains, and apples.\n3. Movement: Go for a walk or do some light exercise to stimulate your bowels.\n4. OTC Relief: A gentle stool softener or laxative can be used temporarily.\n\n⚠️ Consult a doctor if it lasts more than a week, is accompanied by severe abdominal pain, or you see blood."
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
    },
    {
        question: "How much water should I drink a day?",
        keywords: ["water", "hydrate", "hydration", "drink", "thirsty"],
        answer: "A general rule is to drink about 8 glasses (2 liters) of water a day. However, your exact needs vary based on your physical activity, climate, and overall health."
    },
    {
        question: "How many hours of sleep do I need?",
        keywords: ["sleep", "rest", "hours", "insomnia", "tired", "fatigue"],
        answer: "Most healthy adults need between 7 to 9 hours of sleep per night to function at their best. Lack of sleep can weaken your immune system and affect concentration."
    },
    {
        question: "Can antibiotics cure a cold or the flu?",
        keywords: ["antibiotic", "antibiotics", "cold", "flu", "virus", "viral"],
        answer: "No. Antibiotics only kill bacteria. The common cold, flu, and most sore throats are caused by viruses, meaning antibiotics will not help you recover and can cause unnecessary side effects."
    },
    {
        question: "Should I use ice or heat for an injury?",
        keywords: ["ice", "heat", "cold compress", "heating pad", "injury", "swelling", "swollen"],
        answer: "Use ICE for acute injuries (like a fresh sprain or bump) during the first 24-48 hours to reduce swelling and numb pain. Use HEAT for chronic pain, muscle spasms, or stiffness to relax muscles and increase blood flow."
    },
    {
        question: "What are the symptoms of high blood pressure?",
        keywords: ["blood pressure", "hypertension", "bp", "high bp"],
        answer: "High blood pressure is often called the 'silent killer' because it typically has NO symptoms until it reaches a critical stage. The only way to know if your blood pressure is high is to have it measured regularly by a healthcare professional."
    },
    {
        question: "What are the basic steps for Hands-Only CPR?",
        keywords: ["cpr", "heart stops", "unconscious", "not breathing", "chest compressions", "revive"],
        answer: "🚨 EMERGENCY: Call your local emergency number immediately. For Hands-Only CPR on a teen or adult: Push hard and fast in the center of the chest at a rate of 100 to 120 compressions per minute (to the beat of the song 'Stayin' Alive')."
    },
    {
        question: "How can I boost my immune system?",
        keywords: ["immune", "immunity", "boost", "prevent sick", "vitamins"],
        answer: "To support your immune system: maintain a balanced diet rich in fruits and vegetables (Vitamin C and Zinc), exercise regularly, get 7-9 hours of sleep, manage stress, and wash your hands frequently."
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
    },
    {
        name: "Aspirin 81mg",
        uses: ["Pain relief", "Fever reduction", "Heart attack prevention (low dose)"],
        precautions: ["Take with food", "Do not give to children or teenagers (risk of Reye's syndrome)", "May increase bleeding risk"]
    },
    {
        name: "Omeprazole 20mg",
        uses: ["Acid reflux", "Heartburn", "Stomach ulcers", "GERD"],
        precautions: ["Take 30-60 minutes before a meal", "Swallow whole, do not crush", "Consult doctor if using for more than 14 days"]
    },
    {
        name: "Loperamide 2mg",
        uses: ["Acute diarrhea", "Traveler's diarrhea"],
        precautions: ["Do not use if you have bloody stools or high fever", "Drink plenty of clear fluids to prevent dehydration", "May cause dizziness or drowsiness"]
    },
    {
        name: "Loratadine 10mg",
        uses: ["Allergies", "Sneezing", "Runny nose", "Itchy eyes"],
        precautions: ["Generally non-drowsy formulation", "Consult doctor if pregnant or breastfeeding", "Do not exceed daily recommended dose"]
    },
    {
        name: "Diphenhydramine 25mg",
        uses: ["Severe allergic reactions", "Motion sickness", "Short-term insomnia"],
        precautions: ["Highly likely to cause severe drowsiness", "Do not drive or operate machinery", "Avoid alcohol"]
    },
    {
        name: "Guaifenesin 400mg (Cough Expectorant)",
        uses: ["Chest congestion", "Mucus relief", "Productive coughs"],
        precautions: ["Drink plenty of water to help loosen mucus", "May cause slight nausea", "Do not use for chronic coughs like asthma without a doctor's advice"]
    },
    {
        name: "Simethicone 125mg",
        uses: ["Gas relief", "Bloating", "Stomach pressure"],
        precautions: ["Chew tablets thoroughly before swallowing", "Can be taken after meals and at bedtime", "Generally very safe with few side effects"]
    },
    {
        name: "Metformin 500mg",
        uses: ["Type 2 Diabetes management", "Blood sugar control"],
        precautions: ["Take with meals to reduce stomach upset", "Do not skip meals", "Consult a doctor before taking with other medications"]
    },
    {
        name: "Azithromycin 250mg",
        uses: ["Bacterial infections", "Respiratory infections", "Skin infections", "Strep throat"],
        precautions: ["Complete the entire prescribed course", "Can be taken with or without food", "Avoid taking antacids within 2 hours of this medication"]
    },
    {
        name: "Lansoprazole 15mg",
        uses: ["Frequent heartburn", "Acid reflux", "GERD"],
        precautions: ["Take in the morning before eating", "Swallow whole, do not crush or chew", "May take 1-4 days for full effect"]
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
