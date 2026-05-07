<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="gd-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title class="gd-title">
          <span class="gd-title-inner">
            <ion-icon :icon="hardwareChipOutline" class="gd-title-icon" aria-hidden="true" />
            Tablero Técnico
          </span>
        </ion-title>
        <ion-badge slot="end" class="live-badge" color="warning">MONITOREO</ion-badge>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gd-content">
      <div class="page-shell">

      <!-- KPI Status Cards -->
      <div class="kpi-grid">
        <div v-for="kpi in technicalKpis" :key="kpi.id" class="kpi-card" :class="kpi.status">
          <div v-if="kpi.icon" class="kpi-icon" aria-hidden="true">{{ kpi.icon }}</div>
          <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.currentDisplay }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-bar-wrap">
            <div class="kpi-bar-fill" :style="{ width: barPct(kpi) + '%', background: kpi.color }" />
          </div>
          <div class="kpi-status-row">
            <span class="kpi-dot" :class="kpi.status" />
            <span class="kpi-tgt">
              Objetivo: {{ kpi.unitPrefix }}{{ kpi.step < 1 ? kpi.target.toFixed(2) : kpi.target }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}
            </span>
          </div>
          <div class="kpi-threshold-chip" v-if="kpi.chartSupportsLine">Umbral en gráfico</div>
        </div>
      </div>

      <!-- Section: Real-time -->
      <div class="section-header">
        <ion-icon :icon="pulseOutline" class="section-lead section-lead--pulse" aria-hidden="true" />
        <h2 class="section-title">Métricas del Sistema</h2>
        <div class="section-line" />
        <router-link to="/kpi-panel" class="goto-kpi">Gestionar KPIs</router-link>
      </div>

      <!-- ─── Chart 6: Real-time Line (Chart.js) — T1 latency threshold ─── -->
      <div class="chart-card wide">
        <div class="chart-header">
          <div>
            <h3 class="chart-title chart-title--live">
              Solicitudes API / segundo
              <span class="live-pill" aria-hidden="true">Live</span>
            </h3>
            <p class="chart-subtitle">KPI T1 — Línea ámbar discontinua = umbral de latencia | Biblioteca: Chart.js (tiempo real)</p>
          </div>
          <div class="chart-badge realtime-badge">TIEMPO REAL • Chart.js</div>
        </div>

        <!-- Inline target editor for T1 -->
        <div class="inline-threshold">
          <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
          <label class="ith-label">Alerta de latencia (ms)</label>
          <input type="range" class="ith-slider" min="50" max="500" step="10"
            :value="latencyTarget"
            @input="(e) => store.setTarget('t1_latency', +( e.target as HTMLInputElement).value)" />
          <span class="ith-value">{{ latencyTarget }}ms</span>
          <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('t1_latency')">
            <ion-icon :icon="refreshOutline" />
          </button>
        </div>

        <div class="chartjs-wrapper-tall">
          <Line :data="realtimeData" :options="realtimeOptions" />
        </div>
        <div class="realtime-stats">
          <span class="rs-item">Req/s: <b>{{ currentRps }}</b></span>
          <span class="rs-item">Promedio: <b>{{ avgRps }}</b></span>
          <span class="rs-item" :class="p95 > latencyTarget ? 'warn' : 'ok'">
            Latencia p95: <b>{{ p95 }}ms</b>
          </span>
          <span class="rs-item ok">Tasa de error: <b>0.07%</b></span>
        </div>
      </div>

      <!-- Charts Row: Heatmap + Gauges -->
      <div class="charts-row">
        <!-- Chart 7: Heatmap (ECharts) — T3, no line -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Mapa de calor de errores</h3>
              <p class="chart-subtitle">KPI T3 — Objetivo de tasa de error: {{ errorTarget }}% | Biblioteca: ECharts</p>
            </div>
            <div class="chart-badge echarts-badge">ECharts</div>
          </div>
          <div class="no-line-note">
            <span class="no-line-note__tag">Nota</span>
            El mapa de calor muestra la distribución — sin una sola línea de umbral.
            <router-link to="/kpi-panel">Ajustar en el panel KPI</router-link>
          </div>
          <v-chart v-if="chartsReady" class="echart-container" :option="heatmapOption" autoresize />
          <div v-else class="chart-loading">Cargando gráfico…</div>
        </div>

        <!-- Chart 8: Custom Gauge — T2 target marker -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Indicadores de salud del sistema</h3>
              <p class="chart-subtitle">KPI T2 — Marcador cian = objetivo de disponibilidad | Biblioteca: SVG personalizado</p>
            </div>
            <div class="chart-badge custom-badge">SVG Personalizado</div>
          </div>

          <!-- Inline target editor for T2 -->
          <div class="inline-threshold">
            <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
            <label class="ith-label">Objetivo de disponibilidad</label>
            <input type="range" class="ith-slider" min="95" max="100" step="0.1"
              :value="uptimeTarget"
              @input="(e) => store.setTarget('t2_uptime', +( e.target as HTMLInputElement).value)" />
            <span class="ith-value">{{ uptimeTarget.toFixed(1) }}%</span>
            <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('t2_uptime')">
              <ion-icon :icon="refreshOutline" />
            </button>
          </div>

          <div class="gauges-grid">
            <div v-for="gauge in gaugeData" :key="gauge.label" class="gauge-wrapper">
              <svg viewBox="0 0 120 70" class="gauge-svg">
                <!-- Background arc -->
                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round" />
                <!-- Value arc -->
                <path :d="arcPath(gauge.value)" fill="none" :stroke="gauge.color" stroke-width="8" stroke-linecap="round" />
                <!-- Target marker (only on uptime gauge) -->
                <path v-if="gauge.id === 'uptime'"
                  :d="arcPath(uptimeTarget - 95)"
                  fill="none"
                  stroke="#00f5d4"
                  stroke-width="2"
                  stroke-dasharray="4 200"
                  stroke-linecap="round"
                  opacity="0.8"
                />
                <!-- Target tick mark on uptime gauge -->
                <circle v-if="gauge.id === 'uptime'"
                  :cx="targetTickX(uptimeTarget)" :cy="targetTickY(uptimeTarget)"
                  r="3" fill="#00f5d4"
                />
                <text x="60" y="58" text-anchor="middle" font-size="13" font-weight="700" :fill="gauge.color">
                  {{ gauge.display }}
                </text>
              </svg>
              <div class="gauge-label">{{ gauge.label }}</div>
              <div class="gauge-status" :class="gauge.ok ? 'ok' : 'warn'">
                {{ gauge.ok ? 'OK' : 'Alerta' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Infrastructure -->
      <div class="section-header">
        <ion-icon :icon="layersOutline" class="section-lead" aria-hidden="true" />
        <h2 class="section-title">Análisis de Infraestructura</h2>
        <div class="section-line" />
      </div>

      <!-- Charts Row: Scatter + Treemap -->
      <div class="charts-row">
        <!-- Chart 9: Scatter (Chart.js) — T5 memory+CPU thresholds -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Memoria vs CPU por Servicio</h3>
              <p class="chart-subtitle">KPI T5 — Líneas discontinuas = umbrales de memoria y CPU | Biblioteca: Chart.js</p>
            </div>
            <div class="chart-badge chartjs-badge">Chart.js</div>
          </div>

          <!-- Inline target editor for T5 -->
          <div class="inline-threshold">
            <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
            <label class="ith-label">Umbral de memoria</label>
            <input type="range" class="ith-slider" min="30" max="95" step="5"
              :value="memoryTarget"
              @input="(e) => store.setTarget('t5_memory', +( e.target as HTMLInputElement).value)" />
            <span class="ith-value">{{ memoryTarget }}%</span>
            <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('t5_memory')">
              <ion-icon :icon="refreshOutline" />
            </button>
          </div>

          <div class="chartjs-wrapper">
            <Scatter :data="scatterData" :options="scatterOptions" />
          </div>
        </div>

        <!-- Chart 10: Treemap (ECharts) — T4, no line -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Tiempo de consulta DB por colección</h3>
              <p class="chart-subtitle">KPI T4 — Objetivo de consulta: {{ dbTarget }}ms promedio | Biblioteca: ECharts</p>
            </div>
            <div class="chart-badge echarts-badge">ECharts</div>
          </div>
          <div class="no-line-note">
            <span class="no-line-note__tag">Nota</span>
            El treemap muestra el costo relativo de consultas — sin línea de umbral.
            <router-link to="/kpi-panel">Ajustar en el panel KPI</router-link>
          </div>
          <v-chart v-if="chartsReady" class="echart-container" :option="treemapOption" autoresize />
          <div v-else class="chart-loading">Cargando gráfico…</div>
        </div>
      </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonBadge, IonIcon
} from '@ionic/vue'
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart, TreemapChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, VisualMapComponent, GridComponent } from 'echarts/components'
import { Line, Scatter } from 'vue-chartjs'
import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale,
  LinearScale, Tooltip, Legend, Filler, ScatterController
} from 'chart.js'
import { useKpiStore } from '../composables/useKpiStore'
import {
  hardwareChipOutline,
  pulseOutline,
  layersOutline,
  locateOutline,
  refreshOutline
} from 'ionicons/icons'

