<template>
  <ion-app>
    <ion-split-pane
      ref="splitPaneEl"
      content-id="main-content"
      when="(min-width: 992px)"
      class="app-split-pane"
      :style="{ '--app-side-width': sideWidthPx }"
    >
      <ion-menu content-id="main-content" class="app-menu">
        <ion-content>
          <!-- App Brand -->
          <div class="menu-brand">
            <div class="brand-mark" aria-hidden="true">
              <ion-icon :icon="appsOutline" />
            </div>
            <div class="brand-text">
              <div class="brand-name">GameDash</div>
              <div class="brand-sub">Analítica Comunitaria</div>
            </div>
          </div>

          <!-- Navigation de Paneles -->
          <ion-list id="dash-list">
            <ion-list-header>Panel de Tableros</ion-list-header>

            <ion-menu-toggle :auto-hide="false">
              <ion-item
                router-direction="root"
                router-link="/business-dashboard"
                lines="none" :detail="false" class="hydrated"
                :class="{ selected: currentPath === '/business-dashboard' }"
              >
                <ion-icon slot="start" :ios="barChartOutline" :md="barChartSharp" />
                <ion-label>Tablero Comercial</ion-label>
                <ion-badge slot="end" color="success" class="menu-badge">{{ businessKpis.length }} KPI</ion-badge>
              </ion-item>
            </ion-menu-toggle>

            <ion-menu-toggle :auto-hide="false">
              <ion-item
                router-direction="root"
                router-link="/technical-dashboard"
                lines="none" :detail="false" class="hydrated"
                :class="{ selected: currentPath === '/technical-dashboard' }"
              >
                <ion-icon slot="start" :ios="pulseOutline" :md="pulseSharp" />
                <ion-label>Tablero Técnico</ion-label>
                <ion-badge slot="end" color="warning" class="menu-badge">EN VIVO</ion-badge>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <!-- Navegación Panel KPI -->
          <ion-list id="kpi-list">
            <ion-list-header>Gestión de KPI</ion-list-header>

            <ion-menu-toggle :auto-hide="false">
              <ion-item
                router-direction="root"
                router-link="/kpi-panel"
                lines="none" :detail="false" class="hydrated"
                :class="{ selected: currentPath === '/kpi-panel' }"
              >
                <ion-icon slot="start" :ios="targetOutline" :md="targetSharp" />
                <ion-label>Configuración de KPI</ion-label>
                <ion-badge slot="end" class="menu-badge" :color="statusBadgeColor">
                  {{ onTrackCount }}/{{ totalKpis }}
                </ion-badge>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <!-- Mini KPI Status Summary -->
          <div class="menu-kpi-summary">
            <div class="mks-title">Estado de KPI</div>
            <div class="mks-bars">
              <div v-for="kpi in allKpis" :key="kpi.id" class="mks-row" @click="navigate('/kpi-panel')">
                <span class="mks-dot" :class="kpi.status" />
                <span class="mks-label">{{ kpi.shortLabel }}</span>
                <ion-icon
                  v-if="kpi.chartSupportsLine"
                  class="mks-pin"
                  :icon="pinOutline"
                  title="Umbral visible en el gráfico"
                />
              </div>
            </div>
            <div class="mks-note">
              <ion-icon :icon="pinOutline" class="mks-line-key" aria-hidden="true" />
              <span class="mks-note-text">Umbral visible en el gráfico</span>
            </div>
          </div>

          <!-- Library Legend -->
          <ion-list id="legend-list">
            <ion-list-header>Biblioteca de Gráficos</ion-list-header>
            <div class="lib-legend">
              <div class="lib-item"><span class="lib-dot apex"/>ApexCharts<span class="lib-count">3</span></div>
              <div class="lib-item"><span class="lib-dot echarts"/>ECharts<span class="lib-count">3</span></div>
              <div class="lib-item"><span class="lib-dot chartjs"/>Chart.js<span class="lib-count">2</span></div>
              <div class="lib-item"><span class="lib-dot custom"/>Personalizado<span class="lib-count">2</span></div>
            </div>
          </ion-list>
        </ion-content>

        <!-- Drag handle at menu edge (desktop split-pane only) -->
        <div
          class="sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="sideWidth"
          aria-label="Resize sidebar"
          @pointerdown="onResizePointerDown"
        />
      </ion-menu>

      <ion-router-outlet id="main-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp, IonContent, IonIcon, IonItem, IonLabel,
  IonList, IonListHeader, IonMenu, IonMenuToggle,
  IonRouterOutlet, IonSplitPane, IonBadge
} from '@ionic/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  barChartOutline, barChartSharp,
  pulseOutline, pulseSharp,
  analyticsOutline, analyticsSharp,
  appsOutline,
  pinOutline
} from 'ionicons/icons'
import { useKpiStore } from './composables/useKpiStore'

// Use target/bullseye icon fallback
const targetOutline = analyticsOutline
const targetSharp = analyticsSharp

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)

const store = useKpiStore()
const { allKpis, onTrackCount, businessKpis } = store

const totalKpis = computed(() => allKpis.value.length)
const statusBadgeColor = computed(() => {
  const denom = totalKpis.value || 1
  const pct = onTrackCount.value / denom
  if (pct >= 0.8) return 'success'
  if (pct >= 0.5) return 'warning'
  return 'danger'
})

function navigate(path: string) {
  router.push(path)
}

// ── Resizable sidebar (split-pane) ─────────────────────────────────────────────
const SIDEBAR_STORAGE_KEY = 'gamedash_sidebar_width_v1'
const sideWidth = ref<number>(320)
const sideWidthPx = computed(() => `${sideWidth.value}px`)
const splitPaneEl = ref<HTMLElement | null>(null)

