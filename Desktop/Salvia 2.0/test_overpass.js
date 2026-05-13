const axios = require('axios');

async function testNominatim() {
    const lat = 34.1983; // AWKUM location
    const lng = 72.0435;
    const type = 'hospital';
    
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${type}+near+${lat},${lng}&limit=10`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'HealthchatBot/1.0 (Student Project)' }
        });
        
        const results = response.data.map(el => {
            return {
                name: el.name || el.display_name.split(',')[0],
                location: { lat: parseFloat(el.lat), lng: parseFloat(el.lon) },
                vicinity: el.display_name,
                place_id: el.place_id,
                rating: 4.5,
                open_now: true
            };
        });
        console.log("SUCCESS:", results.length, "facilities found.");
        console.log(results.slice(0, 2));
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}
testNominatim();
