<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="gd-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title class="gd-title">
          <span class="gd-title-inner">
            <ion-icon :icon="barChartOutline" class="gd-title-icon" aria-hidden="true" />
            Tablero Comercial
          </span>
        </ion-title>
        <ion-badge slot="end" class="live-badge" color="success">EN VIVO</ion-badge>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gd-content">
      <div class="page-shell">

        <!-- KPI Status Cards -->
        <div class="kpi-grid">
          <div v-for="kpi in businessKpis" :key="kpi.id" class="kpi-card" :class="kpi.status">
            <div v-if="kpi.icon" class="kpi-icon" aria-hidden="true">{{ kpi.icon }}</div>
            <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.currentDisplay }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-status-row">
              <span class="kpi-dot" :class="kpi.status" />
              <span class="kpi-tgt">
                Objetivo:
                {{ kpi.unitPrefix }}{{
                  kpi.unit === 'users'
                    ? (kpi.target / 1000).toFixed(0) + 'K'
                    : (kpi.step < 1 ? kpi.target.toFixed(2) : kpi.target)
                }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}
              </span>
            </div>
            <div class="kpi-threshold-chip" v-if="kpi.chartSupportsLine">Umbral en gráfico</div>
          </div>
        </div>

      <!-- Section header -->
      <div class="section-header">
        <ion-icon :icon="trendingUpOutline" class="section-lead" aria-hidden="true" />
        <h2 class="section-title">Crecimiento y Uso</h2>
        <div class="section-line" />
        <router-link to="/kpi-panel" class="goto-kpi">Gestionar KPIs</router-link>
      </div>

      <!-- ─── Chart 1: MAU Area (ApexCharts) ── KPI B1 annotation ─── -->
      <div class="chart-card wide">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Usuarios Activos Mensuales</h3>
          </div>
          <div class="chart-badge apexcharts-badge">ApexCharts</div>
        </div>

        <div class="inline-threshold">
          <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
          <label class="ith-label">Objetivo MAU</label>
          <input type="range" class="ith-slider" min="50000" max="200000" step="5000"
            :value="mauTarget"
            @input="(e) => store.setTarget('b1_mau', +( e.target as HTMLInputElement).value)" />
          <span class="ith-value">{{ (mauTarget / 1000).toFixed(0) }}K usuarios</span>
          <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('b1_mau')">
            <ion-icon :icon="refreshOutline" />
          </button>
        </div>

        <apexchart type="area" height="280" :options="mauChartOptions" :series="mauSeries" />
      </div>

      <!-- Charts Row: Donut + Bar -->
      <div class="charts-row">
        <!-- Chart 2: Donut (ECharts) — B3, no line -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Ingresos por Género</h3>
            </div>
            <div class="chart-badge echarts-badge">ECharts</div>
          </div>
          <v-chart v-if="chartsReady" class="echart-container" :option="revenueDonutOption" autoresize />
          <div v-else class="chart-loading">Cargando gráfico…</div>
        </div>

        <!-- Chart 4: Horizontal Bar (Chart.js) — B4 threshold line -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Juegos Principales por Jugadores</h3>
            </div>
            <div class="chart-badge chartjs-badge">Chart.js</div>
          </div>

          <div class="inline-threshold">
            <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
            <label class="ith-label">Jugadores mínimos</label>
            <input type="range" class="ith-slider" min="5" max="60" step="1"
              :value="topGameTarget"
              @input="(e) => store.setTarget('b4_top_game', +( e.target as HTMLInputElement).value)" />
            <span class="ith-value">{{ topGameTarget }}K</span>
          <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('b4_top_game')">
            <ion-icon :icon="refreshOutline" />
          </button>
        </div>

          <div class="chartjs-wrapper">
            <Bar :data="topGamesData" :options="topGamesOptions" />
          </div>
        </div>
      </div>

      <!-- Charts Row: Polar + Funnel -->
      <div class="charts-row">
        <!-- Chart 5: Polar Area (ApexCharts) — B5, no line -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Engagement de la comunidad</h3>
            </div>
            <div class="chart-badge apexcharts-badge">ApexCharts</div>
          </div>
          <apexchart type="polarArea" height="260" :options="engagementOptions" :series="engagementSeries" />
        </div>

        <!-- Chart 3: Custom Funnel — B2 target retention marker -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Embudo de Adquisición</h3>
            </div>
            <div class="chart-badge custom-badge">Personalizado</div>
          </div>

          <div class="inline-threshold">
            <ion-icon :icon="locateOutline" class="ith-lead" aria-hidden="true" />
            <label class="ith-label">Objetivo de retención</label>
            <input type="range" class="ith-slider" min="10" max="80" step="1"
              :value="retentionTarget"
              @input="(e) => store.setTarget('b2_retention', +( e.target as HTMLInputElement).value)" />
            <span class="ith-value">{{ retentionTarget }}%</span>
          <button type="button" class="ith-reset" title="Restablecer" aria-label="Restablecer" @click="store.resetOne('b2_retention')">
            <ion-icon :icon="refreshOutline" />
          </button>
        </div>

          <div class="funnel-container">
            <div
              v-for="(step, i) in funnelSteps"
              :key="step.label"
              class="funnel-step"
              :style="{ width: step.pct + '%', background: funnelColors[i] }"
            >
              <span class="funnel-label">{{ step.label }}</span>
              <span class="funnel-value">{{ step.value.toLocaleString() }}</span>
              <span class="funnel-pct">{{ step.pct }}%</span>
            </div>
            <!-- Target line -->
            <div class="funnel-target-line" :style="{ left: Math.min(retentionTarget, 98) + '%' }">
              <span class="ftl-label">Objetivo {{ retentionTarget }}%</span>
            </div>
          </div>

          <div class="funnel-legend">
            <span v-for="(step, i) in funnelSteps" :key="step.label" class="funnel-leg-item">
              <span class="funnel-leg-dot" :style="{ background: funnelColors[i] }" />
              {{ step.label }}: {{ step.dropoff }}
            </span>
          </div>
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
import { computed, nextTick, ref } from 'vue'
import { onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue'
import VueApexCharts from 'vue3-apexcharts'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend
} from 'chart.js'
import { useKpiStore } from '../composables/useKpiStore'
import {
  barChartOutline,
  locateOutline,
  refreshOutline,
  trendingUpOutline
} from 'ionicons/icons'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])
ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)
const apexchart = VueApexCharts

