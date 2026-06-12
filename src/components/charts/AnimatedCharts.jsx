import React, { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buildChartDataset, resolveChartTypes } from '../../utils/charts'

const palette = ['#ff7a59', '#ffb347', '#ff5f6d', '#7c4dff', '#8ac926', '#ffd166']

function ChartCard({ title, children }) {
  return (
    <article className="chart-card shell-card chart-card-clipped">
      <div className="chart-head"><strong>{title}</strong></div>
      <div className="chart-canvas adaptive-chart safe-chart-frame">{children}</div>
    </article>
  )
}

function AnimatedCharts({ rows = [], columns = [], requestedType = 'auto', chartMeta = [] }) {
  const trimmedRows = Array.isArray(rows) ? rows.slice(0, 24) : []
  const { data, numericColumns, pieData, scatterData } = useMemo(() => buildChartDataset(trimmedRows, columns), [trimmedRows, columns])
  const chartTypes = useMemo(() => resolveChartTypes(requestedType, chartMeta, numericColumns), [requestedType, chartMeta, numericColumns])

  if (!data.length || data.length <= 1 || !numericColumns.length || !chartTypes.length) {
    return null
  }

  const firstMetric = numericColumns[0]
  const secondMetric = numericColumns[1] || numericColumns[0]
  const formatMetricLabel = (metric) => (metric === '__count' ? 'Count' : metric)
  const tooltipFormatter = (value, name) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    const pretty = Number.isFinite(numericValue) ? numericValue.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value
    return [pretty, formatMetricLabel(name)]
  }
  const legendFormatter = (value) => formatMetricLabel(value)

  return (
    <div className="chart-grid-responsive chart-grid-safe">
      {chartTypes.includes('bar') && (
        <ChartCard title="Bar Chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b2d22" opacity={0.18} />
              <XAxis dataKey="label" tick={{ fill: '#f7d6c6', fontSize: 10 }} hide={data.length > 12} />
              <YAxis width={48} tick={{ fill: '#f7d6c6', fontSize: 10 }} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend formatter={legendFormatter} />
              <Bar dataKey={firstMetric} fill="#ff7a59" radius={[10, 10, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {chartTypes.includes('line') && (
        <ChartCard title="Line Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b2d22" opacity={0.18} />
              <XAxis dataKey="label" tick={{ fill: '#f7d6c6', fontSize: 10 }} hide={data.length > 12} />
              <YAxis width={48} tick={{ fill: '#f7d6c6', fontSize: 10 }} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend formatter={legendFormatter} />
              <Line type="monotone" dataKey={firstMetric} stroke="#ffb347" strokeWidth={3} dot={false} />
              {numericColumns[1] ? <Line type="monotone" dataKey={secondMetric} stroke="#7c4dff" strokeWidth={2} dot={false} /> : null}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {chartTypes.includes('area') && (
        <ChartCard title="Area Chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="sunriseArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5f6d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ffb347" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b2d22" opacity={0.18} />
              <XAxis dataKey="label" tick={{ fill: '#f7d6c6', fontSize: 10 }} hide={data.length > 12} />
              <YAxis width={48} tick={{ fill: '#f7d6c6', fontSize: 10 }} />
              <Tooltip formatter={tooltipFormatter} />
              <Area type="monotone" dataKey={firstMetric} stroke="#ff5f6d" fill="url(#sunriseArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {chartTypes.includes('scatter') && scatterData.length > 0 && (
        <ChartCard title="Scatter Chart">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b2d22" opacity={0.18} />
              <XAxis type="number" dataKey="x" name={firstMetric} tick={{ fill: '#f7d6c6', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name={secondMetric} width={48} tick={{ fill: '#f7d6c6', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={tooltipFormatter} />
              <Scatter data={scatterData.slice(0, 40)} fill="#8ac926" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {chartTypes.includes('pie') && pieData.length > 0 && (
        <ChartCard title="Pie Chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Pie data={pieData.slice(0, 8)} dataKey="value" nameKey="name" outerRadius={78}>
                {pieData.slice(0, 8).map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

export default AnimatedCharts
