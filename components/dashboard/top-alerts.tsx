export default function TopAlerts({ news, onSelect }: any) {
  const top = [...news].slice(0, 5)

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">
        Top Risk Alerts
      </h2>

      {top.map((n: any, i: number) => (
        <div
          key={i}
          onClick={() => onSelect(n)}
          className="p-3 border mb-3 rounded cursor-pointer hover:bg-white/10 transition"
        >
          <div className="text-sm font-semibold">{n.title}</div>

          <div className="text-xs text-gray-400 mt-1">
            {n.category} | {n.source}
          </div>

          <div className="text-xs mt-1 text-red-500 font-bold">
            {n.severity}
          </div>
        </div>
      ))}
    </div>
  )
}