const store = useKpiStore()
const { businessKpis } = store

// Avoid ECharts init while container size is 0 in Ionic transitions/layout.
const chartsReady = ref(false)
onIonViewDidEnter(async () => {
  chartsReady.value = false
  await nextTick()
  // double-rAF lets layout settle after split-pane/menu sizing
  requestAnimationFrame(() => requestAnimationFrame(() => { chartsReady.value = true }))
})
onIonViewWillLeave(() => { chartsReady.value = false })

// ── Reactive targets ──────────────────────────────────────────────────────────
const mauTarget       = computed(() => store.getTarget('b1_mau'))
const retentionTarget = computed(() => store.getTarget('b2_retention'))
const arpuTarget      = computed(() => store.getTarget('b3_arpu'))
const topGameTarget   = computed(() => store.getTarget('b4_top_game'))
const npsTarget       = computed(() => store.getTarget('b5_nps'))

// ── Chart 1: MAU Area ─────────────────────────────────────────────────────────
const mauSeries = [
  { name: 'Usuarios activos mensuales', data: [62000,68000,71000,75000,79000,83000,90000,94000,99000,105000,112000,121000] },
  { name: 'Nuevas inscripciones',      data: [8200, 9100, 9400,10200,10800,11500,13200,13900,14600, 15800, 17000, 18900] }
]

