const axios = require('axios');

exports.getNearbyHospitals = async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type = 'hospital' } = req.query; // Default radius: 5000 meters, Default type: hospital

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey || apiKey === 'your_google_maps_api_key') {
            return res.status(500).json({ error: 'Google Maps API Key not configured on the server.' });
        }

        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
        
        const response = await axios.get(url);
        
        // Extract relevant information
        const hospitals = response.data.results.map(place => ({
            name: place.name,
            location: place.geometry.location,
            vicinity: place.vicinity,
            rating: place.rating,
            place_id: place.place_id,
            open_now: place.opening_hours ? place.opening_hours.open_now : null
        }));

        res.json({ hospitals });
    } catch (error) {
        console.error('Map Controller Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
    }
};
