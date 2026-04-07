export default function RiskSignals({ news, onSelect }: any) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">
        Live Risk Signals
      </h2>

      {news.map((n: any, i: number) => (
        <div
          key={i}
          onClick={() => onSelect(n)}
          className="p-3 border mb-3 rounded cursor-pointer hover:bg-white/10 transition"
        >
          <div className="font-semibold text-sm">{n.title}</div>

          <div className="text-xs text-gray-400 mt-1">
            {n.source}
          </div>

          <div className="text-xs mt-1">
            {n.category}
          </div>

          <div className={`text-xs mt-1 font-bold ${
            n.severity === "High"
              ? "text-red-500"
              : n.severity === "Medium"
              ? "text-yellow-400"
              : "text-green-400"
          }`}>
            {n.severity}
          </div>
        </div>
      ))}
    </div>
  )
}