use([CanvasRenderer, HeatmapChart, TreemapChart, TooltipComponent, LegendComponent, VisualMapComponent, GridComponent])
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ScatterController)

const store = useKpiStore()
const { technicalKpis } = store

// Avoid ECharts init while container size is 0 in Ionic transitions/layout.
const chartsReady = ref(false)
onIonViewDidEnter(async () => {
  chartsReady.value = false
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(() => { chartsReady.value = true }))
})
onIonViewWillLeave(() => { chartsReady.value = false })

// ── Reactive targets ──────────────────────────────────────────────────────────
const latencyTarget = computed(() => store.getTarget('t1_latency'))
const uptimeTarget  = computed(() => store.getTarget('t2_uptime'))
const errorTarget   = computed(() => store.getTarget('t3_error'))
const dbTarget      = computed(() => store.getTarget('t4_db'))
const memoryTarget  = computed(() => store.getTarget('t5_memory'))

// CPU threshold is always set to 60% (same visual style)
const cpuThreshold = 60

function barPct(kpi: any) {
  if (kpi.higherIsBetter) return Math.min((kpi.currentValue / kpi.target) * 100, 100)
  return Math.min((kpi.target / kpi.currentValue) * 100, 100)
}

// ── Gauge SVG helpers ────────────────────────────────────────────────────────
function arcPath(value: number): string {
  const pct = Math.min(Math.max(value, 0), 100) / 100
  // Semi-circle sweep from left (10,65) to right (110,65): angle in [0, π]
  const angle = pct * Math.PI
  const x = 10 + 50 * (1 - Math.cos(angle))
  const y = 65 - 50 * Math.sin(angle)
  // For angles <= π on a circle, the small arc is always the correct sweep (large-arc-flag = 0).
  const largeArc = 0
  return `M 10 65 A 50 50 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)}`
}

