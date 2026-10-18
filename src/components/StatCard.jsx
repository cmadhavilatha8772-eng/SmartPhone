export default function StatCard({ icon: Icon, title, value, subtitle, tone = 'default' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        {/* Accept an icon component so every metric can reuse this card layout. */}
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <strong>{value}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
    </div>
  )
}
