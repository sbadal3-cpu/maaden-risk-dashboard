export function RiskHeatmap({ onSelectRisk }: any) {

  const risks = [
    { name: "Commodity Price Shock", impact: 5, likelihood: 4 },
    { name: "Supply Chain Disruption", impact: 4, likelihood: 4 },
    { name: "Regulatory Change", impact: 3, likelihood: 3 },
    { name: "Energy Cost Spike", impact: 4, likelihood: 3 },
    { name: "Labor Shortage", impact: 2, likelihood: 4 },
    { name: "FX Volatility", impact: 3, likelihood: 2 },
  ]

  const getColor = (impact: number, likelihood: number) => {
    const score = impact * likelihood

    if (score >= 20) return "bg-red-600/30"
    if (score >= 12) return "bg-orange-500/30"
    if (score >= 6) return "bg-yellow-500/30"
    return "bg-green-500/20"
  }

  return (
    <div className="flex flex-col h-full">

      {/* TOP LABEL */}
      <div className="text-xs text-gray-400 mb-2 text-center">
        IMPACT →
      </div>

      <div className="flex flex-1">

        {/* LEFT LABEL */}
        <div className="flex flex-col justify-between text-xs text-gray-400 mr-2">
          <span>5</span>
          <span>4</span>
          <span>3</span>
          <span>2</span>
          <span>1</span>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-5 grid-rows-5 gap-2 flex-1">

          {Array.from({ length: 25 }).map((_, i) => {
            const row = 5 - Math.floor(i / 5)
            const col = (i % 5) + 1

            const cellRisks = risks.filter(
              (r) => r.impact === col && r.likelihood === row
            )

            return (
              <div
                key={i}
                className={`rounded border border-white/10 relative ${getColor(col, row)}`}
              >

                {/* DOTS */}
                <div className="absolute inset-0 flex flex-wrap p-1 gap-1">
                  {cellRisks.map((r, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectRisk(r)}
                      className="w-2 h-2 bg-white rounded-full cursor-pointer hover:scale-125"
                      title={r.name}
                    />
                  ))}
                </div>

              </div>
            )
          })}

        </div>

      </div>

      {/* BOTTOM LABEL */}
      <div className="text-xs text-gray-400 mt-2 flex justify-between px-6">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
        <span>Severe</span>
        <span>Critical</span>
      </div>

    </div>
  )
}