function targetTickX(val: number): number {
  const pct = Math.min((val - 95) / 5, 1) // 95-100 range → 0-1
  const angle = pct * Math.PI
  return 10 + 50 * (1 - Math.cos(angle))
}

function targetTickY(val: number): number {
  const pct = Math.min((val - 95) / 5, 1)
  const angle = pct * Math.PI
  return 65 - 50 * Math.sin(angle)
}

const gaugeData = computed(() => [
  { id:'uptime',  label:'Disponibilidad', value: Math.min(((99.95 - 95) / 5) * 100, 100), display:'99.95%', color:'#00f5d4', ok: 99.95 >= uptimeTarget.value },
  { id:'cpu',     label:'CPU',           value: 42,  display:'42%',   color:'#10b981', ok: true },
  { id:'memory',  label:'Memoria',       value: 58,  display:'58%',   color: 58 < memoryTarget.value ? '#10b981' : '#ef4444', ok: 58 < memoryTarget.value },
  { id:'disk',    label:'E/S Disco',     value: 76,  display:'76%',   color:'#ef4444', ok: false },
])

// ── Real-time Line ─────────────────────────────────────────────────────────
const MAX = 30
const labels = Array.from({length: MAX}, (_, i) => `${-MAX + i + 1}s`)
const rpsHist = ref<number[]>(Array.from({length: MAX}, () => Math.round(350 + Math.random() * 150)))
const latHist = ref<number[]>(Array.from({length: MAX}, () => Math.round(140 + Math.random() * 80)))
const currentRps = ref(rpsHist.value[MAX - 1])
const avgRps = computed(() => Math.round(rpsHist.value.reduce((a, b) => a + b, 0) / MAX))
const p95 = ref(185)

