import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, Cell,
} from 'recharts'
 
const TABS = ['Histogram', 'Correlation', 'Scatter', 'Missing Values', 'Box Plot']
const ACCENT = '#6c63ff'
 
export default function Visualise() {
  const [viz, setViz]         = useState(null)
  const [ds, setDs]           = useState(null)
  const [tab, setTab]         = useState(0)
  const [col, setCol]         = useState('')
  const [scatterX, setScatterX] = useState('')
  const [scatterY, setScatterY] = useState('')
  const navigate              = useNavigate()
 
  useEffect(() => {
    const v = sessionStorage.getItem('vizData')
    const d = sessionStorage.getItem('dataset')
    if (!v || !d) { navigate('/'); return }
    const vizData = JSON.parse(v)
    setViz(vizData)
    setDs(JSON.parse(d))
    if (vizData.numeric_columns.length > 0) {
      setCol(vizData.numeric_columns[0])
      setScatterX(vizData.numeric_columns[0])
      setScatterY(vizData.numeric_columns[Math.min(1, vizData.numeric_columns.length - 1)])
    }
  }, [navigate])
 
  if (!viz) return null
 
  const modelType = sessionStorage.getItem('modelType') || 'classification'
 
  // ── HISTOGRAM ──
  function HistogramChart() {
    if (!col || !viz.histograms[col]) return null
    const h = viz.histograms[col]
    const data = h.bins.map((b, i) => ({ bin: b.toFixed(2), count: h.counts[i] }))
    return (
      <div>
        <ColSelect value={col} onChange={setCol} cols={viz.numeric_columns} label='Column' />
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <XAxis dataKey='bin' tick={{ fill: '#666', fontSize: 11 }} angle={-45} textAnchor='end' interval={2} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#13131a', border: '1px solid #333', borderRadius: 8, color: '#f0f0f0' }} />
            <Bar dataKey='count' fill={ACCENT} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <ChartNote text={`Distribution of values in the ${col} column. Taller bars = more rows with that value range.`} />
      </div>
    )
  }
 
  // ── CORRELATION HEATMAP ──
  function CorrelationChart() {
    const { columns, matrix } = viz.correlation
    if (!columns || columns.length === 0) return <NoData msg='No numeric columns for correlation.' />
    function getColor(v) {
      if (v > 0.7)  return '#6c63ff'
      if (v > 0.3)  return '#a09af0'
      if (v > 0)    return '#d4d2f8'
      if (v > -0.3) return '#f8d2d2'
      if (v > -0.7) return '#f09595'
      return '#e24b4a'
    }
    const size = Math.max(40, Math.min(80, Math.floor(560 / columns.length)))
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block', minWidth: '100%' }}>
          <div style={{ display: 'flex', marginLeft: size }}>
            {columns.map(c => (
              <div key={c} style={{ width: size, fontSize: 10, color: '#888', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                {c}
              </div>
            ))}
          </div>
          {matrix.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: size, fontSize: 10, color: '#888', textAlign: 'right',
                paddingRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {columns[ri]}
              </div>
              {row.map((val, ci) => (
                <div key={ci} title={`${columns[ri]} vs ${columns[ci]}: ${val}`}
                  style={{ width: size, height: size, background: getColor(val),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: Math.abs(val) > 0.5 ? '#fff' : '#333',
                    margin: 1, borderRadius: 3, cursor: 'default' }}>
                  {val.toFixed(1)}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#777', flexWrap: 'wrap' }}>
          {[['#6c63ff','Strong positive (>0.7)'],['#a09af0','Moderate positive'],['#f09595','Moderate negative'],['#e24b4a','Strong negative (<-0.7)']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
              <span>{l}</span>
            </div>
          ))}
        </div>
        <ChartNote text='Purple = features that move together. Red = features that move opposite. Use this to drop highly correlated features before training.' />
      </div>
    )
  }
 
  // ── SCATTER PLOT ──
  function ScatterPlot() {
    if (viz.numeric_columns.length < 2) return <NoData msg='Need at least 2 numeric columns for scatter plot.' />
    const data = viz.scatter_data.map(row => ({ x: row[scatterX], y: row[scatterY] }))
    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <ColSelect value={scatterX} onChange={setScatterX} cols={viz.numeric_columns} label='X axis' />
          <ColSelect value={scatterY} onChange={setScatterY} cols={viz.numeric_columns} label='Y axis' />
        </div>
        <ResponsiveContainer width='100%' height={300}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
            <XAxis dataKey='x' name={scatterX} tick={{ fill: '#666', fontSize: 11 }} label={{ value: scatterX, position: 'insideBottom', offset: -5, fill: '#555', fontSize: 11 }} />
            <YAxis dataKey='y' name={scatterY} tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#13131a', border: '1px solid #333', borderRadius: 8, color: '#f0f0f0' }} />
            <Scatter data={data} fill={ACCENT} opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
        <ChartNote text='Each dot is one row in your dataset. Look for patterns — a diagonal cluster means these two features are correlated.' />
      </div>
    )
  }
 
  // ── MISSING VALUES ──
  function MissingChart() {
    const data = viz.missing.filter(d => d.missing > 0)
    if (data.length === 0) return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#10b981', fontSize: 15 }}>
        No missing values in this dataset.
      </div>
    )
    return (
      <div>
        <ResponsiveContainer width='100%' height={Math.max(200, data.length * 44)}>
          <BarChart data={data} layout='vertical' margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
            <XAxis type='number' domain={[0, 100]} tick={{ fill: '#666', fontSize: 11 }} tickFormatter={v => v + '%'} />
            <YAxis type='category' dataKey='column' tick={{ fill: '#aaa', fontSize: 11 }} width={120} />
            <Tooltip formatter={(v, n, p) => [p.payload.missing + ' rows (' + v + '%)', 'Missing']}
              contentStyle={{ background: '#13131a', border: '1px solid #333', borderRadius: 8, color: '#f0f0f0' }} />
            <Bar dataKey='pct' radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.pct > 30 ? '#e24b4a' : d.pct > 10 ? '#f59e0b' : '#6c63ff'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartNote text='Red bars = more than 30% missing — consider dropping that column. Yellow = 10-30% — consider imputing. Purple = less than 10% — usually fine.' />
      </div>
    )
  }
 
  // ── BOX PLOT ──
  function BoxPlotChart() {
    if (!col || !viz.boxplots[col]) return null
    const b = viz.boxplots[col]
    const range = b.max - b.min || 1
    function pct(v) { return ((v - b.min) / range * 100).toFixed(1) + '%' }
    return (
      <div>
        <ColSelect value={col} onChange={setCol} cols={viz.numeric_columns} label='Column' />
        <div style={{ padding: '40px 20px' }}>
          <div style={{ position: 'relative', height: 80, margin: '0 40px' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', top: '20%', left: pct(b.q1), width: `calc(${pct(b.q3)} - ${pct(b.q1)})`,
              height: '60%', background: 'rgba(108,99,255,0.3)', border: '1.5px solid #6c63ff', borderRadius: 4 }} />
            <div style={{ position: 'absolute', top: '15%', left: pct(b.median), width: 3, height: '70%', background: '#a09af0', borderRadius: 2 }} />
            {b.outliers.slice(0, 20).map((v, i) => (
              <div key={i} style={{ position: 'absolute', top: '42%', left: pct(v), width: 7, height: 7,
                background: '#e24b4a', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12, color: '#666' }}>
            <span>Min: {b.min}</span><span>Q1: {b.q1}</span><span style={{ color: '#a09af0' }}>Median: {b.median}</span><span>Q3: {b.q3}</span><span>Max: {b.max}</span>
          </div>
          {b.outliers.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: '#e24b4a' }}>Outliers detected: {b.outliers.length}</div>}
        </div>
        <ChartNote text='The purple box = middle 50% of your data. The purple line = median. Red dots = outliers. Many outliers may affect model accuracy.' />
      </div>
    )
  }
 
  const charts = [<HistogramChart />, <CorrelationChart />, <ScatterPlot />, <MissingChart />, <BoxPlotChart />]
 
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to='/' style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0' }}>Explore data</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#444', fontFamily: 'monospace' }}>
          {sessionStorage.getItem('csvFile') || 'dataset.csv'}
        </span>
      </header>
 
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>Explore your data</h2>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 28 }}>Understand your dataset before building a model.</p>
 
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '7px 16px', borderRadius: 99, fontSize: 13, cursor: 'pointer',
              background: tab === i ? ACCENT : '#13131a',
              border: `1px solid ${tab === i ? ACCENT : 'rgba(255,255,255,0.07)'}`,
              color: tab === i ? '#fff' : '#888', transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>
 
        {/* Chart area */}
        <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', marginBottom: 28 }}>
          {charts[tab]}
        </div>
 
        {/* Continue button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => navigate(`/${modelType}`)} style={{
            padding: '12px 28px', background: ACCENT, border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Continue to model config →
          </button>
        </div>
      </main>
    </div>
  )
}
 
function ColSelect({ value, onChange, cols, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 12, color: '#666', minWidth: 50 }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: '#1c1c26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        color: '#e0e0e0', padding: '6px 10px', fontSize: 13, cursor: 'pointer',
      }}>
        {cols.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}
 
function ChartNote({ text }) {
  return (
    <p style={{ marginTop: 14, fontSize: 12, color: '#555', lineHeight: 1.6,
      borderLeft: '3px solid rgba(108,99,255,0.4)', paddingLeft: 12 }}>
      {text}
    </p>
  )
}
 
function NoData({ msg }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: '#555', fontSize: 14 }}>{msg}</div>
}
