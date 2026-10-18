import { useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

const createMarkerIcon = () =>
  L.divIcon({
    className: 'custom-map-pin',
    html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#4f9cff;border:3px solid white;box-shadow:0 0 0 4px rgba(79,156,255,0.18);"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

const formatDate = (value) => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function LocationMap({ telemetry = [], showHistory = false, title = 'Latest location' }) {
  const validTelemetry = useMemo(
    () =>
      telemetry
        .filter((record) => record.location && Number.isFinite(record.location.latitude) && Number.isFinite(record.location.longitude))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [telemetry],
  )

  const latest = validTelemetry[0] || null
  const center = latest
    ? [latest.location.latitude, latest.location.longitude]
    : [17.385, 78.4867]

  const path = validTelemetry
    .slice(0, 50)
    // Points are sorted newest-first for the marker; reverse this slice to draw travel chronologically.
    .reverse()
    .map((record) => [record.location.latitude, record.location.longitude])

  return (
    <div className="map-panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>

      {latest ? (
        <MapContainer center={center} zoom={12} scrollWheelZoom className="leaflet-map">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHistory && path.length > 1 ? <Polyline positions={path} pathOptions={{ color: '#4f9cff', weight: 4, opacity: 0.8 }} /> : null}

          <Marker position={[latest.location.latitude, latest.location.longitude]} icon={createMarkerIcon()}>
            <Popup>
              <div className="map-popup">
                <strong>Device: {latest.deviceName || 'My Android Phone'}</strong>
                <p>Last Update: {formatDate(latest.timestamp)}</p>
                <p>Latitude: {latest.location.latitude.toFixed(4)}</p>
                <p>Longitude: {latest.location.longitude.toFixed(4)}</p>
                <p>Accuracy: {Number.isFinite(latest.location.accuracy) ? `${latest.location.accuracy.toFixed(1)} m` : 'N/A'}</p>
                <p>Battery: {latest.batteryLevel ?? 0}%</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="empty-state compact">No location data available yet.</div>
      )}
    </div>
  )
}
