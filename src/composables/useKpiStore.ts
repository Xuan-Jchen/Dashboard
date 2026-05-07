import { reactive, watch, computed, ref } from 'vue'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KpiDefinition {
  id: string
  label: string
  shortLabel: string
  dashboard: 'business' | 'technical'
  /** Emoji or short visual mark; if empty, UI should hide the icon container */
  icon: string
  unit: string
  unitPrefix: string
  currentValue: number
  currentDisplay: string
  defaultTarget: number
  min: number
  max: number
  step: number
  higherIsBetter: boolean
  chartId: string | null
  chartSupportsLine: boolean
  chartLabel: string
  description: string
  color: string
  /** Built-in KPIs tied to charts cannot be removed */
  locked: boolean
}

export type NewKpiInput = {
  label: string
  shortLabel: string
  dashboard: 'business' | 'technical'
  icon?: string
  unit: string
  unitPrefix: string
  currentValue: number
  currentDisplay?: string
  defaultTarget: number
  min: number
  max: number
  step: number
  higherIsBetter: boolean
  chartId?: string | null
  chartSupportsLine?: boolean
  chartLabel?: string
  description?: string
  color?: string
}

export type ChartOption = {
  id: string
  dashboard: 'business' | 'technical'
  label: string
  supportsLine: boolean
}

// Charts available to map a KPI to (for UI selection).
export const CHART_OPTIONS: ChartOption[] = [
  { id: 'b_mau_area', dashboard: 'business', label: 'Usuarios Activos Mensuales (Área) — ApexCharts', supportsLine: true },
  { id: 'b_top_games_bar', dashboard: 'business', label: 'Juegos principales por jugadores (Barras) — Chart.js', supportsLine: true },
  { id: 'b_funnel', dashboard: 'business', label: 'Embudo de adquisición (Personalizado)', supportsLine: true },
  { id: 't_realtime_line', dashboard: 'technical', label: 'Req/s + Latencia (Tiempo real) — Chart.js', supportsLine: true },
  { id: 't_gauges', dashboard: 'technical', label: 'Indicadores de salud (Gauges SVG)', supportsLine: true },
  { id: 't_scatter', dashboard: 'technical', label: 'Memoria vs CPU (Dispersión) — Chart.js', supportsLine: true },
]

// ─── Built-in KPIs (emoji + locked) ──────────────────────────────────────────

