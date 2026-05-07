## GameDash（Ionic Dashboard）

一个基于 **Ionic Vue + Vite** 的深色系可视化看板 Demo，用一套统一的 KPI 机制把 **业务指标** 与 **技术指标** 串起来，并提供可配置的目标阈值与面板化管理。

### 你可以在 PPT 里怎么一句话介绍
- **一句话**：用 Ionic Vue 搭一个“业务 + 技术”双看板，通过 KPI 面板统一管理目标阈值，并在多种图表库中以一致方式呈现与交互。

---

## 功能亮点（PPT 可直接用）
- **双看板**：业务看板（增长/收入/留存/漏斗）+ 技术看板（实时/错误分布/系统健康/资源分析）
- **统一 KPI 机制**：默认目标 + 本地覆盖目标（override），看板与面板联动
- **阈值可视化**：在支持的图表上绘制目标线/阈值线（如实时延迟线、MAU 目标线等）
- **KPI 管理面板**：编辑目标、添加自定义 KPI、隐藏/恢复 KPI（“删除”以隐藏方式实现）
- **多图表库融合**：ApexCharts / ECharts / Chart.js + 自定义 SVG/DOM
- **侧栏可拖拽宽度**：桌面端 split-pane 侧栏支持拖拽，并本地持久化

---

## 技术栈
- **框架**：Ionic Vue、Vue 3、Vue Router
- **构建**：Vite、TypeScript
- **图表**：ApexCharts、ECharts、Chart.js、自定义 SVG
- **状态/数据**：本地 KPI Store（localStorage 持久化）

---

## 页面与路由
- `/business-dashboard`：商业看板（`BusinessDashboard.vue`）
- `/technical-dashboard`：技术看板（`TechnicalDashboard.vue`）
- `/kpi-panel`：KPI 管理面板（`KpiPanel.vue`）

---

## 快速开始（演示用）

```bash
npm install
npm run dev
```

常用脚本：
- `npm run lint`：代码检查
- `npm run build`：类型检查 + 构建

---

## KPI 机制说明（建议 PPT 讲解用）

### 目标值如何计算
- **默认目标**：每个 KPI 定义自带 `defaultTarget`
- **覆盖目标（override）**：在 KPI 面板里调整滑块/输入框后，本地保存覆盖值
- 页面展示的 `target`：**override（若存在）否则 defaultTarget**

### “删除目标”是什么
- KPI 面板里的 **Eliminar objetivo**：只删除该 KPI 的覆盖目标，让目标回到 `defaultTarget`
- **不会删除 KPI 本身**

### KPI 的隐藏 / 恢复（“删除 KPI”= 隐藏）
- **隐藏后**：该 KPI 会在 KPI 面板、商业看板、技术看板中消失
- **恢复**：在 KPI 面板顶部的 **“KPIs eliminados/ocultos”** 折叠区点击 **Restaurar**

本地存储键：
- 覆盖目标：`gamedash_kpi_targets_v1`
- 已隐藏 KPI：`gamedash_kpi_hidden_v1`
- 自定义 KPI：`gamedash_kpi_custom_v1`

---

## 图表与场景（可选：PPT 1 页概览）

### 商业看板（BusinessDashboard）
- **MAU 趋势（ApexCharts Area）**：增长趋势 + 目标线
- **收入构成（ECharts Donut）**：结构占比
- **获客漏斗（自定义 Funnel）**：转化瓶颈
- **Top 游戏（Chart.js 横向 Bar）**：对比排行 + 阈值线
- **社区参与（ApexCharts Polar）**：多维健康度

### 技术看板（TechnicalDashboard）
- **实时 Req/s + Latency（Chart.js Line）**：实时监控 + 延迟告警线
- **错误热力图（ECharts Heatmap）**：时段/星期分布
- **系统健康仪表盘（自定义 SVG）**：可用性目标标记 + CPU/内存/磁盘
- **CPU vs 内存散点（Chart.js Scatter）**：服务分群 + 双阈值线
- **DB Treemap（ECharts Treemap）**：热点集合/慢查询权重

---

## PPT 建议大纲（直接复制）
1. **项目背景/目标**：为什么要做双看板、要解决什么问题
2. **整体架构**：Ionic Vue + KPI Store + 多图表库
3. **核心亮点**：KPI 统一管理、阈值联动、隐藏/恢复、自定义 KPI
4. **业务看板演示**：MAU 目标线、漏斗、Top 游戏阈值
5. **技术看板演示**：实时延迟告警线、热力图、健康仪表盘
6. **KPI 面板演示**：编辑目标、删除目标、隐藏/恢复、自定义 KPI
7. **总结与展望**：接入真实 API、权限/多租户、告警通知、导出报表