const realtimeData = computed(() => ({
  labels,
  datasets: [
    {
      label: 'Solicitudes/s',
      data: [...rpsHist.value],
      borderColor: '#00f5d4', backgroundColor: 'rgba(0,245,212,.08)',
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y'
    },
    {
      label: 'Latencia (ms)',
      data: [...latHist.value],
      borderColor: '#7c3aed', backgroundColor: 'transparent',
      fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.5,
      borderDash: [4, 4], yAxisID: 'y1'
    },
    // ↓ Threshold line driven by KPI store
    {
      label: `Alerta (${latencyTarget.value}ms)`,
      data: Array(MAX).fill(latencyTarget.value),
      type: 'line' as const,
      borderColor: '#f59e0b',
      borderDash: [8, 4],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0,
      yAxisID: 'y1'
    }
  ]
}))

const realtimeOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false, animation: {duration: 0},
  plugins: {
    legend: { labels: { color:'#9ca3af', font:{size:11}, boxHeight:2 } },
    tooltip: { mode:'index' as const, intersect: false }
  },
  scales: {
    x: { ticks:{color:'#6b7280', font:{size:9}, maxTicksLimit:8}, grid:{color:'#1f2937'} },
    y: {
      position:'left' as const,
      title:{display:true, text:'req/s', color:'#00f5d4', font:{size:10}},
      ticks:{color:'#9ca3af', font:{size:10}}, grid:{color:'#1f2937'}
    },
    y1: {
      position:'right' as const,
      title:{display:true, text:'ms', color:'#f59e0b', font:{size:10}},
      ticks:{color:'#9ca3af', font:{size:10}}, grid:{drawOnChartArea:false}
    }
  }
}))

let interval: ReturnType<typeof setInterval>
onMounted(() => {
  interval = setInterval(() => {
    const rps = Math.round(350 + Math.random() * 200 + Math.sin(Date.now() / 5000) * 80)
    const lat = Math.round(140 + Math.random() * 100)
    rpsHist.value.push(rps); rpsHist.value.shift()
    latHist.value.push(lat); latHist.value.shift()
    currentRps.value = rps
    p95.value = Math.round(lat * 1.3)
  }, 1000)
})
onUnmounted(() => clearInterval(interval))

// ── Heatmap ───────────────────────────────────────────────────────────────────
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const hours = Array.from({length:24}, (_,i)=>`${i}h`)
const heatData: number[][] = []
for (let d = 0; d < 7; d++) {
  for (let h = 0; h < 24; h++) {
    const isPeak = h>=10 && h<=22, isWeekend = d>=5
    heatData.push([h, d, Math.round((isPeak?15:3) * (isWeekend?1.5:1) * (0.5+Math.random()))])
  }
}
const heatmapOption = {
  backgroundColor:'transparent',
  tooltip:{formatter:(p:any)=>`${days[p.data[1]]}, ${hours[p.data[0]]}<br/>Errores: <b>${p.data[2]}</b>`},
  grid:{left:55,right:10,top:20,bottom:30},
  xAxis:{type:'category',data:hours,axisTick:{show:false},axisLabel:{color:'#6b7280',fontSize:9,interval:3},splitArea:{show:false}},
  yAxis:{type:'category',data:days,axisLabel:{color:'#9ca3af',fontSize:11},axisTick:{show:false},splitArea:{show:false}},
  visualMap:{min:0,max:40,calculable:true,orient:'horizontal',left:'center',bottom:-5,
    inRange:{color:['#1f2937','#7c3aed','#ef4444']},
    text:['High','Low'],textStyle:{color:'#9ca3af',fontSize:10}},
  series:[{type:'heatmap',data:heatData,label:{show:false},
    itemStyle:{borderRadius:2},
    emphasis:{itemStyle:{shadowBlur:10,shadowColor:'rgba(0,0,0,.5)'}}}]
}

// ── Scatter — reactive threshold lines ────────────────────────────────────────
const services = [
  {name:'Auth Service',  cpu:28, mem:42},
  {name:'Game API',      cpu:55, mem:63},
  {name:'Chat Server',   cpu:41, mem:55},
  {name:'Media CDN',     cpu:18, mem:35},
  {name:'Match-maker',   cpu:72, mem:68},
  {name:'Leaderboard',   cpu:35, mem:48},
  {name:'Notification',  cpu:22, mem:31},
  {name:'Analytics',     cpu:61, mem:74},
  {name:'Payment GW',    cpu:19, mem:27},
  {name:'Search Svc',    cpu:48, mem:58},
]

