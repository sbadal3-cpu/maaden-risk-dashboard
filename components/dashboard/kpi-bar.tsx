export default function KPIBar({ news }: any) {
  const total = news.length
  const high = news.filter((n: any) => n.severity === "High").length
  const medium = news.filter((n: any) => n.severity === "Medium").length

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="p-4 bg-gray-100 rounded">
        <div className="text-sm">Total Signals</div>
        <div className="text-xl font-bold">{total}</div>
      </div>

      <div className="p-4 bg-red-100 rounded">
        <div className="text-sm">High Risk</div>
        <div className="text-xl font-bold text-red-600">{high}</div>
      </div>

      <div className="p-4 bg-orange-100 rounded">
        <div className="text-sm">Medium Risk</div>
        <div className="text-xl font-bold text-orange-600">{medium}</div>
      </div>
    </div>
  )
}