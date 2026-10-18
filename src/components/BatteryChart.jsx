import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function BatteryChart({ data = [] }) {
  return (
    <div className="chart-panel">
      <div className="panel-header">
        <h3>Battery history</h3>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="batteryGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#4f9cff" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#4f9cff" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            {/* Battery is a percentage, so keep the scale comparable across time ranges. */}
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Battery']} />
            <Area type="monotone" dataKey="battery" stroke="#4f9cff" fill="url(#batteryGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