const mauChartOptions = computed(() => ({
  chart: { type:'area' as const, background:'transparent', toolbar:{show:false}, animations:{enabled:false} },
  colors: ['#00f5d4','#7c3aed'],
  fill: { type:'gradient', gradient:{shadeIntensity:1, opacityFrom:0.45, opacityTo:0.05} },
  stroke: { curve:'smooth' as const, width:2 },
  dataLabels: { enabled:false },
  xaxis: {
    categories: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    labels: { style:{colors:'#9ca3af'} }, axisBorder:{show:false}, axisTicks:{show:false}
  },
  yaxis: { labels: { style:{colors:'#9ca3af'}, formatter:(v:number)=>v>=1000?`${(v/1000).toFixed(0)}K`:String(v) } },
  grid: { borderColor:'#1f2937', strokeDashArray:4 },
  tooltip: { theme:'dark', y:{formatter:(v:number)=>v.toLocaleString()} },
  legend: { labels:{colors:'#9ca3af'} },
  annotations: {
    yaxis: [{
      y: mauTarget.value,
      borderColor: '#f59e0b',
      strokeDashArray: 6,
      label: {
        text: `Objetivo ${(mauTarget.value/1000).toFixed(0)}K`,
        style: { color:'#f59e0b', background:'#1f2937', fontSize:'11px', fontWeight:600 },
        position: 'right',
        offsetX: -10
      }
    }]
  }
}))

// ── Chart 2: Revenue Donut ────────────────────────────────────────────────────
const revenueDonutOption = {
  backgroundColor: 'transparent',
  tooltip: { trigger:'item', formatter:'{b}: €{c}K ({d}%)' },
  legend: { orient:'vertical', right:10, top:'center', textStyle:{color:'#9ca3af',fontSize:11} },
  series: [{ name:'Revenue', type:'pie', radius:['45%','75%'], center:['40%','50%'],
    avoidLabelOverlap:false,
    itemStyle:{borderRadius:6,borderColor:'#111827',borderWidth:2},
    label:{show:false},
    emphasis:{label:{show:true,fontSize:14,fontWeight:'bold',color:'#f9fafb'}},
    data:[
      {value:124, name:'FPS / Batalla',        itemStyle:{color:'#00f5d4'}},
      {value:98,  name:'MMORPG',                itemStyle:{color:'#7c3aed'}},
      {value:76,  name:'Estrategia / RTS',      itemStyle:{color:'#f59e0b'}},
      {value:54,  name:'Deportes / Carreras',   itemStyle:{color:'#10b981'}},
      {value:38,  name:'Indie / Rompecabezas',  itemStyle:{color:'#ef4444'}},
    ]
  }]
}

// ── Chart 4: Top Games Bar + threshold line ───────────────────────────────────
const topGamesData = computed(() => ({
  labels: ['Apex Nexus','Realm Wars','CyberDrift','Lost Ark 2','Pixel Quest','Vortex TD','GridIron GO','ShadowHunt'],
  datasets: [
    {
      label: 'Jugadores Activos (K)',
      data: [48.2, 41.7, 35.9, 31.2, 24.8, 19.4, 15.6, 11.3],
      backgroundColor: ['#00f5d4cc','#7c3aedcc','#f59e0bcc','#10b981cc','#00f5d480','#7c3aed80','#f59e0b80','#10b98180'],
      borderColor: '#00f5d4', borderWidth: 1, borderRadius: 4,
      type: 'bar' as const,
    },
    {
      // Threshold line driven by KPI store — no plugin needed
      label: `Objetivo (${topGameTarget.value}K)`,
      data: Array(8).fill(topGameTarget.value),
      type: 'line' as const,
      borderColor: '#f59e0b',
      borderDash: [8, 4],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0,
    }
  ]
})) as any

const topGamesOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display:true, labels:{color:'#9ca3af', font:{size:11}, boxHeight:2} },
    tooltip: { callbacks: { label:(ctx:any)=> ctx.datasetIndex===1 ? ` Objetivo: ${topGameTarget.value}K` : ` ${ctx.parsed.x}K jugadores` } }
  },
  scales: {
    x: { ticks:{color:'#9ca3af', callback:(v:any)=>`${v}K`}, grid:{color:'#1f2937'} },
    y: { ticks:{color:'#f9fafb', font:{size:11}}, grid:{display:false} }
  }
}))

// ── Chart 5: Polar Area ───────────────────────────────────────────────────────
const engagementSeries = [87, 72, 65, 91, 58]
const engagementOptions = {
  chart:{type:'polarArea' as const, background:'transparent', toolbar:{show:false}},
  labels:['Forum Posts','Tournaments','Streams','Reviews','Guilds'],
  colors:['#00f5d4','#7c3aed','#f59e0b','#10b981','#ef4444'],
  fill:{opacity:0.7}, stroke:{colors:['#111827'],width:2},
  yaxis:{show:false},
  plotOptions:{polarArea:{rings:{strokeWidth:1,strokeColor:'#1f2937'}}},
  legend:{position:'bottom' as const,labels:{colors:'#9ca3af'}},
  tooltip:{theme:'dark', y:{formatter:(v:number)=>`${v}%`}}
}

