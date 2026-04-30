let map;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    const locateBtn = document.getElementById('locateBtn');
    const mapSection = document.getElementById('mapSection');
    const errorAlert = document.getElementById('locationError');
    const mapLoading = document.getElementById('mapLoading');
    const hospitalList = document.getElementById('hospitalList');
    const resultCount = document.getElementById('resultCount');
    const facilityTypeSelect = document.getElementById('facilityType');

    locateBtn.addEventListener('click', () => {
        
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser.");
            return;
        }

        // UI Updates
        locateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Locating...';
        locateBtn.disabled = true;
        errorAlert.classList.add('d-none');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Show Map section
                mapSection.classList.remove('d-none');
                
                // Reset Button
                locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-2"></i> Update Location';
                locateBtn.disabled = false;
                
                // Init Map
                initMap(lat, lng);
                
                // Fetch Facilities
                const type = facilityTypeSelect.value;
                await fetchHospitals(lat, lng, type);
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

    async function fetchHospitals(lat, lng, type = 'hospital') {
        hospitalList.innerHTML = `
            <div class="text-center py-5 text-muted" id="mapLoading">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <p>Searching for facilities...</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/hospitals?lat=${lat}&lng=${lng}&type=${type}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch nearby hospitals.");
            }

            hospitalList.innerHTML = '';
            
            if (data.hospitals && data.hospitals.length > 0) {
                resultCount.textContent = data.hospitals.length;
                
                data.hospitals.forEach((hospital, index) => {
                    // Create Marker
                    addMarker(hospital);
                    
                    // Create List Item
                    const card = document.createElement('div');
                    card.className = 'glass-card hospital-card p-3 mb-3 border';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="fw-bold mb-1 text-primary">${hospital.name}</h6>
                            ${hospital.open_now !== null ? 
                                `<span class="badge ${hospital.open_now ? 'bg-success' : 'bg-danger'}" style="font-size: 0.6rem;">${hospital.open_now ? 'OPEN' : 'CLOSED'}</span>` : ''}
                        </div>
                        <p class="text-muted small mb-2"><i class="fa-solid fa-map-pin me-1"></i> ${hospital.vicinity}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            ${hospital.rating ? `<span class="badge bg-warning text-dark"><i class="fa-solid fa-star text-dark me-1"></i> ${hospital.rating}</span>` : '<span class="text-muted small">No rating</span>'}
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${hospital.location.lat},${hospital.location.lng}" target="_blank" class="btn btn-sm btn-outline-primary" style="font-size: 0.75rem;">Get Directions</a>
                        </div>
                    `;
                    
                    // Highlight marker on hover
                    card.addEventListener('mouseenter', () => {
                        markers[index].setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => markers[index].setAnimation(null), 750);
                    });
                    
                    hospitalList.appendChild(card);
                });
            } else {
                resultCount.textContent = "0";
                hospitalList.innerHTML = `<div class="text-center py-5 text-muted"><p>No facilities found in this area for the selected category.</p></div>`;
            }

        } catch (error) {
            console.error("Map Error:", error);
            hospitalList.innerHTML = `<div class="alert alert-danger mx-2">Error: API Key may be misconfigured. See console.</div>`;
        }
    }

    // Standard Google Maps callback
    window.initMap = function(lat = 0, lng = 0) {
        
        // This fails gracefully if Google Maps script isn't loaded (simulated environment)
        if (typeof google === 'undefined') {
            document.getElementById('map').innerHTML = `
                <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light text-muted">
                    <i class="fa-solid fa-map mb-3" style="font-size: 3rem;"></i>
                    <p>Google Maps script not loaded yet.</p>
                    <small>Add GOOGLE_MAPS_API_KEY to your .env</small>
                </div>
            `;
            return;
        }

        const userLoc = { lat, lng };
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 13,
            center: userLoc,
            styles: [
                {
                    "featureType": "poi.medical",
                    "elementType": "geometry.fill",
                    "stylers": [{ "color": "#e0e7ff" }]
                } // Soft custom styling
            ]
        });

        // User Marker
        new google.maps.Marker({
            position: userLoc,
            map: map,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            },
            title: "You are here!"
        });
    }
    
    function addMarker(hospital) {
        if (typeof google === 'undefined') return;

        const infowindow = new google.maps.InfoWindow({
            content: `<b>${hospital.name}</b><br>${hospital.vicinity}`
        });

        const marker = new google.maps.Marker({
            position: hospital.location,
            map,
            title: hospital.name,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }
        });

        marker.addListener("click", () => {
            infowindow.open({ anchor: marker, map });
        });

        markers.push(marker);
    }

    function showError(msg) {
        errorAlert.classList.remove('d-none');
        errorAlert.querySelector('span').textContent = msg;
    }
});
