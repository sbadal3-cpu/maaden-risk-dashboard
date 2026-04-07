export function calculateImpact(signal: any) {
  const text = signal.title.toLowerCase()

  // BASE ASSUMPTIONS (you can refine later)
  let baseImpact = 0

  if (text.includes("steel")) baseImpact = -2.5
  else if (text.includes("phosphate")) baseImpact = -1.8
  else if (text.includes("energy")) baseImpact = -1.2
  else if (text.includes("logistics")) baseImpact = -1.5
  else baseImpact = -0.8

  return {
    base: baseImpact,
    moderate: baseImpact * 1.5,
    severe: baseImpact * 2.2,
  }
}