const MIN_SIDE = 240
const MAX_SIDE = 520

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function loadSideWidth(): number {
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (!raw) return sideWidth.value
    const v = Number(raw)
    if (Number.isFinite(v)) return v
  } catch { /* ignore */ }
  return sideWidth.value
}

function saveSideWidth(v: number) {
  try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(v)) } catch { /* ignore */ }
}

let cleanupResizeListeners: null | (() => void) = null

function onResizePointerDown(e: PointerEvent) {
  // Only allow primary button/touch
  if (e.button !== 0) return
  const root = splitPaneEl.value
  if (!root) return

  const startX = e.clientX
  const startWidth = sideWidth.value

  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  document.body.classList.add('is-resizing-sidebar')

  const onMove = (ev: PointerEvent) => {
    const delta = ev.clientX - startX
    const next = clamp(startWidth + delta, MIN_SIDE, MAX_SIDE)
    sideWidth.value = next
  }
  const onUp = () => {
    document.body.classList.remove('is-resizing-sidebar')
    saveSideWidth(sideWidth.value)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    cleanupResizeListeners = null
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true, once: true })
  cleanupResizeListeners = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
}

onMounted(() => {
  sideWidth.value = clamp(loadSideWidth(), MIN_SIDE, MAX_SIDE)
})
onBeforeUnmount(() => cleanupResizeListeners?.())
</script>

<style scoped>
.app-split-pane{
  /* Ionic Split Pane uses --side-width for the menu column */
  position: relative;
  --side-width: var(--app-side-width, 320px);
  --side-max-width: var(--app-side-width, 320px);
}

.app-menu{
  /* Keep menu width in sync, and provide positioning context */
  --width: var(--app-side-width, 320px);
  position: relative;
}

.sidebar-resizer{
  position: absolute;
  top: 0;
  bottom: 0;
  right: -4px;
  width: 8px;
  cursor: col-resize;
  z-index: 1000;
  /* easier to grab, visually subtle */
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.05),
    transparent
  );
  opacity: 0;
  transition: opacity .15s;
}
.app-split-pane:hover .sidebar-resizer{ opacity: .9; }

/* During resize: prevent text selection and pointer weirdness */
:global(body.is-resizing-sidebar){
  user-select: none;
  cursor: col-resize !important;
}

/* Resizer should not appear when split-pane is collapsed (mobile) */
@media (max-width: 991px){
  .sidebar-resizer{ display:none; }
}

.menu-brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 16px 12px;
  border-bottom: 1px solid var(--ion-background-color-step-150, #1f2937);
}
.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--gd-radius-sm, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  color: var(--ion-color-primary);
  flex-shrink: 0;
}
.brand-mark ion-icon { font-size: 22px; }
.brand-name { font-size: 16px; font-weight: 650; color: var(--ion-text-color); letter-spacing: 0.02em; }
.brand-sub { font-size: 11px; color: var(--ion-color-medium); }

.menu-badge { font-size: 10px; }

/* KPI Summary in Menu */
.menu-kpi-summary {
  margin: 4px 8px 4px;
  background: var(--gd-surface-2, #121a28);
  border-radius: var(--gd-radius-sm, 8px);
  padding: 10px 12px;
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.mks-title { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
.mks-bars { display: flex; flex-direction: column; gap: 5px; }
.mks-row {
  display: flex; align-items: center; gap: 7px;
  cursor: pointer; border-radius: 4px; padding: 2px 4px;
  transition: background .15s;
}
.mks-row:hover { background: rgba(255,255,255,.05); }
.mks-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.mks-dot.ok   { background: #10b981; }
.mks-dot.risk { background: #f59e0b; }
.mks-dot.bad  { background: #ef4444; }
.mks-label { font-size: 11px; color: #9ca3af; flex: 1; line-height: 1.2; }
.mks-pin { font-size: 12px; color: var(--ion-color-primary); flex-shrink: 0; opacity: 0.85; }
.mks-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #6b7280;
  margin-top: 8px;
}
.mks-line-key { font-size: 12px; color: var(--ion-color-medium); flex-shrink: 0; }
.mks-note-text { line-height: 1.3; }

/* Library Legend */
#legend-list { padding-bottom: 20px; }
.lib-legend { padding: 4px 16px 8px; }
.lib-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; color: var(--ion-color-medium); }
.lib-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.lib-dot.apex    { background: #60a5fa; }
.lib-dot.echarts { background: #10b981; }
.lib-dot.chartjs { background: #a78bfa; }
.lib-dot.custom  { background: #f59e0b; }
.lib-count { margin-left: auto; font-size: 10px; opacity: .7; }

/* Ionic menu styles */
ion-menu ion-content { --background: var(--ion-item-background, var(--ion-background-color, #fff)); }
ion-menu.md ion-content { --padding-start: 8px; --padding-end: 8px; --padding-top: 0; --padding-bottom: 20px; }
ion-menu.md ion-list { padding: 12px 0; }
ion-menu.md ion-list-header {
  font-size: 11px; font-weight: 600; padding-left: 10px;
  min-height: 26px; color: #6b7280; margin-bottom: 2px;
  text-transform: uppercase; letter-spacing: .06em;
}
ion-menu.md ion-item { --padding-start: 10px; --padding-end: 10px; border-radius: var(--gd-radius-sm, 8px); margin: 2px 4px; }
ion-menu.md ion-item.selected { --background: rgba(var(--ion-color-primary-rgb), .12); }
ion-menu.md ion-item.selected ion-icon { color: var(--ion-color-primary); }
ion-menu.md ion-item ion-icon { color: #616e7e; }
ion-menu.md ion-item ion-label { font-weight: 500; pointer-events: none; }
ion-menu.md ion-item ion-badge { pointer-events: none; }
ion-item.selected { --color: var(--ion-color-primary); }
</style>