export const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    id: 'b1_mau',
    label: 'Usuarios Activos Mensuales',
    shortLabel: 'Objetivo MAU',
    dashboard: 'business',
    icon: '📈',
    unit: 'users',
    unitPrefix: '',
    currentValue: 121000,
    currentDisplay: '121 000',
    defaultTarget: 100000,
    min: 50000,
    max: 200000,
    step: 5000,
    higherIsBetter: true,
    chartId: 'b_mau_area',
    chartSupportsLine: true,
    chartLabel: 'Usuarios Activos Mensuales (Área)',
    description: 'Número objetivo de usuarios activos mensuales — mostrado como línea de referencia en el gráfico de área.',
    color: '#00f5d4',
    locked: true,
  },
  {
    id: 'b2_retention',
    label: 'Tasa de retención a 30 días',
    shortLabel: 'Objetivo retención',
    dashboard: 'business',
    icon: '🔄',
    unit: '%',
    unitPrefix: '',
    currentValue: 43,
    currentDisplay: '43%',
    defaultTarget: 40,
    min: 10,
    max: 80,
    step: 1,
    higherIsBetter: true,
    chartId: 'b_funnel',
    chartSupportsLine: true,
    chartLabel: 'Embudo de adquisición de jugadores (Personalizado)',
    description: 'Tasa mínima de retención a 30 días — mostrada como marcador objetivo en el gráfico de embudo.',
    color: '#7c3aed',
    locked: true,
  },
  {
    id: 'b3_arpu',
    label: 'Ingreso promedio por usuario',
    shortLabel: 'Objetivo ARPU',
    dashboard: 'business',
    icon: '💰',
    unit: '€',
    unitPrefix: '€',
    currentValue: 5.8,
    currentDisplay: '€5.80',
    defaultTarget: 5.0,
    min: 1,
    max: 15,
    step: 0.5,
    higherIsBetter: true,
    chartId: null,
    chartSupportsLine: false,
    chartLabel: 'Ingresos por género (Donut) — sin línea de umbral',
    description: 'Objetivo de ingreso por usuario mensual. El gráfico de donut muestra la composición de ingresos sin línea de umbral.',
    color: '#10b981',
    locked: true,
  },
  {
    id: 'b4_top_game',
    label: 'Jugadores mínimos por juego principal',
    shortLabel: 'Objetivo jugadores',
    dashboard: 'business',
    icon: '🎮',
    unit: 'K players',
    unitPrefix: '',
    currentValue: 48.2,
    currentDisplay: '48.2K',
    defaultTarget: 20,
    min: 5,
    max: 60,
    step: 1,
    higherIsBetter: true,
    chartId: 'b_top_games_bar',
    chartSupportsLine: true,
    chartLabel: 'Juegos principales por jugadores (Barras)',
    description: 'Umbral mínimo de jugadores para que un juego se considere top — mostrado como línea discontinua en el gráfico de barras.',
    color: '#f59e0b',
    locked: true,
  },
  {
    id: 'b5_nps',
    label: 'Puntuación NPS',
    shortLabel: 'Objetivo NPS',
    dashboard: 'business',
    icon: '⭐',
    unit: 'pts',
    unitPrefix: '',
    currentValue: 62,
    currentDisplay: '62',
    defaultTarget: 50,
    min: 0,
    max: 100,
    step: 5,
    higherIsBetter: true,
    chartId: null,
    chartSupportsLine: false,
    chartLabel: 'Engagement de la comunidad (Polar Area) — sin línea de umbral',
    description: 'Objetivo de puntuación NPS. El gráfico polar muestra el desglose del engagement sin una línea de umbral única.',
    color: '#a78bfa',
    locked: true,
  },
  {
    id: 't1_latency',
    label: 'Tiempo de respuesta API p95',
    shortLabel: 'Objetivo de latencia',
    dashboard: 'technical',
    icon: '⚡',
    unit: 'ms',
    unitPrefix: '',
    currentValue: 185,
    currentDisplay: '185ms',
    defaultTarget: 200,
    min: 50,
    max: 500,
    step: 10,
    higherIsBetter: false,
    chartId: 't_realtime_line',
    chartSupportsLine: true,
    chartLabel: 'Solicitudes API / segundo en vivo (Línea en tiempo real)',
    description: 'Latencia p95 máxima aceptable — mostrada como una línea de alerta horizontal en el gráfico en tiempo real.',
    color: '#f59e0b',
    locked: true,
  },
  {
    id: 't2_uptime',
    label: 'Disponibilidad del sistema',
    shortLabel: 'Objetivo disponibilidad',
    dashboard: 'technical',
    icon: '🟢',
    unit: '%',
    unitPrefix: '',
    currentValue: 99.95,
    currentDisplay: '99.95%',
    defaultTarget: 99.9,
    min: 95,
    max: 100,
    step: 0.1,
    higherIsBetter: true,
    chartId: 't_gauges',
    chartSupportsLine: true,
    chartLabel: 'Indicadores de salud del sistema (SVG personalizado)',
    description: 'Objetivo de disponibilidad — mostrado como un arco marcador en el indicador de uptime.',
    color: '#00f5d4',
    locked: true,
  },
  {
    id: 't3_error',
    label: 'Tasa de errores',
    shortLabel: 'Objetivo tasa de errores',
    dashboard: 'technical',
    icon: '🛡️',
    unit: '%',
    unitPrefix: '',
    currentValue: 0.07,
    currentDisplay: '0.07%',
    defaultTarget: 0.1,
    min: 0.01,
    max: 1,
    step: 0.01,
    higherIsBetter: false,
    chartId: null,
    chartSupportsLine: false,
    chartLabel: 'Mapa de calor de errores (ECharts) — sin línea de umbral',
    description: 'Tasa de errores máxima aceptable. El mapa de calor visualiza la distribución de errores sin un único umbral.',
    color: '#ef4444',
    locked: true,
  },
  {
    id: 't4_db',
    label: 'Tiempo medio de consulta DB',
    shortLabel: 'Objetivo consulta DB',
    dashboard: 'technical',
    icon: '🗄️',
    unit: 'ms',
    unitPrefix: '',
    currentValue: 43,
    currentDisplay: '43ms',
    defaultTarget: 50,
    min: 10,
    max: 200,
    step: 5,
    higherIsBetter: false,
    chartId: null,
    chartSupportsLine: false,
    chartLabel: 'Tiempo de consulta DB por colección (Treemap) — sin línea de umbral',
    description: 'Tiempo medio de consulta aceptable. El treemap muestra el coste relativo de consultas sin un único umbral.',
    color: '#60a5fa',
    locked: true,
  },
  {
    id: 't5_memory',
    label: 'Uso de memoria por Pod',
    shortLabel: 'Objetivo memoria',
    dashboard: 'technical',
    icon: '💾',
    unit: '%',
    unitPrefix: '',
    currentValue: 58,
    currentDisplay: '58%',
    defaultTarget: 70,
    min: 30,
    max: 95,
    step: 5,
    higherIsBetter: false,
    chartId: 't_scatter',
    chartSupportsLine: true,
    chartLabel: 'Dispersión Memoria vs CPU (Chart.js)',
    description: 'Umbrales de uso de memoria y CPU — mostrados como líneas discontinuas de límite en el gráfico de dispersión.',
    color: '#10b981',
    locked: true,
  },
]

