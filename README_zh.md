# CrossLink Web

CrossLink 管理后台 — AI API 网关的前端控制面板。

## 功能概览

- **仪表盘** — 系统概览、用量趋势、模型分布统计
- **供应商管理** — 管理AI模型供应商（DeepSeek、通义千问等），测试连通性
- **模型管理** — 配置和路由AI模型
- **API 密钥** — 管理API访问密钥
- **运维** — 请求日志查询与分析

## 技术栈

- [Vue 3](https://vuejs.org/) + TypeScript
- [Vite](https://vitejs.dev/) 构建
- [Arco Design Vue](https://arco.design/vue) UI 组件库
- [Pinia](https://pinia.vuejs.org/) 状态管理
- [ECharts](https://echarts.apache.org/) 数据可视化

## 开发

### 环境要求

- Node.js >= 18
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器运行在 `http://localhost:5180`，API 请求自动代理至 `http://localhost:8080`。

### 构建

```bash
pnpm build
```

### 类型检查

```bash
pnpm type-check
```

## 项目结构

```
src/
├── api/            # API 请求层
├── assets/style/   # 全局样式
├── components/     # 通用组件
├── hooks/          # 组合式函数
├── layout/         # 布局组件
├── logger/         # 前端日志模块
├── router/         # 路由配置
├── store/          # 状态管理
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
└── views/          # 页面组件
```

## 许可证

[Apache License 2.0](LICENSE)
