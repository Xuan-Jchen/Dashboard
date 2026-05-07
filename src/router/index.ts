import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/business-dashboard'
  },
  {
    path: '/business-dashboard',
    component: () => import('../views/BusinessDashboard.vue')
  },
  {
    path: '/technical-dashboard',
    component: () => import('../views/TechnicalDashboard.vue')
  },
  {
    path: '/kpi-panel',
    component: () => import('../views/KpiPanel.vue')
  },
  // Legacy folder route
  {
    path: '/folder/:id',
    component: () => import('../views/FolderPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router