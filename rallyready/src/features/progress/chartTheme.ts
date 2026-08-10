/**
 * Recharts renders SVG attributes, so charts reference the same CSS custom
 * properties as the rest of the app. One consequence worth having: switching
 * theme recolours every chart with no React involvement at all.
 */
export const CHART = {
  primary: 'var(--primary)',
  rest: 'var(--rest)',
  sprint: 'var(--sprint)',
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
  surface: 'var(--card)',
  text: 'var(--foreground)',
} as const

export const AXIS_TICK = { fill: CHART.axis, fontSize: 11 } as const

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: CHART.surface,
    border: `1px solid ${CHART.grid}`,
    borderRadius: 12,
    fontSize: 12,
    color: CHART.text,
    boxShadow: '0 8px 24px rgb(0 0 0 / 0.16)',
  },
  labelStyle: { color: CHART.axis, marginBottom: 4 },
  cursor: { fill: CHART.grid, opacity: 0.25 },
} as const
