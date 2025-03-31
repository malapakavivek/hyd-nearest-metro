// Global variables
let allStations = [];
let autocomplete;
let selectedPlace = null;

// Line colors
const lineColors = {
    'blue': '#4285f4',
    'red': '#ea4335',
    'green': '#34a853'
};

// DOM elements
let searchInput;
let searchButton;
let resultContainer;
let stationNameElement;
let stationDistanceElement;
let loadingSpinner;
let metroTrain;

// Store markers and map objects
let map;
let stationMarkers = [];
let userMarker = null;
let nearestStationMarker = null;
let highlightedMarkers = [];

// Initialize Google Maps - this function is called by the Google Maps API
function initMap() {
    // Center on Hyderabad
    const hyderabad = { lat: 17.4344, lng: 78.4354 };

    // Map style with better contrast
    const cleanMapStyle = [
        {
            "elementType": "geometry",
            "stylers": [
                { "color": "#f0f0f0" }
            ]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [
                { "color": "#333333" }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "poi",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "road",
            "stylers": [
                { "visibility": "on" },
                { "color": "#c0c0c0" }
            ]
        },
        {
            "featureType": "road.highway",
            "stylers": [
                { "color": "#a0a0a0" }
            ]
        },
        {
            "featureType": "road.arterial",
            "stylers": [
                { "color": "#b0b0b0" }
            ]
        },
        {
            "featureType": "road.local",
            "stylers": [
                { "color": "#c8c8c8" }
            ]
        },
        {
            "featureType": "transit",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                { "color": "#d4e8ff" }
            ]
        }
    ];

    // Create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: hyderabad,
        zoom: 13,
        styles: cleanMapStyle,
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true
    });

    // Initialize autocomplete
    initAutocomplete();

    // Fetch and display all metro stations
    fetchStations();
}

// Initialize Google Places Autocomplete
function initAutocomplete() {
    // Create the autocomplete object
    autocomplete = new google.maps.places.Autocomplete(searchInput, {
        types: ['establishment', 'geocode'], // Include establishments like cafes, restaurants, etc.
        componentRestrictions: { country: 'in' },
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(17.2, 78.2), // SW bounds of Hyderabad
            new google.maps.LatLng(17.6, 78.6)  // NE bounds of Hyderabad
        ),
        strictBounds: false,
        fields: ['geometry', 'name', 'place_id'] // Request only the data we need
    });

    // Set the autocomplete bias towards Hyderabad
    autocomplete.setBounds(new google.maps.LatLngBounds(
        new google.maps.LatLng(17.2, 78.2), // SW bounds of Hyderabad
        new google.maps.LatLng(17.6, 78.6)  // NE bounds of Hyderabad
    ));

    // Add listener for place changed
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed
            handleSearchButtonClick();
            return;
        }

        // If the place has a geometry, use it to find nearest station
        const location = place.geometry.location;
        findNearestStation(location.lat(), location.lng());
    });
}

// Fetch stations from API
function fetchStations() {
    fetch('/api/stations')
        .then(response => response.json())
        .then(stations => {
            processStations(stations);
        })
        .catch(error => console.error('Error fetching stations:', error));
}

// Process stations data
function processStations(stations) {
    // Store stations globally
    allStations = stations;

    // Add markers for each station
    stations.forEach(station => {
        addStationMarker(station);
    });
}

