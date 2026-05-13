let leafletMap = null;

document.addEventListener('DOMContentLoaded', () => {
    const locateBtn = document.getElementById('locateBtn');
    const mapSection = document.getElementById('mapSection');
    const errorAlert = document.getElementById('locationError');
    const hospitalList = document.getElementById('hospitalList');
    const resultCount = document.getElementById('resultCount');
    const facilityTypeSelect = document.getElementById('facilityType');

    locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser.");
            return;
        }

        // Show UI immediately
        mapSection.classList.remove('d-none');
        mapSection.scrollIntoView({ behavior: 'smooth' });

        locateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Locating...';
        locateBtn.disabled = true;
        errorAlert.classList.add('d-none');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const type = facilityTypeSelect.value;
                
                locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-2"></i> Update Location';
                locateBtn.disabled = false;
                
                // Initialize OpenStreetMap with the user's coordinates
                await initOpenStreetMap(lat, lng, type);
            },
            (error) => {
                let errorMsg = "An unknown error occurred.";
                if (error.code === 1) errorMsg = "Please allow location access to use this feature.";
                if (error.code === 2) errorMsg = "Location information is unavailable.";
                if (error.code === 3) errorMsg = "The request to get user location timed out.";
                
                showError(errorMsg);
                locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-2"></i> Detect My Location';
                locateBtn.disabled = false;
            }
        );
    });

    // Auto-trigger map initialization if 'auto' param is present in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto') === 'true') {
        const typeParam = urlParams.get('type');
        if (typeParam) {
            facilityTypeSelect.value = typeParam;
        }
        locateBtn.click();
    }

    async function initOpenStreetMap(lat, lng, type) {
        const mapContainer = document.getElementById('map');
        
        // Remove existing map instance before re-initializing
        if (leafletMap) leafletMap.remove();
        mapContainer.innerHTML = '';
        
        // Initialize Leaflet Map
        leafletMap = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        // Add User Location Pin
        L.circleMarker([lat, lng], { radius: 8, fillColor: "#4285F4", color: "#fff", weight: 3, opacity: 1, fillOpacity: 1 })
         .addTo(leafletMap).bindPopup("You are here!");

        hospitalList.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border text-success mb-3" role="status"></div>
                <p>Searching OpenStreetMap database...</p>
            </div>
        `;

        // Map frontend dropdown types to standard OSM database tags
        let osmTag = "hospital";
        if (type === "doctor") osmTag = "clinic"; 
        if (type === "pharmacy") osmTag = "pharmacy";
        if (type === "dentist") osmTag = "dentist";

        // Query OSM for facilities within a 15km (15000 meters) radius
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="${osmTag}"](around:15000,${lat},${lng});
              way["amenity"="${osmTag}"](around:15000,${lat},${lng});
            );
            out center;
        `;

        try {
            // Fetch data directly from the public Overpass API
            const response = await fetch(`https://overpass-api.de/api/interpreter`, {
                method: 'POST',
                body: query
            });
            const data = await response.json();
            
            hospitalList.innerHTML = '';
            
            if (data.elements && data.elements.length > 0) {
                resultCount.textContent = data.elements.length;
                
                data.elements.forEach(element => {
                    const elLat = element.lat || element.center.lat;
                    const elLng = element.lon || element.center.lon;
                    const name = element.tags.name || `Unnamed ${type}`;
                    const address = element.tags['addr:street'] || "Address unavailable";

                    // Drop pin on the map
                    const marker = L.marker([elLat, elLng]).addTo(leafletMap);
                    marker.bindPopup(`<b>${name}</b><br>${address}`);

                    // Create the sidebar card
                    const card = document.createElement('div');
                    card.className = 'glass-card hospital-card p-3 mb-3 border';
                    card.style.borderLeftColor = '#198754';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="fw-bold mb-1" style="color: #198754;">${name}</h6>
                        </div>
                        <p class="text-muted small mb-2"><i class="fa-solid fa-map-pin me-1"></i> ${address}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="badge bg-light text-success border border-success">Verified OSM Data</span>
                            <a href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat},${lng};${elLat},${elLng}" target="_blank" class="btn btn-sm btn-outline-success" style="font-size: 0.75rem;">Get Directions</a>
                        </div>
                    `;
                    
                    // Make hovering the card open the map popup
                    card.addEventListener('mouseenter', () => {
                        marker.openPopup();
                    });
                    
                    hospitalList.appendChild(card);
                });
            } else {
                resultCount.textContent = "0";
                hospitalList.innerHTML = `<div class="text-center py-5 text-muted"><p>No facilities found in this area.</p></div>`;
            }
        } catch (err) {
            console.error("Overpass API Error:", err);
            hospitalList.innerHTML = `<div class="alert alert-danger mx-2">Error loading map data from OpenStreetMap.</div>`;
        }
    }

    function showError(msg) {
        errorAlert.classList.remove('d-none');
        errorAlert.querySelector('span').textContent = msg;
    }
});