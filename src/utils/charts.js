
const isFiniteNumber = (value) => Number.isFinite(value)

export const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const accountingMatch = trimmed.match(/^\((.*)\)$/)
  const accountingNormalized = accountingMatch ? `-${accountingMatch[1]}` : trimmed
  const normalized = accountingNormalized
    .replace(/\s/g, '')
    .replaceAll(',', '')
    .replace(/[₹$€£¥]/g, '')

  const isPercent = normalized.endsWith('%')
  const numericPart = isPercent ? normalized.slice(0, -1) : normalized
  const parsed = Number(numericPart)
  return Number.isFinite(parsed) ? parsed : null
}

const numericColumnCandidates = (rows, columns) =>
  columns.filter((col) => rows.some((row) => isFiniteNumber(toNumber(row?.[col]))))

export const buildChartDataset = (rows = [], columns = []) => {
  if (!Array.isArray(rows) || !Array.isArray(columns) || !rows.length || !columns.length) {
    return { data: [], labelKey: null, numericColumns: [], pieData: [], scatterData: [] }
  }

  const numericColumns = numericColumnCandidates(rows, columns)
  const labelKey = columns.find((col) => !numericColumns.includes(col)) || columns[0]

  // If there are no numeric fields, build a frequency view so interactive charts still work.
  if (!numericColumns.length) {
    const countField = '__count'
    const buckets = new Map()

    rows.slice(0, 500).forEach((row, idx) => {
      const label = String(row?.[labelKey] ?? `Row ${idx + 1}`)
      buckets.set(label, (buckets.get(label) || 0) + 1)
    })

    const data = Array.from(buckets.entries())
      .slice(0, 24)
      .map(([label, count]) => ({ label, [countField]: count }))

    const pieData = data
      .slice(0, 10)
      .map((item) => ({ name: item.label, value: item[countField] }))

    return {
      data,
      labelKey,
      numericColumns: [countField],
      pieData,
      scatterData: [],
    }
  }

  const data = rows.slice(0, 24).map((row, idx) => {
    const next = { label: String(row?.[labelKey] ?? `Row ${idx + 1}`) }
    numericColumns.forEach((col) => {
      next[col] = toNumber(row?.[col])
    })
    return next
  })

  const firstNumeric = numericColumns[0]
  const secondNumeric = numericColumns[1]

  const pieData = firstNumeric
    ? data.filter((item) => isFiniteNumber(item[firstNumeric])).slice(0, 10).map((item) => ({ name: item.label, value: item[firstNumeric] }))
    : []

  const scatterData = firstNumeric && secondNumeric
    ? data.filter((item) => isFiniteNumber(item[firstNumeric]) && isFiniteNumber(item[secondNumeric])).map((item) => ({ x: item[firstNumeric], y: item[secondNumeric], name: item.label }))
    : []

  return { data, labelKey, numericColumns, pieData, scatterData }
}

export const resolveChartTypes = (requestedType, chartMeta = [], numericColumns = []) => {
  const supported = ['bar', 'line', 'pie', 'scatter', 'area']
  const normalizedRequested = String(requestedType || '').toLowerCase()

  if (requestedType === 'all') return ['bar', 'line', 'area', 'pie', 'scatter']
  if (normalizedRequested && normalizedRequested !== 'auto') {
    if (supported.includes(normalizedRequested)) return [normalizedRequested]
    // Gracefully map legacy/non-interactive chart requests to interactive equivalents.
    if (['hist', 'box', 'violin', 'heatmap'].includes(normalizedRequested)) {
      return numericColumns.length ? ['bar', 'line'] : []
    }
  }

  if (Array.isArray(chartMeta) && chartMeta.length) {
    const fromMeta = chartMeta
      .map((item) => String(item?.type || '').toLowerCase())
      .filter((type) => supported.includes(type))
    if (fromMeta.length) return [...new Set(fromMeta)]
  }

  if (numericColumns.length >= 3) return ['bar', 'line', 'area', 'scatter', 'pie']
  if (numericColumns.length === 2) return ['bar', 'line', 'scatter', 'pie']
  if (numericColumns.length === 1) return ['bar', 'line', 'pie']
  return []
}