// Add a marker for a station
function addStationMarker(station) {
    const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: map,
        title: station.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: lineColors[station.line] || '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        }
    });
    
    // Add click listener to marker
    marker.addListener('click', function() {
        // Show info about the station
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h3>${station.name}</h3>
                    <p>Line: ${station.line.charAt(0).toUpperCase() + station.line.slice(1)} Line</p>
                </div>
            `
        });
        infoWindow.open(map, marker);
    });
    
    // Add to markers array
    stationMarkers.push(marker);
}

// Function to find nearest metro station
function findNearestStation(lat, lng) {
    showLoading();
    
    fetch('/api/find-nearest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            latitude: lat,
            longitude: lng
        }),
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        displayResult(data, lat, lng);
    })
    .catch((error) => {
        console.error('Error:', error);
        hideLoading();
    });
}

// Function to display the result
function displayResult(data, userLat, userLng) {
    const station = data.station;
    const distance = data.distance;
    
    // Clear any existing highlighted markers
    clearHighlightedMarkers();
    
    // Add user marker
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    userMarker = new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map: map,
        title: 'Your Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        },
        zIndex: 2
    });
    
    // Highlight the nearest station
    const stationMarker = stationMarkers.find(marker => 
        marker.getTitle() === station.name
    );
    
    if (stationMarker) {
        // Update the marker to be highlighted
        stationMarker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: lineColors[station.line] || '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
        });
        stationMarker.setZIndex(3);
        
        // Add to highlighted markers array
        highlightedMarkers.push(stationMarker);
    }
    
    // Draw a line between user and station
    const line = new google.maps.Polyline({
        path: [
            { lat: userLat, lng: userLng },
            { lat: station.latitude, lng: station.longitude }
        ],
        geodesic: true,
        strokeColor: lineColors[station.line] || '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });
    
    // Add to highlighted markers array to clear later
    highlightedMarkers.push(line);
    
    // Fit the map to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLat, lng: userLng });
    bounds.extend({ lat: station.latitude, lng: station.longitude });
    map.fitBounds(bounds);
    
    // Display the result
    displayClosestStation(station, distance);
}

// Search button click handler
function handleSearchButtonClick() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Show loading spinner
    showLoading();
    
    // Animate the train
    animateMetroTrain();

    // Use Google Maps Geocoding API with broader search parameters
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 
        address: query,
        region: 'in',
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(17.2, 78.2), // SW bounds of Hyderabad
            new google.maps.LatLng(17.6, 78.6)  // NE bounds of Hyderabad
        )
    }, function(results, status) {
        if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            findNearestStation(location.lat(), location.lng());
        } else {
            // Try with Places API as a fallback
            searchWithPlacesAPI(query);
        }
    });
}

// Fallback search using Places API
function searchWithPlacesAPI(query) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    service.textSearch({
        query: query + ' Hyderabad',
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(17.2, 78.2), // SW bounds of Hyderabad
            new google.maps.LatLng(17.6, 78.6)  // NE bounds of Hyderabad
        ),
        type: ['establishment', 'point_of_interest', 'restaurant', 'cafe', 'store']
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const location = results[0].geometry.location;
            findNearestStation(location.lat(), location.lng());
        } else {
            // Hide loading spinner on error
            hideLoading();
            alert('Location not found. Please try a different search term.');
        }
    });
}

// Search input enter key handler
function handleSearchInputKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchButtonClick();
    }
}

// Helper functions for loading state
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Function to display the closest station
function displayClosestStation(station, distance) {
    const resultContainer = document.getElementById('result-container');
    const stationNameElement = document.getElementById('station-name');
    const stationDistanceElement = document.getElementById('station-distance');
    const stationInfoElement = document.querySelector('.station-info p');
    const resultCard = document.querySelector('.result-card');
    
    // Remove any existing line classes
    resultCard.classList.remove('blue-line', 'red-line', 'green-line');
    
    // Add the appropriate line class
    const line = station.line.toLowerCase();
    if (line.includes('blue')) {
        resultCard.classList.add('blue-line');
        stationInfoElement.innerHTML = `Line: <span class="blue-line">Blue Line</span>`;
    } else if (line.includes('red')) {
        resultCard.classList.add('red-line');
        stationInfoElement.innerHTML = `Line: <span class="red-line">Red Line</span>`;
    } else if (line.includes('green')) {
        resultCard.classList.add('green-line');
        stationInfoElement.innerHTML = `Line: <span class="green-line">Green Line</span>`;
    }
    
    stationNameElement.textContent = station.name;
    stationDistanceElement.textContent = `${distance.toFixed(2)} km away`;
    
    resultContainer.style.display = 'block';
    
    // Scroll to the result container
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Clear highlighted markers
function clearHighlightedMarkers() {
    highlightedMarkers.forEach(marker => {
        if (marker instanceof google.maps.Marker) {
            // Reset marker icon if it's a station marker
            const stationData = allStations.find(station => station.name === marker.getTitle());
            if (stationData) {
                marker.setIcon({
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: lineColors[stationData.line] || '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                });
                marker.setZIndex(1);
            } else {
                // If it's not a station marker (e.g., user marker), remove it
                marker.setMap(null);
            }
        } else {
            // If it's a polyline or other object, remove it
            marker.setMap(null);
        }
    });
    
    // Clear the array
    highlightedMarkers = [];
}

// Metro train animation
function animateMetroTrain() {
    if (metroTrain) {
        metroTrain.classList.remove('active');
        void metroTrain.offsetWidth; // Trigger reflow to restart animation
        metroTrain.classList.add('active');
        setTimeout(() => {
            metroTrain.classList.remove('active');
        }, 2000); // Match the animation duration in CSS (2s)
    } else {
        console.error("Metro train element not found");
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    searchInput = document.getElementById('search-input');
    searchButton = document.getElementById('search-button');
    resultContainer = document.getElementById('result-container');
    stationNameElement = document.getElementById('station-name');
    stationDistanceElement = document.getElementById('station-distance');
    loadingSpinner = document.getElementById('loading-spinner');
    metroTrain = document.getElementById('metro-train');
    
    // Add event listeners
    if (searchButton) {
        searchButton.addEventListener('click', handleSearchButtonClick);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchInputKeypress);
    }
    
    // Start train animation periodically
    setInterval(animateMetroTrain, 10000);
    
    // Initial train animation
    setTimeout(animateMetroTrain, 1000);
});

// Initialize map when Google Maps API is loaded
window.initMap = initMap;