const scatterData = computed(() => ({
  datasets: [
    {
      label: 'Microservicios',
      data: services.map(s => ({x:s.cpu, y:s.mem})),
      backgroundColor: services.map(s =>
        s.cpu > cpuThreshold || s.mem > memoryTarget.value ? '#ef444499' :
        s.cpu > cpuThreshold*0.7 || s.mem > memoryTarget.value*0.85 ? '#f59e0b99' : '#10b98199'
      ),
      borderColor: services.map(s =>
        s.cpu > cpuThreshold || s.mem > memoryTarget.value ? '#ef4444' :
        s.cpu > cpuThreshold*0.7 || s.mem > memoryTarget.value*0.85 ? '#f59e0b' : '#10b981'
      ),
      borderWidth: 2,
      pointRadius: 10, pointHoverRadius: 13,
    },
    // Horizontal memory threshold line
    {
      label: `Memoria (${memoryTarget.value}%)`,
      data: [{x:0, y:memoryTarget.value},{x:100, y:memoryTarget.value}],
      borderColor: '#f59e0b', borderDash:[8,4], borderWidth:2,
      pointRadius:0, fill:false, tension:0,
    },
    // Vertical CPU threshold line
    {
      label: `CPU (${cpuThreshold}%)`,
      data: [{x:cpuThreshold, y:0},{x:cpuThreshold, y:100}],
      borderColor: '#ef4444', borderDash:[8,4], borderWidth:2,
      pointRadius:0, fill:false, tension:0,
    }
  ]
}))

const scatterOptions = computed(() => ({
  responsive:true, maintainAspectRatio:false,
  plugins: {
    legend:{labels:{color:'#9ca3af',font:{size:10},boxHeight:2}},
    tooltip:{callbacks:{
      label:(ctx:any)=>{
        if (ctx.datasetIndex > 0) return undefined
        const s = services[ctx.dataIndex]
        return [`${s.name}`, `CPU: ${s.cpu}%  Memoria: ${s.mem}%`]
      }
    }}
  },
  scales:{
    x:{title:{display:true,text:'CPU (%)',color:'#9ca3af',font:{size:11}},
       ticks:{color:'#9ca3af'},grid:{color:'#1f2937'},min:0,max:100},
    y:{title:{display:true,text:'Memoria (%)',color:'#9ca3af',font:{size:11}},
       ticks:{color:'#9ca3af'},grid:{color:'#1f2937'},min:0,max:100}
  }
}))

// ── Treemap ───────────────────────────────────────────────────────────────────
const treemapOption = {
  backgroundColor:'transparent',
  tooltip:{formatter:(p:any)=>`${p.name}<br/>Consulta promedio: <b>${p.value}ms</b>`},
  series:[{
    type:'treemap',
    data:[
      {name:'users',       value:48, itemStyle:{color:'#7c3aed'}},
      {name:'games',       value:35, itemStyle:{color:'#00f5d4'}},
      {name:'matches',     value:72, itemStyle:{color:'#ef4444'}},
      {name:'leaderboard', value:29, itemStyle:{color:'#10b981'}},
      {name:'chat_msgs',   value:18, itemStyle:{color:'#f59e0b'}},
      {name:'achievements',value:41, itemStyle:{color:'#60a5fa'}},
      {name:'player_stats',value:56, itemStyle:{color:'#f472b6'}},
      {name:'guilds',      value:22, itemStyle:{color:'#a78bfa'}},
      {name:'tournaments', value:63, itemStyle:{color:'#fb923c'}},
      {name:'sessions',    value:31, itemStyle:{color:'#34d399'}},
    ],
    label:{show:true,formatter:(p:any)=>`${p.name}\n${p.value}ms`,fontSize:11,color:'#f9fafb',fontWeight:'bold'},
    breadcrumb:{show:false},
    itemStyle:{borderColor:'#111827',borderWidth:2,gapWidth:2,borderRadius:4},
    emphasis:{itemStyle:{shadowBlur:15,shadowColor:'rgba(0,245,212,.4)'}}
  }]
}
</script>