// ── Chart 3: Custom Funnel ────────────────────────────────────────────────────
const funnelColors = ['#00f5d4','#3dddc8','#7c3aed','#a78bfa','#f59e0b']
const funnelSteps = [
  { label:'Visitors',       value:320000, pct:100, dropoff:'—' },
  { label:'Registered',     value:128000, pct:40,  dropoff:'-60%' },
  { label:'First Game',     value:76800,  pct:24,  dropoff:'-40%' },
  { label:'Week 1 Retained',value:38400,  pct:12,  dropoff:'-50%' },
  { label:'30-Day Active',  value:19200,  pct:6,   dropoff:'-50%' },
]
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
.gd-title-inner{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.gd-title-icon{
  font-size: 1.15rem;
  color: var(--ion-color-primary);
}
.live-badge{margin-right:12px;font-size:10px;font-weight:600;letter-spacing:.04em;}
.gd-content{--background: var(--gd-surface-0, #0a0f1e);}

/* KPI Cards */
.kpi-grid{
  display:grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap:14px;
  padding:20px 0 8px;
}
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
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--ion-color-primary),#7c3aed);}
.kpi-card.ok::before{background:linear-gradient(90deg,#10b981,var(--ion-color-primary));}
.kpi-card.bad::before{background:linear-gradient(90deg,#ef4444,#7c3aed);}
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
.kpi-value{font-size:20px;font-weight:700;font-family:'Fira Code',monospace;}
.kpi-label{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin:4px 0;}
.kpi-status-row{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:4px;}
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
.section-lead{font-size:1.1rem;color:var(--ion-color-primary);flex-shrink:0;}
.section-title{margin:0;font-size:15px;color:var(--ion-text-color);font-weight:650;letter-spacing:.01em;}
.section-line{flex:1;height:1px;background:linear-gradient(90deg,var(--gd-border-strong),transparent);}
.goto-kpi{
  font-size:11px;color:var(--ion-color-primary);text-decoration:none;
  padding:6px 12px;border-radius:999px;
  border:1px solid rgba(var(--ion-color-primary-rgb),.35);white-space:nowrap;
  font-weight:600;
  transition:background .2s, border-color .2s;
}
.goto-kpi:hover{background:rgba(var(--ion-color-primary-rgb),.1);}

/* Chart Cards */
.chart-card{
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-lg, 16px);
  padding:18px;
  margin: 10px 0;
  display:flex;
  flex-direction:column;
  min-width: 0;
}
.chart-card.wide{ margin-left: 0; margin-right: 0; }
.chart-card:hover{border-color: var(--gd-border-strong, rgba(255,255,255,.12));}
.charts-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  align-items: stretch;
}
.charts-row .chart-card{margin:0;}
.chart-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.chart-title{margin:0;font-size:14px;color:#f9fafb;font-weight:600;}
.chart-subtitle{margin:4px 0 0;font-size:11px;color:#6b7280;}

.chart-badge{font-size:10px;padding:3px 8px;border-radius:99px;font-weight:600;letter-spacing:.05em;white-space:nowrap;}
.apexcharts-badge{background:#1e3a5f;color:#60a5fa;border:1px solid #1d4ed8;}
.echarts-badge{background:#1a2e2a;color:#10b981;border:1px solid #059669;}
.chartjs-badge{background:#2d1b4e;color:#a78bfa;border:1px solid #7c3aed;}
.custom-badge{background:#2d2010;color:#f59e0b;border:1px solid #d97706;}

/* Inline Threshold Editor */
.inline-threshold{
  display:flex;align-items:center;gap:10px;
  background: var(--gd-surface-1, #0f1419);
  border:1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-sm, 8px);
  padding:10px 12px;margin-bottom:12px;
  min-width: 0;
}
.ith-lead{font-size:1rem;color:var(--ion-color-medium);flex-shrink:0;}
.ith-label{font-size:11px;color:#9ca3af;white-space:nowrap;flex-shrink:0;}
.ith-slider{
  flex:1;appearance:none;-webkit-appearance:none;height:3px;border-radius:99px;
  background:linear-gradient(90deg,#f59e0b,#374151);outline:none;cursor:pointer;
}
.ith-slider::-webkit-slider-thumb{
  -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
  background:#f59e0b;cursor:pointer;box-shadow:0 0 6px #f59e0b;
}
.ith-value{
  font-size:12px;
  font-weight:700;
  color:#f59e0b;
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
.no-line-note a{color:var(--ion-color-primary);text-decoration:none;font-weight:600;}
.no-line-note a:hover{text-decoration:underline;}

.echart-container{height:250px;width:100%;}
.chart-loading{
  height:250px;width:100%;
  display:flex;align-items:center;justify-content:center;
  color:#6b7280;font-size:12px;
  background:#0f172a;border:1px dashed #1f2937;border-radius:10px;
}
.chartjs-wrapper{height:240px;position:relative;}

/* Funnel */
.funnel-container{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;position:relative;}
.funnel-step{display:flex;justify-content:space-between;align-items:center;padding:7px 14px;border-radius:6px;transition:all .3s;max-width:100%;}
.funnel-label{font-size:11px;font-weight:600;color:#0a0f1e;}
.funnel-value{font-size:11px;font-weight:700;color:#0a0f1e;font-family:'Fira Code',monospace;}
.funnel-pct{font-size:10px;color:rgba(10,15,30,.7);font-weight:600;}
.funnel-target-line{
  position:absolute;top:8px;bottom:8px;
  width:2px;border-left:2px dashed #f59e0b;
  pointer-events:none;transform:translateX(-50%);
}
.ftl-label{
  position:absolute;top:-20px;left:4px;
  font-size:10px;color:#f59e0b;font-weight:600;
  white-space:nowrap;background:#111827;padding:2px 6px;border-radius:4px;
}
.funnel-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:center;}
.funnel-leg-item{display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;}
.funnel-leg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}

@media(max-width:768px){
  .kpi-grid{grid-template-columns:repeat(2, minmax(0, 1fr));}
  .charts-row{grid-template-columns:1fr;}
  .inline-threshold{
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .ith-slider{flex: 1 1 100%;}
  .ith-value{min-width: 0; text-align: left;}
}

@media (max-width: 420px){
  .kpi-grid{grid-template-columns:1fr;}
}

@media (max-width: 1100px){
  .kpi-grid{grid-template-columns:repeat(3, minmax(0, 1fr));}
}
</style>
