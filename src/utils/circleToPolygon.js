// Utility function to convert a circle to a polygon
export function circleToPolygon([lng, lat], radius, points = 64) {
    const coords = [];
    const km = radius / 1000; // Convert radius to kilometers

    for (let i = 0; i <= points; i++) {
        const angle = (i * 360) / points;
        const [ptLng, ptLat] = destinationPoint(lat, lng, angle, km);
        coords.push([ptLng, ptLat]);
    }

    // Close the polygon by repeating the first point
    coords.push(coords[0]);

    return {
        type: "Polygon",
        coordinates: [coords]
    };
}

// Calculate destination point given starting point, bearing and distance
function destinationPoint(lat, lng, bearing, distance) {
    const R = 6371; // Earth's radius in km
    const d = distance;
    const brng = toRad(bearing);
    const lat1 = toRad(lat);
    const lon1 = toRad(lng);

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(d / R) +
        Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
    );

    const lon2 = lon1 + Math.atan2(
        Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
        Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return [toDeg(lon2), toDeg(lat2)];
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function toDeg(rad) {
    return rad * 180 / Math.PI;
}
