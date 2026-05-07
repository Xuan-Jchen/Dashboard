<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="kp-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title class="kp-title">
          <span class="kp-title-inner">
            <ion-icon :icon="optionsOutline" class="kp-title-icon" aria-hidden="true" />
            Configuración de KPI
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="toolbar-action" @click="openAddKpi">
            <ion-icon :icon="addOutline" slot="start" />
            Añadir KPI
          </ion-button>
          <ion-button fill="clear" class="reset-all-btn" @click="confirmResetAll">
            <ion-icon :icon="refreshOutline" slot="start" />
            Restablecer todo
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="kp-content">
      <div class="page-shell">

      <ion-modal :is-open="addOpen" @didDismiss="addOpen = false">
        <ion-header>
          <ion-toolbar class="kp-toolbar">
            <ion-title class="kp-title">
              <span class="kp-title-inner">
                <ion-icon :icon="addOutline" class="kp-title-icon" aria-hidden="true" />
                Nuevo KPI
              </span>
            </ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="addOpen = false">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="kp-content">
          <div class="add-form">
            <div class="add-section">
              <div class="add-title">1) Panel</div>
              <ion-item class="add-item" lines="none">
                <ion-label>Dashboard</ion-label>
                <ion-select v-model="addDashboard" interface="popover">
                  <ion-select-option value="business">Business</ion-select-option>
                  <ion-select-option value="technical">Technical</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <div class="add-section">
              <div class="add-title">2) Gráfico</div>
              <ion-item class="add-item" lines="none">
                <ion-label>Chart</ion-label>
                <ion-select v-model="addChartId" interface="popover">
                  <ion-select-option
                    v-for="c in availableCharts"
                    :key="c.id"
                    :value="c.id"
                  >{{ c.label }}</ion-select-option>
                </ion-select>
              </ion-item>
              <div class="add-hint">Esto define dónde se mostrará la referencia del objetivo (si el gráfico lo admite).</div>
            </div>

            <div class="add-section">
              <div class="add-title">3) KPI + Objetivo</div>
              <ion-item class="add-item" lines="none">
                <ion-label position="stacked">Nombre</ion-label>
                <ion-input v-model="addLabel" placeholder="Ej. Conversión D7" />
              </ion-item>
              <ion-item class="add-item" lines="none">
                <ion-label position="stacked">Icono (emoji opcional)</ion-label>
                <ion-input v-model="addIcon" placeholder="Ej. 🎯" />
              </ion-item>
              <div class="add-grid">
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Unidad</ion-label>
                  <ion-input v-model="addUnit" placeholder="%" />
                </ion-item>
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Prefijo</ion-label>
                  <ion-input v-model="addUnitPrefix" placeholder="€" />
                </ion-item>
              </div>
              <div class="add-grid">
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Min</ion-label>
                  <ion-input v-model="addMin" type="number" />
                </ion-item>
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Max</ion-label>
                  <ion-input v-model="addMax" type="number" />
                </ion-item>
              </div>
              <div class="add-grid">
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Objetivo</ion-label>
                  <ion-input v-model="addTarget" type="number" />
                </ion-item>
                <ion-item class="add-item" lines="none">
                  <ion-label position="stacked">Mejor si sube</ion-label>
                  <ion-select v-model="addHigher" interface="popover">
                    <ion-select-option :value="true">Sí</ion-select-option>
                    <ion-select-option :value="false">No</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
              <ion-item class="add-item" lines="none">
                <ion-label position="stacked">Descripción (opcional)</ion-label>
                <ion-input v-model="addDescription" />
              </ion-item>
            </div>

            <div class="add-actions">
              <ion-button expand="block" :disabled="!canCreate" @click="createKpi">Crear KPI</ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- ── Summary Banner ─────────────────────────────────────────────── -->
      <div class="summary-banner">
        <div class="summary-card ok">
          <ion-icon :icon="checkmarkCircleOutline" class="summary-ico" aria-hidden="true" />
          <div class="summary-num">{{ onTrackCount }}</div>
          <div class="summary-label">En Objetivo</div>
        </div>
        <div class="summary-card risk">
          <ion-icon :icon="alertCircleOutline" class="summary-ico" aria-hidden="true" />
          <div class="summary-num">{{ atRiskCount }}</div>
          <div class="summary-label">En Riesgo</div>
        </div>
        <div class="summary-card bad">
          <ion-icon :icon="closeCircleOutline" class="summary-ico" aria-hidden="true" />
          <div class="summary-num">{{ offTrackCount }}</div>
          <div class="summary-label">Fuera de Objetivo</div>
        </div>
        <div class="summary-card neutral">
          <ion-icon :icon="layersOutline" class="summary-ico" aria-hidden="true" />
          <div class="summary-num">{{ allKpis.length }}</div>
          <div class="summary-label">KPIs totales</div>
        </div>
        <!-- Radial progress ring -->
        <div class="summary-ring-wrap">
          <svg viewBox="0 0 80 80" class="summary-ring">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#1f2937" stroke-width="7" />
            <circle
              cx="40" cy="40" r="32"
              fill="none"
              :stroke="ringColor"
              stroke-width="7"
              stroke-linecap="round"
              :stroke-dasharray="ringDash"
              stroke-dashoffset="50"
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="36" text-anchor="middle" font-size="12" font-weight="700" :fill="ringColor">
              {{ Math.round((onTrackCount / (allKpis.length || 1)) * 100) }}%
            </text>
            <text x="40" y="50" text-anchor="middle" font-size="8" fill="#6b7280">
              objetivo
            </text>
          </svg>
        </div>
      </div>

      <!-- ── Legend bar ──────────────────────────────────────────────────── -->
      <div class="legend-bar">
        <span class="legend-item">
          <span class="leg-dot" style="background:#10b981" /> En Objetivo: el valor actual iguala o supera el objetivo
        </span>
        <span class="legend-item">
          <span class="leg-dot" style="background:#f59e0b" /> En Riesgo: dentro del 15% del objetivo
        </span>
        <span class="legend-item">
          <span class="leg-dot" style="background:#ef4444" /> Fuera de Objetivo: objetivo perdido en >15%
        </span>
        <span class="legend-item">
          <span class="leg-dot leg-dot--line" /> Línea de referencia visible en el gráfico
        </span>
      </div>

      <!-- ── SMART Objectives (derived from KPIs) ────────────────────────── -->
      <section class="smart-wrap" aria-label="Objetivos SMART">
        <div class="smart-wrap__head">
          <div class="smart-wrap__title">Objetivos SMART</div>
          <div class="smart-wrap__hint">Se generan automáticamente desde los KPIs y sus objetivos actuales.</div>
        </div>

        <div class="smart-cards">
          <section v-for="card in smartCards" :key="card.id" class="smart-card" :aria-label="card.title">
            <div class="smart-head">
              <div class="smart-check" aria-hidden="true">✓</div>
              <div class="smart-title-wrap">
                <div class="smart-title">{{ card.title }}</div>
                <div class="smart-goal">“{{ card.goal }}”.</div>
              </div>
            </div>
            <div class="smart-grid">
              <div v-for="item in card.items" :key="item.letter" class="smart-item">
                <div class="smart-letter">{{ item.letter }}</div>
                <div class="smart-text">
                  <div class="smart-k">{{ item.k }}</div>
                  <div class="smart-v">{{ item.v }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <div class="view-toggle">
        <ion-segment v-model="viewMode">
          <ion-segment-button value="full">
            <ion-label>Completo</ion-label>
          </ion-segment-button>
          <ion-segment-button value="compact">
            <ion-label>Compacto</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <details class="restore-panel" :open="hiddenKpis.length > 0">
        <summary class="restore-summary">
          KPIs eliminados/ocultos ({{ hiddenKpis.length }})
        </summary>
        <div v-if="hiddenKpis.length === 0" class="restore-empty">No hay KPIs eliminados.</div>
        <div v-else class="restore-list">
          <div v-for="kpi in hiddenKpis" :key="kpi.id" class="restore-row">
            <div v-if="kpi.icon" class="restore-ico" aria-hidden="true">{{ kpi.icon }}</div>
            <div class="restore-main">
              <div class="restore-title">{{ kpi.label }}</div>
              <div class="restore-sub">
                <span class="restore-tag">{{ kpi.dashboard }}</span>
                <span class="restore-meta">Objetivo por defecto: {{ kpi.unitPrefix }}{{ formatTarget(kpi.defaultTarget, kpi) }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}</span>
              </div>
            </div>
            <ion-button fill="clear" class="restore-btn" @click="store.unhideKpi(kpi.id)">
              Restaurar
            </ion-button>
          </div>
        </div>
      </details>

      <!-- ── Business KPIs ──────────────────────────────────────────────── -->
      <div class="section-header">
        <ion-icon :icon="barChartOutline" class="section-lead" aria-hidden="true" />
        <h2 class="section-title">KPIs Comerciales</h2>
        <span class="section-badge">{{ businessKpis.length }} indicadores</span>
        <div class="section-line" />
      </div>

      <div v-if="viewMode === 'full'" class="kpi-cards-grid">
        <div
          v-for="kpi in businessKpis"
          :key="kpi.id"
          class="kpi-edit-card"
          :class="kpi.status"
        >
          <!-- Card Top -->
          <div class="kec-top" :class="{ 'kec-top--noicon': !kpi.icon }">
            <div
              v-if="kpi.icon"
              class="kec-icon-wrap"
              :style="{ background: kpi.color + '22', borderColor: kpi.color + '55' }"
            >
              <span class="kec-icon">{{ kpi.icon }}</span>
            </div>
            <div class="kec-meta">
              <div class="kec-label">{{ kpi.label }}</div>
              <div class="kec-dashboard-badge business">Comercial</div>
            </div>
            <div class="kec-top-end">
              <ion-button
              v-if="!kpi.locked"
                fill="clear"
                color="danger"
                size="small"
                class="kec-delete"
                aria-label="Eliminar KPI"
                @click="confirmDeleteKpi(kpi)"
              >
                <ion-icon slot="icon-only" :icon="trashOutline" />
              </ion-button>
              <div class="kec-status-badge" :class="kpi.status">
                {{ kpi.status === 'ok' ? 'En objetivo' : kpi.status === 'risk' ? 'En riesgo' : 'Fuera de objetivo' }}
              </div>
            </div>
          </div>

          <!-- Values Row -->
          <div class="kec-values-row">
            <div class="kec-val-block">
              <div class="kec-val-label">Actual</div>
              <div class="kec-val" :style="{ color: kpi.color }">{{ kpi.currentDisplay }}</div>
            </div>
            <div class="kec-arrow" :class="kpi.status">
              {{ kpi.higherIsBetter
                ? (kpi.currentValue >= kpi.target ? '≥' : '<')
                : (kpi.currentValue <= kpi.target ? '≤' : '>') }}
            </div>
            <div class="kec-val-block">
              <div class="kec-val-label">Objetivo</div>
              <div class="kec-val target-val">
                {{ kpi.unitPrefix }}{{ formatTarget(kpi.target, kpi) }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="kec-progress-wrap">
            <div
              class="kec-progress-fill"
              :style="{
                width: progressPct(kpi) + '%',
                background: statusColor(kpi.status)
              }"
            />
            <div
              class="kec-progress-target"
              :style="{ left: '100%', borderColor: kpi.color }"
              title="Objetivo"
            />
          </div>
          <div class="kec-progress-labels">
            <span>{{ kpi.higherIsBetter ? '0' : kpi.max + ' ' + kpi.unit }}</span>
            <span>{{ progressPct(kpi).toFixed(0) }}% del objetivo</span>
            <span>{{ kpi.higherIsBetter ? (kpi.max + ' ' + kpi.unit) : '0' }}</span>
          </div>

          <!-- Chart Support Notice -->
          <div class="kec-chart-ref" :class="kpi.chartSupportsLine ? 'supported' : 'unsupported'">
            <span class="ref-dot" :class="kpi.chartSupportsLine ? 'on' : 'off'" />
            <span class="ref-text">{{ kpi.chartLabel }}</span>
          </div>

          <!-- Slider Editor -->
          <div class="kec-editor">
            <div class="kec-editor-label">
              <span>Objetivo</span>
              <div class="editor-actions">
                <button
                  type="button"
                  class="reset-btn reset-btn--danger"
                  :disabled="!store.hasOverride(kpi.id)"
                  @click="store.clearTarget(kpi.id)"
                  title="Eliminar objetivo guardado (volver al valor por defecto)"
                >
                  <ion-icon :icon="trashOutline" class="reset-btn__icon" aria-hidden="true" />
                  Eliminar objetivo
                </button>
                <button
                  v-if="!kpi.locked"
                  type="button"
                  class="reset-btn reset-btn--danger"
                  @click="confirmDeleteKpi(kpi)"
                  title="Eliminar KPI"
                >
                  <ion-icon :icon="trashOutline" class="reset-btn__icon" aria-hidden="true" />
                  Eliminar KPI
                </button>
                <button type="button" class="reset-btn" @click="store.resetOne(kpi.id)" title="Volver al objetivo por defecto">
                  <ion-icon :icon="refreshOutline" class="reset-btn__icon" aria-hidden="true" />
                  Restablecer
                </button>
              </div>
            </div>
            <div class="kec-slider-row">
              <span class="slider-min">{{ kpi.unitPrefix }}{{ kpi.min }}</span>
              <input
                type="range"
                class="kec-slider"
                :min="kpi.min"
                :max="kpi.max"
                :step="kpi.step"
                :value="kpi.target"
                :style="{ '--thumb-color': kpi.color }"
                @input="(e) => store.setTarget(kpi.id, Number((e.target as HTMLInputElement).value))"
              />
              <span class="slider-max">{{ kpi.unitPrefix }}{{ kpi.max }}</span>
              <input
                type="number"
                class="kec-number"
                :min="kpi.min"
                :max="kpi.max"
                :step="kpi.step"
                :value="kpi.target"
                @change="(e) => store.setTarget(kpi.id, clamp(Number((e.target as HTMLInputElement).value), kpi.min, kpi.max))"
              />
              <span class="number-unit">{{ kpi.unit }}</span>
            </div>
          </div>

          <!-- Description -->
          <div class="kec-description">{{ kpi.description }}</div>
        </div>
      </div>

      <div v-else class="compact-list">
        <div v-for="kpi in businessKpis" :key="kpi.id" class="compact-row">
          <div v-if="kpi.icon" class="compact-ico" aria-hidden="true">{{ kpi.icon }}</div>
          <div class="compact-main">
            <div class="compact-title">{{ kpi.label }}</div>
            <div class="compact-sub">
              <span class="compact-chip" :class="kpi.status">{{ kpi.status }}</span>
              <span class="compact-meta">Objetivo: {{ kpi.unitPrefix }}{{ formatTarget(kpi.target, kpi) }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}</span>
            </div>
          </div>
          <ion-button
            fill="clear"
            color="danger"
            class="compact-del"
            aria-label="Eliminar KPI"
            @click="confirmDeleteKpi(kpi)"
          >
            <ion-icon slot="icon-only" :icon="trashOutline" />
          </ion-button>
        </div>
      </div>

      <!-- ── Technical KPIs ─────────────────────────────────────────────── -->
      <div class="section-header section-header--spaced">
        <ion-icon :icon="hardwareChipOutline" class="section-lead" aria-hidden="true" />
        <h2 class="section-title">KPIs Técnicos</h2>
        <span class="section-badge">{{ technicalKpis.length }} indicadores</span>
        <div class="section-line" />
      </div>

      <div v-if="viewMode === 'full'" class="kpi-cards-grid">
        <div
          v-for="kpi in technicalKpis"
          :key="kpi.id"
          class="kpi-edit-card"
          :class="kpi.status"
        >
          <!-- Card Top -->
          <div class="kec-top" :class="{ 'kec-top--noicon': !kpi.icon }">
            <div
              v-if="kpi.icon"
              class="kec-icon-wrap"
              :style="{ background: kpi.color + '22', borderColor: kpi.color + '55' }"
            >
              <span class="kec-icon">{{ kpi.icon }}</span>
            </div>
            <div class="kec-meta">
              <div class="kec-label">{{ kpi.label }}</div>
              <div class="kec-dashboard-badge technical">Técnico</div>
            </div>
            <div class="kec-top-end">
              <ion-button
              v-if="!kpi.locked"
                fill="clear"
                color="danger"
                size="small"
                class="kec-delete"
                aria-label="Eliminar KPI"
                @click="confirmDeleteKpi(kpi)"
              >
                <ion-icon slot="icon-only" :icon="trashOutline" />
              </ion-button>
              <div class="kec-status-badge" :class="kpi.status">
                {{ kpi.status === 'ok' ? 'En objetivo' : kpi.status === 'risk' ? 'En riesgo' : 'Fuera de objetivo' }}
              </div>
            </div>
          </div>

          <!-- Values Row -->
          <div class="kec-values-row">
            <div class="kec-val-block">
              <div class="kec-val-label">Actual</div>
              <div class="kec-val" :style="{ color: kpi.color }">{{ kpi.currentDisplay }}</div>
            </div>
            <div class="kec-arrow" :class="kpi.status">
              {{ kpi.higherIsBetter
                ? (kpi.currentValue >= kpi.target ? '≥' : '<')
                : (kpi.currentValue <= kpi.target ? '≤' : '>') }}
            </div>
            <div class="kec-val-block">
              <div class="kec-val-label">Objetivo</div>
              <div class="kec-val target-val">
                {{ kpi.unitPrefix }}{{ formatTarget(kpi.target, kpi) }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="kec-progress-wrap">
            <div
              class="kec-progress-fill"
              :style="{
                width: progressPct(kpi) + '%',
                background: statusColor(kpi.status)
              }"
            />
          </div>
          <div class="kec-progress-labels">
            <span>{{ kpi.higherIsBetter ? '0' : kpi.max + ' ' + kpi.unit }}</span>
            <span>{{ progressPct(kpi).toFixed(0) }}% del objetivo</span>
            <span>{{ kpi.higherIsBetter ? (kpi.max + ' ' + kpi.unit) : '0' }}</span>
          </div>

          <!-- Chart Support Notice -->
          <div class="kec-chart-ref" :class="kpi.chartSupportsLine ? 'supported' : 'unsupported'">
            <span class="ref-dot" :class="kpi.chartSupportsLine ? 'on' : 'off'" />
            <span class="ref-text">{{ kpi.chartLabel }}</span>
          </div>

          <!-- Slider Editor -->
          <div class="kec-editor">
            <div class="kec-editor-label">
              <span>Objetivo</span>
              <div class="editor-actions">
                <button
                  type="button"
                  class="reset-btn reset-btn--danger"
                  :disabled="!store.hasOverride(kpi.id)"
                  @click="store.clearTarget(kpi.id)"
                  title="Eliminar objetivo guardado (volver al valor por defecto)"
                >
                  <ion-icon :icon="trashOutline" class="reset-btn__icon" aria-hidden="true" />
                  Eliminar objetivo
                </button>
                <button
                  v-if="!kpi.locked"
                  type="button"
                  class="reset-btn reset-btn--danger"
                  @click="confirmDeleteKpi(kpi)"
                  title="Eliminar KPI"
                >
                  <ion-icon :icon="trashOutline" class="reset-btn__icon" aria-hidden="true" />
                  Eliminar KPI
                </button>
                <button type="button" class="reset-btn" @click="store.resetOne(kpi.id)" title="Volver al objetivo por defecto">
                  <ion-icon :icon="refreshOutline" class="reset-btn__icon" aria-hidden="true" />
                  Restablecer
                </button>
              </div>
            </div>
            <div class="kec-slider-row">
              <span class="slider-min">{{ kpi.unitPrefix }}{{ kpi.min }}</span>
              <input
                type="range"
                class="kec-slider"
                :min="kpi.min"
                :max="kpi.max"
                :step="kpi.step"
                :value="kpi.target"
                :style="{ '--thumb-color': kpi.color }"
                @input="(e) => store.setTarget(kpi.id, Number((e.target as HTMLInputElement).value))"
              />
              <span class="slider-max">{{ kpi.unitPrefix }}{{ kpi.max }}</span>
              <input
                type="number"
                class="kec-number"
                :min="kpi.min"
                :max="kpi.max"
                :step="kpi.step"
                :value="kpi.target"
                @change="(e) => store.setTarget(kpi.id, clamp(Number((e.target as HTMLInputElement).value), kpi.min, kpi.max))"
              />
              <span class="number-unit">{{ kpi.unit }}</span>
            </div>
          </div>

          <!-- Description -->
          <div class="kec-description">{{ kpi.description }}</div>
        </div>
      </div>

      <div v-else class="compact-list">
        <div v-for="kpi in technicalKpis" :key="kpi.id" class="compact-row">
          <div v-if="kpi.icon" class="compact-ico" aria-hidden="true">{{ kpi.icon }}</div>
          <div class="compact-main">
            <div class="compact-title">{{ kpi.label }}</div>
            <div class="compact-sub">
              <span class="compact-chip" :class="kpi.status">{{ kpi.status }}</span>
              <span class="compact-meta">Objetivo: {{ kpi.unitPrefix }}{{ formatTarget(kpi.target, kpi) }}{{ kpi.unitPrefix ? '' : ' ' + kpi.unit }}</span>
            </div>
          </div>
          <ion-button
            fill="clear"
            color="danger"
            class="compact-del"
            aria-label="Eliminar KPI"
            @click="confirmDeleteKpi(kpi)"
          >
            <ion-icon slot="icon-only" :icon="trashOutline" />
          </ion-button>
        </div>
      </div>

      <div class="footer-note">
        Los cambios se guardan automáticamente y se reflejan en tiempo real en los tableros Comercial y Técnico.
      </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonButton, IonIcon, IonModal, IonItem, IonLabel,
  IonSelect, IonSelectOption, IonInput, IonSegment, IonSegmentButton,
  alertController
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import {
  refreshOutline,
  optionsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeCircleOutline,
  layersOutline,
  barChartOutline,
  hardwareChipOutline,
  addOutline,
  trashOutline
} from 'ionicons/icons'
import { useKpiStore, type KpiDefinition, type NewKpiInput, CHART_OPTIONS } from '../composables/useKpiStore'

const store = useKpiStore()
const {
  allKpis, businessKpis, technicalKpis, onTrackCount, atRiskCount, offTrackCount,
  addCustomKpi, deleteKpi
} = store
const { hiddenKpis } = store

// ── Computed ring ────────────────────────────────────────────────────────────
const ringColor = computed(() => {
  const denom = allKpis.value.length || 1
  const pct = onTrackCount.value / denom
  if (pct >= 0.8) return '#10b981'
  if (pct >= 0.5) return '#f59e0b'
  return '#ef4444'
})

const ringDash = computed(() => {
  const circumference = 2 * Math.PI * 32
  const denom = allKpis.value.length || 1
  const pct = onTrackCount.value / denom
  return `${circumference * pct} ${circumference * (1 - pct)}`
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTarget(v: number, kpi: KpiDefinition): string {
  if (kpi.unit === 'users') return v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
  if (kpi.step < 1) return v.toFixed(2)
  return String(v)
}

function progressPct(kpi: typeof allKpis.value[0]): number {
  const current = kpi.currentValue
  const target = kpi.target
  if (!Number.isFinite(target) || target === 0 || !Number.isFinite(current)) return 0
  if (kpi.higherIsBetter) {
    return Math.min((current / target) * 100, 120)
  } else {
    // Lower is better: progress = how well we're doing vs target
    return Math.min((target / current) * 100, 120)
  }
}

function statusColor(status: string): string {
  if (status === 'ok') return '#10b981'
  if (status === 'risk') return '#f59e0b'
  return '#ef4444'
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

async function openAddKpi() {
  addOpen.value = true
}

const addOpen = ref(false)
const viewMode = ref<'full' | 'compact'>('full')
const addDashboard = ref<'business' | 'technical'>('business')
const addChartId = ref<string>(CHART_OPTIONS.find((c) => c.dashboard === 'business')?.id || CHART_OPTIONS[0]?.id || '')
const addLabel = ref('')
const addIcon = ref('')
const addUnit = ref('%')
const addUnitPrefix = ref('')
const addMin = ref<number | string>(0)
const addMax = ref<number | string>(100)
const addTarget = ref<number | string>(50)
const addHigher = ref(true)
const addDescription = ref('')

const availableCharts = computed(() => CHART_OPTIONS.filter((c) => c.dashboard === addDashboard.value))

watch(addDashboard, () => {
  const first = availableCharts.value[0]
  if (first) addChartId.value = first.id
})

const canCreate = computed(() => {
  if (!addLabel.value.trim()) return false
  if (!addChartId.value) return false
  const min = Number(addMin.value)
  const max = Number(addMax.value)
  const target = Number(addTarget.value)
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(target)) return false
  return min < max
})

// ── SMART objectives derived from the project's KPIs ─────────────────────────
function kpiById(id: string) {
  return allKpis.value.find((k) => k.id === id)
}

function fmt(v: number, unit = '', unitPrefix = ''): string {
  if (!Number.isFinite(v)) return '—'
  const n = Math.abs(v) < 1 && v !== 0 ? v.toFixed(2) : (Number.isInteger(v) ? String(v) : String(v))
  const core = `${unitPrefix || ''}${n}`
  return unitPrefix ? core : `${core}${unit ? ' ' + unit : ''}`.trim()
}

type SmartItem = { letter: 'S' | 'M' | 'A' | 'R' | 'T'; k: string; v: string }
type SmartCard = { id: string; title: string; goal: string; items: SmartItem[] }

function measurableFrom(ids: string[]): string[] {
  return ids
    .map((id) => kpiById(id))
    .filter(Boolean)
    .map((k: any) => {
      const op = k.higherIsBetter ? '≥' : '≤'
      const name = (k.shortLabel || k.label || k.id) as string
      return `${name} ${op} ${fmt(k.target, k.unit, k.unitPrefix)}`
    })
}

const smartCards = computed<SmartCard[]>(() => {
  // Business
  const bizIds = ['b1_mau', 'b2_retention', 'b3_arpu', 'b4_top_game', 'b5_nps']
  const bizM = measurableFrom(bizIds)
  const bizGoal = bizM.length
    ? `En los próximos 12 meses, impulsar crecimiento y monetización cumpliendo: ${bizM.join(', ')}`
    : 'En los próximos 12 meses, impulsar los KPIs clave del negocio.'

  // Reliability / SLO-ish
  const relIds = ['t1_latency', 't2_uptime', 't3_error']
  const relM = measurableFrom(relIds)
  const relGoal = relM.length
    ? `En los próximos 12 meses, mantener la calidad del servicio cumpliendo: ${relM.join(', ')}`
    : 'En los próximos 12 meses, mantener la calidad del servicio.'

  // Infra efficiency
  const infraIds = ['t4_db', 't5_memory']
  const infraM = measurableFrom(infraIds)
  const infraGoal = infraM.length
    ? `En los próximos 12 meses, optimizar infraestructura y rendimiento cumpliendo: ${infraM.join(', ')}`
    : 'En los próximos 12 meses, optimizar infraestructura y rendimiento.'

  return [
    {
      id: 'smart_business',
      title: 'SMART • Crecimiento (Negocio)',
      goal: bizGoal,
      items: [
        { letter: 'S', k: 'Específico', v: 'Mejorar adquisición, retención, engagement y monetización (KPIs comerciales).' },
        { letter: 'M', k: 'Medible', v: bizM.length ? bizM.join(' · ') : 'Objetivos cuantificados por KPI comercial.' },
        { letter: 'A', k: 'Alcanzable', v: 'Los objetivos se ajustan con sliders y se validan con referencias visuales en gráficos.' },
        { letter: 'R', k: 'Relevante', v: 'Impacta directamente en uso del producto y generación de ingresos.' },
        { letter: 'T', k: 'Temporal', v: 'Horizonte: 12 meses (seguimiento continuo en el tablero comercial).' },
      ],
    },
    {
      id: 'smart_reliability',
      title: 'SMART • Estabilidad (SLO)',
      goal: relGoal,
      items: [
        { letter: 'S', k: 'Específico', v: 'Reducir latencia, errores y asegurar alta disponibilidad (KPIs técnicos).' },
        { letter: 'M', k: 'Medible', v: relM.length ? relM.join(' · ') : 'Objetivos cuantificados por KPI de estabilidad.' },
        { letter: 'A', k: 'Alcanzable', v: 'Con alertas/umbrales en tiempo real y ajustes centralizados del objetivo.' },
        { letter: 'R', k: 'Relevante', v: 'Protege la experiencia del usuario y reduce incidentes operativos.' },
        { letter: 'T', k: 'Temporal', v: 'Horizonte: 12 meses (monitoreo permanente en el tablero técnico).' },
      ],
    },
    {
      id: 'smart_infra',
      title: 'SMART • Eficiencia (Infra/DB)',
      goal: infraGoal,
      items: [
        { letter: 'S', k: 'Específico', v: 'Optimizar el rendimiento de DB y el consumo de recursos (memoria).' },
        { letter: 'M', k: 'Medible', v: infraM.length ? infraM.join(' · ') : 'Objetivos cuantificados por KPI de rendimiento.' },
        { letter: 'A', k: 'Alcanzable', v: 'Priorización por visualizaciones (treemap/correlaciones) y ajuste de objetivos por KPI.' },
        { letter: 'R', k: 'Relevante', v: 'Reduce costos, mejora escalabilidad y evita degradaciones por saturación.' },
        { letter: 'T', k: 'Temporal', v: 'Horizonte: 12 meses (revisión periódica con base en tendencias).' },
      ],
    },
  ]
})

function createKpi() {
  if (!canCreate.value) return
  const chart = CHART_OPTIONS.find((c) => c.id === addChartId.value)
  const min = Number(addMin.value)
  const max = Number(addMax.value)
  const target = Number(addTarget.value)

  const body: NewKpiInput = {
    label: addLabel.value.trim(),
    shortLabel: addLabel.value.trim().slice(0, 28),
    dashboard: addDashboard.value,
    icon: addIcon.value.trim() || undefined,
    unit: addUnit.value.trim() || '%',
    unitPrefix: addUnitPrefix.value.trim(),
    currentValue: target,
    defaultTarget: target,
    min,
    max,
    step: 1,
    higherIsBetter: addHigher.value,
    chartId: chart?.id ?? null,
    chartSupportsLine: chart?.supportsLine ?? false,
    chartLabel: chart?.label ?? 'KPI personalizado',
    description: addDescription.value.trim() || undefined,
  }
  addCustomKpi(body)
  addOpen.value = false
  addLabel.value = ''
  addIcon.value = ''
  addDescription.value = ''
}

async function confirmDeleteKpi(kpi: KpiDefinition) {
  const alert = await alertController.create({
    header: '¿Eliminar KPI?',
    message: `Se eliminará «${kpi.label}». Esta acción no se puede deshacer.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          // Built-ins are hidden; customs are removed.
          deleteKpi(kpi.id)
        }
      }
    ]
  })
  await alert.present()
}

async function confirmResetAll() {
  const alert = await alertController.create({
    header: '¿Restablecer todos los objetivos?',
    message: 'Esto restaurará todos los objetivos de KPI a sus valores predeterminados.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Restablecer todo',
        role: 'destructive',
        handler: () => store.resetAll()
      }
    ]
  })
  await alert.present()
}
</script>

<style scoped>
.page-shell {
  max-width: var(--gd-page-max, 1280px);
  margin: 0 auto;
  padding: 0 16px 24px;
  box-sizing: border-box;
}
/* ── Toolbar ── */
.kp-toolbar {
  --background: var(--gd-surface-0, #0a0f1e);
  border-bottom: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.kp-title { color: var(--ion-text-color); font-weight: 650; font-size: 1rem; letter-spacing: 0.02em; }
.kp-title-inner { display: inline-flex; align-items: center; gap: 10px; }
.kp-title-icon { font-size: 1.15rem; color: var(--ion-color-primary); }
.reset-all-btn { --color: #9ca3af; font-size: 12px; }
.kp-content { --background: var(--gd-surface-0, #0a0f1e); }

/* ── Summary Banner ── */
.summary-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 0;
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-lg, 16px);
  margin-top: 16px;
  padding-left: 16px;
  padding-right: 16px;
}
.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--gd-surface-1, #0f1419);
  border-radius: var(--gd-radius-md, 12px);
  padding: 12px 16px;
  position: relative;
  min-width: 92px;
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.summary-card.ok { border-top: 2px solid #10b981; }
.summary-card.risk { border-top: 2px solid #f59e0b; }
.summary-card.bad { border-top: 2px solid #ef4444; }
.summary-card.neutral { border-top: 2px solid #6b7280; }
.summary-ico {
  font-size: 18px;
  margin-bottom: 6px;
  opacity: 0.9;
}
.summary-card.ok .summary-ico { color: #10b981; }
.summary-card.risk .summary-ico { color: #f59e0b; }
.summary-card.bad .summary-ico { color: #ef4444; }
.summary-card.neutral .summary-ico { color: #9ca3af; }
.summary-num { font-size: 26px; font-weight: 700; color: #f9fafb; font-family: ui-monospace, 'Cascadia Code', monospace; }
.summary-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }
.summary-ring-wrap { margin-left: auto; }
.summary-ring { width: 80px; height: 80px; }

/* ── Legend Bar ── */
.legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 0;
  margin-top: 12px;
  background: transparent;
  border-bottom: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #9ca3af;
}
.leg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.leg-dot--line {
  border-radius: 3px;
  background: var(--ion-color-primary);
}

/* ── SMART Card ── */
.smart-wrap{ margin-top: 14px; }
.smart-wrap__head{
  display:flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.smart-wrap__title{
  font-size: 12px;
  font-weight: 850;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #c7d2fe;
}
.smart-wrap__hint{
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}
.smart-cards{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.smart-card{
  padding: 16px;
  border-radius: var(--gd-radius-lg, 16px);
  background: linear-gradient(180deg, rgba(124,58,237,.10), rgba(0,245,212,.06));
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 10px 26px rgba(0,0,0,.20);
}
.smart-head{
  display:flex;
  align-items:flex-start;
  gap: 12px;
}
.smart-check{
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
  color: #052e2a;
  background: rgba(16,185,129,.9);
  box-shadow: 0 0 0 3px rgba(16,185,129,.18);
  flex-shrink: 0;
}
.smart-title{
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #a7f3d0;
  margin-top: 2px;
}
.smart-goal{
  margin-top: 6px;
  color: var(--ion-text-color);
  font-size: 12px;
  line-height: 1.55;
  opacity: .95;
}
.smart-grid{
  margin-top: 14px;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.smart-item{
  display:flex;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, .6);
  border: 1px solid rgba(255,255,255,.08);
}
.smart-letter{
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
  color: #0b1020;
  background: linear-gradient(180deg, #00f5d4, #7c3aed);
  box-shadow: 0 0 0 3px rgba(0,245,212,.12);
  flex-shrink: 0;
}
.smart-text{min-width:0;}
.smart-k{
  font-size: 11px;
  font-weight: 750;
  color: #e5e7eb;
}
.smart-v{
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
}

/* ── Section Header ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 0 10px;
}
.section-header--spaced { margin-top: 8px; }
.section-lead { font-size: 1.15rem; color: var(--ion-color-primary); flex-shrink: 0; }
.section-title { margin: 0; font-size: 16px; color: var(--ion-text-color); font-weight: 650; letter-spacing: 0.02em; }
.section-badge { font-size: 11px; background: var(--gd-surface-1, #0f1419); color: #9ca3af; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--gd-border, rgba(255,255,255,.08)); }
.section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--gd-border-strong), transparent); }

/* ── KPI Cards Grid ── */
.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
  padding: 4px 0 16px;
}

/* ── KPI Edit Card ── */
.kpi-edit-card {
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: var(--gd-radius-lg, 16px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.kpi-edit-card:hover { border-color: var(--gd-border-strong, rgba(255,255,255,.12)); box-shadow: 0 8px 28px rgba(0,0,0,0.28); }
.kpi-edit-card.ok { border-left: 3px solid #10b981; }
.kpi-edit-card.risk { border-left: 3px solid #f59e0b; }
.kpi-edit-card.bad { border-left: 3px solid #ef4444; }

/* Card Top */
.kec-top { display: flex; align-items: center; gap: 12px; }
.kec-top--noicon { gap: 10px; }
.kec-top-end {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}
.kec-delete {
  --padding-start: 4px;
  --padding-end: 4px;
  margin: 0;
}
.toolbar-action {
  --color: var(--ion-color-primary);
  font-size: 12px;
  font-weight: 600;
}
.kec-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 10px;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kec-icon {
  font-size: 1.35rem;
  line-height: 1;
  display: block;
}
.kec-meta { flex: 1; min-width: 0; }
.kec-label { font-size: 13px; font-weight: 600; color: #f9fafb; line-height: 1.3; }
.kec-dashboard-badge {
  display: inline-block;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 99px;
  margin-top: 3px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.kec-dashboard-badge.business { background: #1e3a5f; color: #60a5fa; }
.kec-dashboard-badge.technical { background: #2d1b4e; color: #a78bfa; }
.kec-status-badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 99px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.kec-status-badge.ok { background: rgba(16,185,129,0.15); color: #10b981; }
.kec-status-badge.risk { background: rgba(245,158,11,0.15); color: #f59e0b; }
.kec-status-badge.bad { background: rgba(239,68,68,0.15); color: #ef4444; }

/* Values Row */
.kec-values-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #1f2937;
  border-bottom: 1px solid #1f2937;
}
.kec-val-block { flex: 1; text-align: center; }
.kec-val-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.kec-val { font-size: 20px; font-weight: 700; font-family: 'Fira Code', monospace; }
.target-val { color: #9ca3af; }
.kec-arrow { font-size: 20px; font-weight: 700; }
.kec-arrow.ok { color: #10b981; }
.kec-arrow.risk { color: #f59e0b; }
.kec-arrow.bad { color: #ef4444; }

/* Progress Bar */
.kec-progress-wrap {
  height: 6px;
  background: #1f2937;
  border-radius: 99px;
  overflow: visible;
  position: relative;
}
.kec-progress-fill {
  height: 100%;
  border-radius: 99px;
  max-width: 100%;
  transition: width 0.4s ease;
}
.kec-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #4b5563;
  margin-top: 3px;
}

/* Chart Reference */
.kec-chart-ref {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 6px;
}
.kec-chart-ref.supported { background: rgba(0,245,212,0.08); color: #9ca3af; border: 1px solid rgba(0,245,212,0.2); }
.kec-chart-ref.unsupported { background: #1f2937; color: #6b7280; border: 1px solid #374151; }
.ref-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ref-dot.on { background: #00f5d4; box-shadow: 0 0 6px #00f5d4; }
.ref-dot.off { background: #4b5563; }
.ref-text { line-height: 1.3; }

/* Slider Editor */
.kec-editor {
  background: #0f172a;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kec-editor-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}
.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--gd-border, rgba(255,255,255,.1));
  color: #9ca3af;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.reset-btn__icon { font-size: 14px; flex-shrink: 0; }
.reset-btn:hover { color: #e5e7eb; border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.04); }
.reset-btn--danger {
  border-color: rgba(239, 68, 68, .35);
  color: #fca5a5;
}
.reset-btn--danger:hover {
  border-color: rgba(239, 68, 68, .55);
  color: #fee2e2;
  background: rgba(239, 68, 68, .08);
}
.reset-btn:disabled{
  opacity: .45;
  cursor: not-allowed;
  background: transparent !important;
}
.editor-actions { display: inline-flex; gap: 8px; align-items: center; }

.add-form { padding: 16px; }
.add-section { margin-bottom: 14px; }
.add-title { font-size: 12px; font-weight: 700; color: #e5e7eb; margin: 0 0 8px; letter-spacing: .02em; }
.add-item { --background: var(--gd-surface-1, #0f1419); border: 1px solid var(--gd-border, rgba(255,255,255,.08)); border-radius: 12px; margin-bottom: 10px; }
.add-hint { font-size: 11px; color: #9ca3af; margin-top: -2px; }
.add-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.add-actions { margin-top: 10px; }

.view-toggle{ margin-top: 14px; }

.compact-list{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-bottom: 12px;
}
.compact-row{
  display:flex;
  align-items:center;
  gap:12px;
  padding: 12px 12px;
  border-radius: 14px;
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.compact-ico{
  width: 38px;
  height: 38px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
}
.compact-main{ min-width: 0; flex: 1; }
.compact-title{ font-size: 13px; font-weight: 650; color: var(--ion-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.compact-sub{ margin-top: 4px; display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }
.compact-chip{
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--gd-border, rgba(255,255,255,.12));
  color: #9ca3af;
}
.compact-chip.ok{ border-color: rgba(16,185,129,.35); color:#a7f3d0; background: rgba(16,185,129,.08); }
.compact-chip.risk{ border-color: rgba(245,158,11,.35); color:#fde68a; background: rgba(245,158,11,.08); }
.compact-chip.bad{ border-color: rgba(239,68,68,.35); color:#fecaca; background: rgba(239,68,68,.08); }
.compact-meta{ font-size: 11px; color:#9ca3af; }
.compact-del{ --padding-start: 6px; --padding-end: 6px; margin:0; }

.restore-panel{
  margin-top: 12px;
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  border-radius: 14px;
  background: var(--gd-surface-1, #0f1419);
  overflow: hidden;
}
.restore-summary{
  cursor: pointer;
  padding: 12px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-text-color);
  list-style: none;
}
.restore-summary::-webkit-details-marker{ display:none; }
.restore-empty{ padding: 0 14px 14px; font-size: 12px; color:#9ca3af; }
.restore-list{ padding: 0 10px 10px; display:flex; flex-direction:column; gap: 8px; }
.restore-row{
  display:flex; align-items:center; gap: 12px;
  padding: 10px 10px;
  border-radius: 12px;
  background: var(--gd-surface-card, #141d2e);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
}
.restore-ico{
  width: 34px; height: 34px;
  display:flex; align-items:center; justify-content:center;
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--gd-border, rgba(255,255,255,.08));
  font-size: 1.15rem;
}
.restore-main{ flex:1; min-width:0; }
.restore-title{ font-size: 13px; font-weight: 650; color: var(--ion-text-color); white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
.restore-sub{ margin-top: 4px; display:flex; gap: 8px; flex-wrap: wrap; align-items:center; }
.restore-tag{
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--gd-border, rgba(255,255,255,.12));
  color: #9ca3af;
}
.restore-meta{ font-size: 11px; color:#9ca3af; }
.restore-btn{ --color: var(--ion-color-primary); font-weight: 650; }

.kec-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-min, .slider-max { font-size: 10px; color: #6b7280; font-family: 'Fira Code', monospace; white-space: nowrap; }

/* Custom slider */
.kec-slider {
  flex: 1;
  appearance: none;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 99px;
  background: #374151;
  outline: none;
  cursor: pointer;
}
.kec-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--thumb-color, #00f5d4);
  cursor: pointer;
  box-shadow: 0 0 6px var(--thumb-color, #00f5d4);
  transition: box-shadow 0.2s;
}
.kec-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 12px var(--thumb-color, #00f5d4);
}
.kec-number {
  width: 72px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #f9fafb;
  font-size: 13px;
  font-family: 'Fira Code', monospace;
  padding: 4px 8px;
  text-align: right;
  outline: none;
}
.kec-number:focus { border-color: #00f5d4; }
.number-unit { font-size: 11px; color: #6b7280; white-space: nowrap; }

/* Description */
.kec-description { font-size: 11px; color: #6b7280; line-height: 1.5; font-style: italic; }

/* Footer */
.footer-note {
  text-align: center;
  font-size: 12px;
  color: #4b5563;
  padding: 20px;
  border-top: 1px solid #1f2937;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .summary-banner { flex-wrap: wrap; }
  .kpi-cards-grid { grid-template-columns: 1fr; }
  .smart-grid { grid-template-columns: 1fr; }
  .smart-cards { grid-template-columns: 1fr; }
  .smart-wrap__head{ flex-direction: column; align-items: flex-start; }
  .smart-wrap__hint{ text-align: left; }
}
</style>
