import { useState, useEffect } from "react"
import { MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import { circleToPolygon } from "../../utils/circleToPolygon"
import { fenceService } from "../../services/fenceService"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import L from "leaflet"
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

// Fix for default marker icons in leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Component to handle map bounds updates
function MapBoundsUpdater({ shapes }) {
  const map = useMap()

  useEffect(() => {
    if (shapes && shapes.length > 0) {
      try {
        // Create a FeatureGroup from all shapes
        const featureGroup = L.geoJSON(shapes)
        // Get bounds of all shapes
        const bounds = featureGroup.getBounds()
        // Fit map to these bounds with some padding
        map.fitBounds(bounds, { padding: [50, 50] })
      } catch (error) {
        console.error("Error fitting bounds:", error)
      }
    }
  }, [shapes, map])

  return null
}

function GeoFencingSettings() {
  const [shapes, setShapes] = useState([])
  const [loading, setLoading] = useState(false)
  const [mapCenter] = useState([20, 0]) // Default center

  useEffect(() => {
    fetchFences()
  }, [])

  const fetchFences = async () => {
    try {
      setLoading(true)
      const fences = await fenceService.getFences()
      setShapes(fences)
    } catch (error) {
      console.error("Error fetching fences:", error)
      alert("Failed to fetch fences")
    } finally {
      setLoading(false)
    }
  }

  const onCreated = (e) => {
    const layer = e.layer
    let geometry

    if (e.layerType === "circle") {
      // Convert circle to polygon for better compatibility
      const center = layer.getLatLng()
      const radius = layer.getRadius()
      geometry = circleToPolygon([center.lng, center.lat], radius)
      console.log("Converted circle to polygon:", geometry)
    } else {
      // For rectangles and polygons, use the GeoJSON directly
      geometry = layer.toGeoJSON().geometry
    }

    setShapes([...shapes, geometry])
  }

  const handleSaveFences = async () => {
    try {
      setLoading(true)
      await fenceService.saveFences(shapes)
      alert("Fences saved successfully!")
    } catch (error) {
      console.error("Error saving fences:", error)
      alert("Failed to save fences")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Geo-Fencing Settings</h1>
      <div className="map-container">
        <MapContainer center={mapCenter} zoom={2} style={{ height: "500px", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={onCreated}
              draw={{
                rectangle: true,
                polygon: true,
                circle: true,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
            />
          </FeatureGroup>
          <MapBoundsUpdater shapes={shapes} />
        </MapContainer>
      </div>

      <div className="controls">
        <button onClick={handleSaveFences} disabled={loading || shapes.length === 0}>
          {loading ? "Saving..." : "Save Fences"}
        </button>
      </div>

      <style>
        {`
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          h1 {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .map-container {
            border: 2px solid #ccc;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
          }
          
          .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
          }
          
          button:hover:not(:disabled) {
            background-color: #45a049;
          }
          
          button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  )
}

export default GeoFencingSettings;