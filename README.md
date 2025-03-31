# Hyderabad Metro Finder

A responsive web application to find the nearest metro station to a given location in Hyderabad. Includes all stations on the Blue, Red, and Green Lines with an interactive retro-styled interface.

## Features

- Find the nearest metro station to any location in Hyderabad
- Search for any place in Hyderabad (including cafes, restaurants, and other establishments)
- Interactive map with color-coded metro stations
- Animated pixel-art train for a unique user experience
- Responsive design that works on mobile and desktop
- Distance calculation between your location and the nearest station
- Color-coded station information based on metro lines

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Maps**: Google Maps API with Places library
- **Geocoding**: Google Geocoding API
- **Distance Calculation**: Haversine formula

## How to Run

1. Clone the repository
   ```
   git clone https://github.com/yourusername/hyderabad-metro-finder.git
   cd hyderabad-metro-finder
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   flask run
   ```
4. Open your browser and navigate to `http://localhost:5000`

## Environment Variables

For production deployment, make sure to set these environment variables:
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

## Project Structure

```
nearest-metro/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── static/                # Static files
│   ├── app.js             # JavaScript for map and search functionality
│   ├── styles.css         # CSS styles
│   └── images/            # Images including the pixel train
└── templates/             # HTML templates
    └── index.html         # Main page template
```

## Future Enhancements

- Add more details about each station (operating hours, facilities)
- Implement route planning between stations
- Add estimated travel times
- Integrate real-time train arrival information

## License

MIT
