const axios = require('axios');

async function testOverpass() {
    const lat = 34.1983; // AWKUM location
    const lng = 72.0435;
    const osmTag = 'hospital';
    
    const query = `
        [out:json][timeout:25];
        (
          node["amenity"="${osmTag}"](around:15000,${lat},${lng});
          way["amenity"="${osmTag}"](around:15000,${lat},${lng});
        );
        out center;
    `;

    try {
        const url = `https://overpass-api.de/api/interpreter`;
        const response = await axios.post(url, query, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const results = response.data.elements.map(el => {
            return {
                name: el.tags.name || `Unnamed ${osmTag}`,
                location: { lat: el.lat || el.center.lat, lng: el.lon || el.center.lon },
                vicinity: el.tags['addr:street'] || "Address unavailable",
            };
        });
        console.log("SUCCESS:", results.length, "facilities found.");
        console.log(results.slice(0, 2));
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}
testOverpass();
