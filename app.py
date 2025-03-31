from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from geopy.distance import geodesic
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# Get Google Maps API key from environment variables
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Metro station data
metro_stations = [
    # Blue Line (Line 1)
    {"name": "Nagole", "latitude": 17.39068795092478, "longitude": 78.55883896209359, "line": "blue"},
    {"name": "Uppal", "latitude": 17.400070407722552, "longitude": 78.5601216522989, "line": "blue"},
    {"name": "Stadium", "latitude": 17.40759029046007, "longitude": 78.55397616709247, "line": "blue"},
    {"name": "NGRI", "latitude": 17.414964065238657, "longitude": 78.54624289464958, "line": "blue"},
    {"name": "Habsiguda", "latitude": 17.420339414531984, "longitude": 78.54057375092457, "line": "blue"},
    {"name": "Tarnaka", "latitude": 17.42858983605978, "longitude": 78.52851478115663, "line": "blue"},
    {"name": "Mettuguda", "latitude": 17.435679980906013, "longitude": 78.5196797388279, "line": "blue"},
    {"name": "Secundrabad East", "latitude": 17.43600283692088, "longitude": 78.50544985417028, "line": "blue"},
    {"name": "Parade Ground", "latitude": 17.44324974967518, "longitude": 78.49739591437762, "line": "blue"},
    {"name": "Paradise", "latitude": 17.443603566144617, "longitude": 78.48626791915538, "line": "blue"},
    {"name": "Rasoolpura", "latitude": 17.44359192787706, "longitude": 78.47636484080024, "line": "blue"},
    {"name": "Prakash Nagar", "latitude": 17.444916962796643, "longitude": 78.465829780679, "line": "blue"},
    {"name": "Begumpet", "latitude": 17.437611137143154, "longitude": 78.4569536491108, "line": "blue"},
    {"name": "Ameerpet", "latitude": 17.435514301587926, "longitude": 78.44478136951264, "line": "blue"},
    {"name": "Madhura Nagar", "latitude": 17.436947750739346, "longitude": 78.43894792958879, "line": "blue"},
    {"name": "Yusufguda", "latitude": 17.435097572497234, "longitude": 78.42736133501066, "line": "blue"},
    {"name": "Road No.5 Jubilee Hills", "latitude": 17.430109479437586, "longitude": 78.42299856396798, "line": "blue"},
    {"name": "Jubilee Hills Check Post", "latitude": 17.428248520794064, "longitude": 78.41371452356479, "line": "blue"},
    {"name": "Peddamma Gudi", "latitude": 17.430670698052875, "longitude": 78.40843451712821, "line": "blue"},
    {"name": "Madhapur", "latitude": 17.437310676401424, "longitude": 78.40040536537478, "line": "blue"},
    {"name": "Durgam Cheruvu", "latitude": 17.4428290563089, "longitude": 78.38763385151486, "line": "blue"},
    {"name": "HITEC City", "latitude": 17.448917783260395, "longitude": 78.38318718791987, "line": "blue"},
    {"name": "Raidurg", "latitude": 17.442090385868397, "longitude": 78.37716675129303, "line": "blue"},
    
    # Red Line (Line 2)
    {"name": "LB Nagar", "latitude": 17.349897300947482, "longitude": 78.54800743758497, "line": "red"},
    {"name": "Victoria Memorial", "latitude": 17.361870565904166, "longitude": 78.54400033573586, "line": "red"},
    {"name": "Chaitanyapuri", "latitude": 17.368294657164373, "longitude": 78.5358827925827, "line": "red"},
    {"name": "Dilsukhnagar", "latitude": 17.3686062396473, "longitude": 78.5257570548721, "line": "red"},
    {"name": "Musarambagh", "latitude": 17.371128729661365, "longitude": 78.51195220577841, "line": "red"},
    {"name": "New Market", "latitude": 17.37350135470022, "longitude": 78.50291891964658, "line": "red"},
    {"name": "Malakpet", "latitude": 17.377273381507273, "longitude": 78.49382438972393, "line": "red"},
    {"name": "MG Bus Station", "latitude": 17.38001680767876, "longitude": 78.48600415292819, "line": "red"},
    {"name": "Osmania Medical College", "latitude": 17.38234220948969, "longitude": 78.48106997305018, "line": "red"},
    {"name": "Gandhi Bhavan", "latitude": 17.38607350099182, "longitude": 78.47310434223631, "line": "red"},
    {"name": "Nampally", "latitude": 17.392352778554788, "longitude": 78.47013238529837, "line": "red"},
    {"name": "Assembly", "latitude": 17.398105984131938, "longitude": 78.47079489233606, "line": "red"},
    {"name": "Lakdikapul", "latitude": 17.403954427929204, "longitude": 78.46500705357197, "line": "red"},
    {"name": "Khairatabad", "latitude": 17.41158922299778, "longitude": 78.46081661674165, "line": "red"},
    {"name": "Irrum Manzil", "latitude": 17.420558129718646, "longitude": 78.45609323048315, "line": "red"},
    {"name": "Panjagutta", "latitude": 17.42860965836644, "longitude": 78.45116098164843, "line": "red"},
    {"name": "Ameerpet", "latitude": 17.435685132056765, "longitude": 78.44459228741924, "line": "red"},
    {"name": "SR Nagar", "latitude": 17.441662246559467, "longitude": 78.44163439525691, "line": "red"},
    {"name": "ESI Hospital", "latitude": 17.447371305879738, "longitude": 78.43836170041652, "line": "red"},
    {"name": "Erragadda", "latitude": 17.457206097906393, "longitude": 78.43352063977251, "line": "red"},
    {"name": "Bharat Nagar", "latitude": 17.46404267085038, "longitude": 78.43004556475395, "line": "red"},
    {"name": "Moosapet", "latitude": 17.47209995866928, "longitude": 78.42595420959714, "line": "red"},
    {"name": "Balanagar", "latitude": 17.47673593584185, "longitude": 78.42206289575306, "line": "red"},
    {"name": "Kukatpally", "latitude": 17.48511396755922, "longitude": 78.41155837625712, "line": "red"},
    {"name": "KPHB Colony", "latitude": 17.4937968369124, "longitude": 78.40167359188378, "line": "red"},
    {"name": "JNTU College", "latitude": 17.498664301035877, "longitude": 78.38880761749478, "line": "red"},
    {"name": "Miyapur", "latitude": 17.49645718843428, "longitude": 78.37293976667172, "line": "red"},
    
    # Green Line (Line 3)
    {"name": "MG Bus Station", "latitude": 17.38001680767876, "longitude": 78.48600415292819, "line": "green"},
    {"name": "Sultan Bazar", "latitude": 17.384140517733577, "longitude": 78.48369734347902, "line": "green"},
    {"name": "Narayanguda", "latitude": 17.395337442062274, "longitude": 78.49044585270167, "line": "green"},
    {"name": "Chikkadpally", "latitude": 17.40021620027355, "longitude": 78.49481866551699, "line": "green"},
    {"name": "RTC X Roads", "latitude": 17.407655197056467, "longitude": 78.49704577943027, "line": "green"},
    {"name": "Musheerabad", "latitude": 17.4179298417639, "longitude": 78.49939559194198, "line": "green"},
    {"name": "Gandhi Hospital", "latitude": 17.425652001346652, "longitude": 78.50187048304099, "line": "green"},
    {"name": "Secundrabad West", "latitude": 17.433709353898685, "longitude": 78.49919668174995, "line": "green"},
    {"name": "JBS Parade Grounds", "latitude": 17.444476533119396, "longitude": 78.49746722062802, "line": "green"},
    {"name": "Parade Ground", "latitude": 17.44324974967518, "longitude": 78.49739591437762, "line": "green"},
]

# Function to find the closest metro station
def find_closest_station(location, stations):
    closest_station = None
    min_distance = float('inf')

    for station in stations:
        station_coords = (station["latitude"], station["longitude"])
        distance = geodesic(location, station_coords).kilometers
        if distance < min_distance:
            min_distance = distance
            closest_station = station

    return closest_station, min_distance

@app.route('/')
def index():
    # Pass the Google Maps API key to the template
    return render_template('index.html', api_key='AIzaSyDtE4YMzNOC4VBBkEHx7M8nU0fe7ShjSxs')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

@app.route('/api/find-nearest', methods=['POST'])
def find_nearest():
    data = request.json
    lat = data.get('latitude')
    lng = data.get('longitude')
    
    if lat is None or lng is None:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    location = (float(lat), float(lng))
    closest_station, distance = find_closest_station(location, metro_stations)
    
    return jsonify({
        "station": closest_station,
        "distance": round(distance, 2)
    })

@app.route('/api/stations', methods=['GET'])
def get_stations():
    return jsonify(metro_stations)

if __name__ == '__main__':
    app.run(debug=True)
