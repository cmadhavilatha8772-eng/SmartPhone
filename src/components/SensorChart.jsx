import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function SensorChart({ data = [] }) {
  return (
    <div className="chart-panel">
      <div className="panel-header">
        <h3>Sensor activity</h3>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {/* Plot the three gyroscope axes against the same telemetry time labels. */}
            <Line type="monotone" dataKey="gx" stroke="#38bdf8" name="Gyro X" strokeWidth={2} />
            <Line type="monotone" dataKey="gy" stroke="#8b5cf6" name="Gyro Y" strokeWidth={2} />
            <Line type="monotone" dataKey="gz" stroke="#10b981" name="Gyro Z" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