const CUSTOM_STORAGE_KEY = 'gamedash_kpi_custom_v1'
const STORAGE_KEY = 'gamedash_kpi_targets_v1'
const HIDDEN_STORAGE_KEY = 'gamedash_kpi_hidden_v1'

function loadCustomKpis(): KpiDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x): x is KpiDefinition => x && typeof x === 'object' && typeof (x as KpiDefinition).id === 'string')
      .map((x) => ({ ...(x as KpiDefinition), locked: false }))
  } catch {
    return []
  }
}

function saveCustomKpis(list: KpiDefinition[]) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

const customKpis = ref<KpiDefinition[]>(loadCustomKpis())

watch(customKpis, (v) => saveCustomKpis(v), { deep: true })

function loadHiddenIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

function saveHiddenIds(ids: string[]) {
  try {
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(ids))
  } catch { /* ignore */ }
}

const hiddenIds = ref<string[]>(loadHiddenIds())
watch(hiddenIds, (v) => saveHiddenIds(v), { deep: true })

function mergedDefinitions(): KpiDefinition[] {
  return [...KPI_DEFINITIONS, ...customKpis.value]
}

function allDefinitionsIncludingHidden(): KpiDefinition[] {
  return mergedDefinitions()
}

function findDefinition(id: string): KpiDefinition | undefined {
  return KPI_DEFINITIONS.find((k) => k.id === id) ?? customKpis.value.find((k) => k.id === id)
}

const CUSTOM_COLORS = ['#2dd4bf', '#7c3aed', '#f59e0b', '#10b981', '#60a5fa', '#f472b6']

function pickColor(index: number): string {
  return CUSTOM_COLORS[index % CUSTOM_COLORS.length]
}

function loadTargets(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, number>
  } catch { /* ignore */ }
  // Store only overrides; defaults come from KPI definitions.
  return {}
}

function saveTargets(targets: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
  } catch { /* ignore */ }
}

const _state = reactive<{ targets: Record<string, number> }>({
  targets: loadTargets(),
})

watch(() => _state.targets, (t) => saveTargets(t), { deep: true })

function computeStatus(kpi: KpiDefinition, target: number): 'ok' | 'risk' | 'bad' {
  const current = kpi.currentValue
  if (kpi.higherIsBetter) {
    const ratio = current / target
    if (ratio >= 1.0) return 'ok'
    if (ratio >= 0.85) return 'risk'
    return 'bad'
  } else {
    const ratio = current / target
    if (ratio <= 1.0) return 'ok'
    if (ratio <= 1.15) return 'risk'
    return 'bad'
  }
}

