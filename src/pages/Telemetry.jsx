import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Search } from 'lucide-react'
import Loading from '../components/Loading'
import TelemetryTable from '../components/TelemetryTable'
import { subscribeToUserTelemetry } from '../services/telemetryService'

const formatDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const formatDateLabel = (value) => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function TelemetryPage({ user }) {
  const [telemetry, setTelemetry] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!user) return undefined

    const unsubscribe = subscribeToUserTelemetry(user.uid, (nextTelemetry) => {
      setTelemetry(nextTelemetry)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const uniqueDevices = useMemo(
    () => Array.from(new Set(telemetry.map((record) => record.deviceName || record.deviceModel || 'Unknown device'))),
    [telemetry],
  )

  const filteredTelemetry = useMemo(() => {
    const lowerTerm = searchTerm.trim().toLowerCase()

    return telemetry
      .filter((record) => {
        const matchesSearch =
          !lowerTerm ||
          [record.deviceName, record.deviceModel, record.networkType, record.location?.latitude, record.location?.longitude]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(lowerTerm)

        const matchesDevice = deviceFilter === 'all' || (record.deviceName || 'Unknown device') === deviceFilter

        const recordDate = new Date(record.timestamp)
        const from = dateFrom ? new Date(dateFrom) : null
        const to = dateTo ? new Date(dateTo) : null

        const matchesFrom = !from || recordDate >= from
        const matchesTo = !to || recordDate <= new Date(new Date(to).setHours(23, 59, 59, 999))

        return matchesSearch && matchesDevice && matchesFrom && matchesTo
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [telemetry, searchTerm, deviceFilter, dateFrom, dateTo])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredTelemetry.length / pageSize))
  const currentRecords = filteredTelemetry.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, deviceFilter, dateFrom, dateTo])

  return (
    <div className="page-stack">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Telemetry records</h3>
          <button type="button" className="secondary-button small">
            <Download size={14} />
            Refresh
          </button>
        </div>

        <div className="filter-toolbar">
          <label className="search-box">
            <Search size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search telemetry" />
          </label>

          <label className="field-box">
            <span>Device</span>
            <select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)}>
              <option value="all">All devices</option>
              {uniqueDevices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
          </label>

          <label className="field-box">
            <span>From</span>
            <input type="date" value={formatDateInput(dateFrom)} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="field-box">
            <span>To</span>
            <input type="date" value={formatDateInput(dateTo)} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <button type="button" className="secondary-button small" onClick={() => {
            setSearchTerm('')
            setDeviceFilter('all')
            setDateFrom('')
            setDateTo('')
          }}>
            <Filter size={14} />
            Reset
          </button>
        </div>

        {loading ? (
          <Loading message="Loading telemetry records..." />
        ) : (
          <>
            <TelemetryTable records={currentRecords} onRowClick={setSelectedRecord} emptyMessage="No telemetry data available yet." />

            {filteredTelemetry.length > 0 ? (
              <div className="pagination-row">
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredTelemetry.length)} - {Math.min(currentPage * pageSize, filteredTelemetry.length)} of {filteredTelemetry.length}
                </span>
                <div className="pagination-buttons">
                  <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}>
                    Previous
                  </button>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}>
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {selectedRecord ? (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header with-border">
              <h3>Telemetry details</h3>
              <button type="button" className="close-button" onClick={() => setSelectedRecord(null)}>
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div>
                <span>Timestamp</span>
                <strong>{formatDateLabel(selectedRecord.timestamp)}</strong>
              </div>
              <div>
                <span>Device</span>
                <strong>{selectedRecord.deviceName || selectedRecord.deviceModel || 'Unknown'}</strong>
              </div>
              <div>
                <span>Latitude</span>
                <strong>{selectedRecord.location?.latitude ?? '—'}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{selectedRecord.location?.longitude ?? '—'}</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>{selectedRecord.location?.accuracy ? `${selectedRecord.location.accuracy.toFixed(1)} m` : '—'}</strong>
              </div>
              <div>
                <span>Altitude</span>
                <strong>{selectedRecord.location?.altitude ? `${selectedRecord.location.altitude.toFixed(1)} m` : '—'}</strong>
              </div>
              <div>
                <span>Speed</span>
                <strong>{selectedRecord.location?.speed ? `${selectedRecord.location.speed.toFixed(1)} m/s` : '—'}</strong>
              </div>
              <div>
                <span>Battery</span>
                <strong>{selectedRecord.batteryLevel ?? '—'}%</strong>
              </div>
              <div>
                <span>Charging</span>
                <strong>{selectedRecord.isCharging ? 'Charging' : 'Not charging'}</strong>
              </div>
              <div>
                <span>Network</span>
                <strong>{selectedRecord.networkType || 'Unknown'}</strong>
              </div>
              <div>
                <span>Android</span>
                <strong>{selectedRecord.androidVersion || 'Unknown'}</strong>
              </div>
              <div>
                <span>App version</span>
                <strong>{selectedRecord.appVersion || 'Unknown'}</strong>
              </div>
              <div>
                <span>Gyroscope</span>
                <strong>
                  {selectedRecord.gyroscope ? `${selectedRecord.gyroscope.x.toFixed(3)}, ${selectedRecord.gyroscope.y.toFixed(3)}, ${selectedRecord.gyroscope.z.toFixed(3)}` : '—'}
                </strong>
              </div>
              <div>
                <span>Accelerometer</span>
                <strong>
                  {selectedRecord.accelerometer ? `${selectedRecord.accelerometer.x.toFixed(3)}, ${selectedRecord.accelerometer.y.toFixed(3)}, ${selectedRecord.accelerometer.z.toFixed(3)}` : '—'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
