# Artificial Intelligence – Powered Health Assistance Chatbot

A comprehensive web application prototype built for a Computer Science Final Year Project. This system acts as an informational healthcare assistant integrating an AI-powered conversational agent, a geolocation hospital tracker, and an image-based medication recognition scanner.

> **Disclaimer:** This tool is for informational purposes only. It does NOT provide medical diagnosis, treatment advice, or replace professional healthcare consultation.

---

## 🌟 Key Features

1. **AI Health Chatbot:** Conversational UI integrating Google Gemini AI to provide answers to common health questions, track symptoms, and recognize user intents.
2. **Nearby Hospital Locator:** Utilizes browser Geolocation and OpenStreetMap (Overpass API) to locate nearby hospitals, clinics, and pharmacies.
3. **Medication Recognition System:** Users can upload a photo of medicine packaging. Google Gemini Vision extracts the text and identifies the medication, fetching usage and precautions from the local database.

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (Glassmorphism design), Vanilla JavaScript, Bootstrap 5
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose)
- **AI/External APIs:** 
  - Google Gemini API (Chat & Vision)

---

## 📂 Project Structure

```text
health-ai-chatbot/
│
├── .env.example              # Environment variables template
├── package.json              # App dependencies
├── server.js                 # Express server entry point
├── seed.js                   # Database population script
│
├── config/
│   └── db.js                 # MongoDB connection
│
├── controllers/
│   └── authController.js     # User authentication logic
│
├── models/
│   ├── FAQ.js                # MongoDB Schema
│   ├── Medicine.js           # MongoDB Schema
│   └── User.js               # MongoDB Schema
│
├── routes/
│   └── authRoutes.js         # API endpoints
│
├── public/                   # Frontend Web App
│   ├── index.html            # Main UI
│   ├── chatbot.html          # Chat interface
│   ├── map.html              # Hospital Locator interface
│   ├── scanner.html          # Medicine Image Upload interface
│   ├── about.html            # Documentation/About page
│   ├── css/styles.css        # Shared custom styling
│   └── js/                   # Frontend scripts
│       ├── chatbot.js
│       ├── map.js
│       └── scanner.js
│
└── uploads/
    └── images/               # Temporary storage for Image Uploads
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a MongoDB Atlas account
- Google AI Studio Account (for Gemini)

### Step 1: Clone or Open the Project
Open a terminal in the `health-ai-chatbot` folder.

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Rename `.env.example` to `.env`. Fill in your specific keys:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthchatbot

# Google Gemini API Key (get yours free at https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key
```

### Step 4: Seed the Database
Populate your MongoDB with sample data (OpenFDA/WHO simulated data):
```bash
node seed.js
```

### Step 5: Start the Server
```bash
node server.js
```
The application will be running at `http://localhost:5000`.

---

## 🌐 Deployment instructions

### Option 1: Render.com
1. Create a GitHub repository and push this code.
2. Log in to [Render](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Set Build Command to: `npm install`
6. Set Start Command to: `node server.js`
7. In the **Environment Variables** section, add your `MONGO_URI` (must be MongoDB Atlas, not localhost) and Google API keys.
8. Click Deploy.

### Option 2: Heroku
1. Install Heroku CLI and login: `heroku login`
2. Create app: `heroku create your-app-name`
3. Add MongoDB: `heroku addons:create mongolab:sandbox`
4. Set Config Vars in Heroku Dashboard for Gemini.
5. Deploy: `git push heroku main`

---