export function useKpiStore() {
  function getTarget(id: string): number {
    const kpi = findDefinition(id)
    return _state.targets[id] ?? kpi?.defaultTarget ?? 0
  }

  function setTarget(id: string, value: number) {
    _state.targets[id] = value
  }

  function hasOverride(id: string): boolean {
    return Object.prototype.hasOwnProperty.call(_state.targets, id)
  }

  function clearTarget(id: string) {
    delete _state.targets[id]
    saveTargets(_state.targets)
  }

  function resetAll() {
    for (const key of Object.keys(_state.targets)) {
      delete _state.targets[key]
    }
    saveTargets(_state.targets)
  }

  function resetOne(id: string) {
    const kpi = findDefinition(id)
    if (!kpi) return
    delete _state.targets[kpi.id]
    saveTargets(_state.targets)
  }

  function addCustomKpi(input: NewKpiInput): string {
    const id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    const icon = (input.icon && input.icon.trim()) || '📌'
    const label = input.label.trim()
    const shortLabel = (input.shortLabel && input.shortLabel.trim()) || label.slice(0, 28)
    const min = Math.min(input.min, input.max)
    const max = Math.max(input.min, input.max)
    const defaultTarget = Math.min(max, Math.max(min, input.defaultTarget))
    const currentValue = Number.isFinite(input.currentValue)
      ? Math.min(max, Math.max(min, input.currentValue))
      : defaultTarget
    const currentDisplay =
      (input.currentDisplay && input.currentDisplay.trim()) ||
      `${input.unitPrefix || ''}${currentValue}${input.unitPrefix ? '' : ' ' + input.unit}`.trim()

    const def: KpiDefinition = {
      id,
      label,
      shortLabel,
      dashboard: input.dashboard,
      icon,
      unit: input.unit.trim(),
      unitPrefix: (input.unitPrefix || '').trim(),
      currentValue,
      currentDisplay,
      defaultTarget,
      min,
      max,
      step: input.step > 0 ? input.step : 1,
      higherIsBetter: input.higherIsBetter,
      chartId: input.chartId ?? null,
      chartSupportsLine: input.chartSupportsLine ?? false,
      chartLabel: input.chartLabel || 'KPI personalizado',
      description: (input.description && input.description.trim()) || 'KPI definido por el usuario.',
      color: (input.color && input.color.trim()) || pickColor(customKpis.value.length),
      locked: false,
    }
    customKpis.value = [...customKpis.value, def]
    _state.targets[id] = defaultTarget
    return id
  }

  /** Hide KPI card everywhere (built-in + custom). */
  function hideKpi(id: string) {
    if (!hiddenIds.value.includes(id)) hiddenIds.value = [...hiddenIds.value, id]
    // if user hides it, also drop any override
    clearTarget(id)
  }

  function unhideKpi(id: string) {
    if (!hiddenIds.value.includes(id)) return
    hiddenIds.value = hiddenIds.value.filter((x) => x !== id)
  }

  /** Permanently remove KPI definition if it's custom. Built-ins are only hidden. */
  function deleteKpi(id: string): boolean {
    const kpi = findDefinition(id)
    if (!kpi) return false
    if (kpi.locked) {
      hideKpi(id)
      return true
    }
    customKpis.value = customKpis.value.filter((k) => k.id !== id)
    hideKpi(id)
    return true
  }

  const allKpis = computed(() =>
    mergedDefinitions()
      .filter((kpi) => !hiddenIds.value.includes(kpi.id))
      .map((kpi) => ({
        ...kpi,
        target: _state.targets[kpi.id] ?? kpi.defaultTarget,
        status: computeStatus(kpi, _state.targets[kpi.id] ?? kpi.defaultTarget),
      }))
  )

  const hiddenKpis = computed(() =>
    allDefinitionsIncludingHidden()
      .filter((kpi) => hiddenIds.value.includes(kpi.id))
      .map((kpi) => ({
        ...kpi,
        target: _state.targets[kpi.id] ?? kpi.defaultTarget,
        status: computeStatus(kpi, _state.targets[kpi.id] ?? kpi.defaultTarget),
      }))
  )

  const businessKpis = computed(() => allKpis.value.filter((k) => k.dashboard === 'business'))
  const technicalKpis = computed(() => allKpis.value.filter((k) => k.dashboard === 'technical'))

  const onTrackCount = computed(() => allKpis.value.filter((k) => k.status === 'ok').length)
  const atRiskCount = computed(() => allKpis.value.filter((k) => k.status === 'risk').length)
  const offTrackCount = computed(() => allKpis.value.filter((k) => k.status === 'bad').length)

  return {
    getTarget,
    setTarget,
    hasOverride,
    clearTarget,
    resetAll,
    resetOne,
    addCustomKpi,
    deleteKpi,
    hideKpi,
    unhideKpi,
    allKpis,
    hiddenKpis,
    businessKpis,
    technicalKpis,
    onTrackCount,
    atRiskCount,
    offTrackCount,
  }
}