<style scoped>
.page-shell{
  max-width: var(--gd-page-max, 1280px);
  margin: 0 auto;
  padding: 0 clamp(12px, 2.5vw, 20px) 28px;
  box-sizing: border-box;
}
.gd-toolbar{
  --background: var(--gd-surface-0, #0a0f1e);
  border-bottom: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.gd-title{ color: var(--ion-text-color); font-weight: 650; font-size: 1rem; }
.gd-title-inner{ display: inline-flex; align-items: center; gap: 10px; }
.gd-title-icon{ font-size: 1.15rem; color: var(--ion-color-warning); }
.live-badge{margin-right:12px;font-size:10px;font-weight:600;letter-spacing:.04em;}
.gd-content{--background: var(--gd-surface-0, #0a0f1e);}

/* KPI Cards */
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:20px 0 8px;}
.kpi-card{
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-md, 12px);
  padding:14px 12px;text-align:center;position:relative;overflow:hidden;
  transition: border-color .2s, box-shadow .2s;
}
.kpi-card:hover{
  border-color: var(--gd-border-strong, rgba(255,255,255,.12));
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
}
.kpi-card.ok::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#10b981,var(--ion-color-primary));}
.kpi-card.risk::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#f59e0b,#10b981);}
.kpi-card.bad::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ef4444,#f59e0b);}
.kpi-icon{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 4px 8px;
  margin: 0 auto 8px;
  font-size: 1.35rem;
  line-height: 1;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: 10px;
}
.kpi-value{font-size:18px;font-weight:700;font-family:'Fira Code',monospace;}
.kpi-label{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin:4px 0;}
.kpi-bar-wrap{background:#1f2937;border-radius:99px;height:4px;margin:6px 0;overflow:hidden;}
.kpi-bar-fill{height:100%;border-radius:99px;max-width:100%;transition:width .5s ease;}
.kpi-status-row{display:flex;align-items:center;justify-content:center;gap:5px;}
.kpi-dot{width:7px;height:7px;border-radius:50%;}
.kpi-dot.ok{background:#10b981;}
.kpi-dot.risk{background:#f59e0b;}
.kpi-dot.bad{background:#ef4444;}
.kpi-tgt{font-size:10px;color:#6b7280;}
.kpi-threshold-chip{
  margin-top:8px;font-size:10px;font-weight:600;
  background:rgba(var(--ion-color-primary-rgb),.1);color:var(--ion-color-primary);
  border:1px solid rgba(var(--ion-color-primary-rgb),.22);
  border-radius:999px;padding:3px 8px;display:inline-block;
}

/* Section Header */
.section-header{display:flex;align-items:center;gap:12px;padding:12px 0 8px;}
.section-lead{font-size:1.1rem;color:var(--ion-color-warning);flex-shrink:0;}
.section-lead--pulse{ color: #f87171; }
.section-title{margin:0;font-size:15px;color:var(--ion-text-color);font-weight:650;letter-spacing:.01em;}
.section-line{flex:1;height:1px;background:linear-gradient(90deg,var(--gd-border-strong),transparent);}
.goto-kpi{
  font-size:11px;color:var(--ion-color-warning);text-decoration:none;
  padding:6px 12px;border-radius:999px;
  border:1px solid rgba(245,158,11,.35);white-space:nowrap;font-weight:600;
  transition:background .2s, border-color .2s;
}
.goto-kpi:hover{background:rgba(245,158,11,.1);}

/* Chart Cards */
.chart-card{
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-lg, 16px);
  padding:18px;
  margin: 10px 0;
}
.chart-card.wide{ margin-left: 0; margin-right: 0; }
.chart-card:hover{border-color: var(--gd-border-strong, rgba(255,255,255,.12));}
.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.charts-row .chart-card{margin:0;}
.chart-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.chart-title{margin:0;font-size:14px;color:var(--ion-text-color);font-weight:600;}
.chart-title--live{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.live-pill{
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #fecaca;
  background: rgba(127, 29, 29, 0.35);
}
.chart-subtitle{margin:4px 0 0;font-size:11px;color:#6b7280;}

.chart-badge{font-size:10px;padding:3px 8px;border-radius:99px;font-weight:600;letter-spacing:.05em;white-space:nowrap;}
.echarts-badge{background:#1a2e2a;color:#10b981;border:1px solid #059669;}
.chartjs-badge{background:#2d1b4e;color:#a78bfa;border:1px solid #7c3aed;}
.custom-badge{background:#2d2010;color:#f59e0b;border:1px solid #d97706;}
.realtime-badge{background:#1a0a0a;color:#ef4444;border:1px solid #dc2626;animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.6}}

/* Inline Threshold Editor */
.inline-threshold{
  display:grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto auto;
  align-items:center;
  column-gap:10px;
  background: var(--gd-surface-1, #0f1419);
  border:1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-sm, 8px);
  padding:10px 12px;margin-bottom:12px;
  min-width: 0;
}
.ith-lead{font-size:1rem;color:var(--ion-color-medium);flex-shrink:0;}
.ith-label{font-size:11px;color:#9ca3af;white-space:nowrap;flex-shrink:0;}
.ith-slider{
  min-width: 0;
  width: 100%;
  appearance:none;
  -webkit-appearance:none;
  height:3px;
  border-radius:99px;
  background:linear-gradient(90deg,#f59e0b,#374151);
  outline:none;
  cursor:pointer;
}
.ith-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#f59e0b;cursor:pointer;box-shadow:0 0 6px #f59e0b;}
.ith-value{
  font-size:12px;
  font-weight:700;
  color:#f59e0b;
  /* Avoid odd spacing when custom fonts aren't installed (Fira Code may not be present). */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  letter-spacing: 0;
  word-spacing: 0;
  white-space:nowrap;
  min-width:72px;
  text-align:right;
}
.ith-reset{
  display:inline-flex;align-items:center;justify-content:center;
  width:34px;height:34px;
  background:transparent;border:1px solid var(--gd-border-strong, rgba(255,255,255,.12));
  color:var(--ion-color-medium);border-radius:8px;cursor:pointer;flex-shrink:0;
}
.ith-reset:hover{color:var(--ion-text-color);border-color:rgba(255,255,255,.2);}

.no-line-note{
  font-size:11px;color:#9ca3af;line-height:1.45;
  background: var(--gd-surface-1, #0f1419);
  border:1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-sm, 8px);
  padding:8px 12px;margin-bottom:12px;
}
.no-line-note__tag{
  display:inline-block;
  margin-right:8px;
  padding:1px 6px;
  font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ion-color-medium);
  border:1px solid var(--gd-border, rgba(255,255,255,.1));
  border-radius:4px;
  vertical-align:middle;
}
.no-line-note a{color:var(--ion-color-warning);text-decoration:none;font-weight:600;}
.no-line-note a:hover{text-decoration:underline;}

.chartjs-wrapper-tall{height:210px;position:relative;}
.chartjs-wrapper{height:240px;position:relative;}
.echart-container{height:250px;width:100%;}
.chart-loading{
  height:250px;width:100%;
  display:flex;align-items:center;justify-content:center;
  color:#6b7280;font-size:12px;
  background: var(--gd-surface-1, #0f1419);
  border:1px dashed var(--gd-border, rgba(255,255,255,.12));
  border-radius: var(--gd-radius-md, 12px);
}

/* Real-time stats */
.realtime-stats{display:flex;gap:20px;margin-top:10px;padding-top:10px;border-top:1px solid #1f2937;}
.rs-item{font-size:12px;color:#9ca3af;}
.rs-item b{color:#f9fafb;}
.rs-item.warn b{color:#ef4444;}
.rs-item.ok b{color:#10b981;}

/* Gauges */
.gauges-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:8px 0;}
.gauge-wrapper{text-align:center;}
.gauge-svg{
  width: 100%;
  max-width: 120px;
  height: auto;
  aspect-ratio: 120 / 70;
  display: block;
  margin: 0 auto;
}
.gauge-label{font-size:11px;color:#9ca3af;margin-top:4px;text-transform:uppercase;letter-spacing:.05em;}
.gauge-status{font-size:11px;margin-top:2px;font-weight:600;}
.gauge-status.ok{color:#10b981;}
.gauge-status.warn{color:#ef4444;}

@media(max-width:768px){
  .kpi-grid{grid-template-columns:repeat(3,1fr);}
  .charts-row{grid-template-columns:1fr;}
  .inline-threshold{
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "lead label reset"
      "slider slider slider"
      "value value value";
    row-gap: 8px;
  }
  .ith-lead{grid-area:lead;}
  .ith-label{grid-area:label; min-width: 0; overflow: hidden; text-overflow: ellipsis;}
  .ith-reset{grid-area:reset; justify-self:end;}
  .ith-slider{grid-area:slider;}
  .ith-value{
    grid-area:value;
    min-width: 0;
    justify-self: end;
    text-align:right;
  }
}
</style>
