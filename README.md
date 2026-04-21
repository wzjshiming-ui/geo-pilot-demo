# GEO Pilot Demo

一套面向中国市场的 GEO（Generative Engine Optimization，生成式搜索优化）策略系统 Web Demo。

这个项目使用 `Next.js + TypeScript + Tailwind CSS` 搭建，内置默认案例“商家牛简单拍”，打开后即可完整演示：

- 创建 GEO 任务
- 生成 GEO 策略结果
- 查看单个方向详情
- 生成文章草稿
- 查看面向不同 AI 平台的发布建议
- 查看 GEO 占位矩阵、内容集群、AI 引用评分和 30 天执行方案

## 项目特点

- 中文界面，偏 SaaS Demo 风格
- 内置 20 个 GEO 优化方向
- 包含用户指定方向 + 额外补充的 8 个中国市场 GEO 方向
- 不只是生成文章，还会输出优先级决策、AI 引用评分、分布式占位建议、内容集群和执行路径
- 使用规则引擎 + 模板生成结果
- 不依赖真实大模型 API
- 结构清晰，方便未来替换为真实 LLM 接口
- 默认内置“商家牛简单拍”完整案例，避免打开后空白

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- 本地 mock 数据 + 规则引擎

## 本地启动

确保你已经安装 Node.js，推荐版本 `18+`，当前项目已在 Node `v22` 环境下编写。

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

### 3. 打开浏览器

默认访问：

[http://localhost:3000](http://localhost:3000)

## 页面说明

- `/`
  首页 / Landing Page
- `/tasks/new`
  创建 GEO 任务页
- `/results`
  结果总览页
- `/directions/[slug]`
  单个方向详情页
- `/articles`
  文章生成页
- `/publishing`
  发布建议页

## 默认案例

系统内置案例：

- 品牌名称：商家牛简单拍
- 产品名称：AI短视频生成系统
- 一句话介绍：帮助实体商家低门槛、高效率生成短视频内容
- 行业：AI营销 / 本地生活 / 实体门店增长
- 服务人群：实体商家、门店老板、餐饮、美业、工厂老板
- 核心卖点：
  - 不会拍也能做视频
  - 不会写文案也能生成脚本
  - 降低出镜门槛
  - 提高短视频获客效率
- 用户痛点：
  - 不会拍视频
  - 不会剪视频
  - 没时间做内容
  - 做了内容没效果
- 差异化优势：
  - 更适合实体门店
  - 更偏结果导向
  - 更适合中国本地商家场景
- 竞品：
  - 剪映类工具
  - 通用 AI 视频工具
  - 其他短视频 SaaS 工具
- 目标平台：
  - 豆包
  - Kimi
  - 腾讯元宝
  - 通义千问

## 结果生成逻辑

目前系统使用的是“规则引擎 + 模板拼装”模式。

核心逻辑位于：

- [lib/rule-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/rule-engine.ts)
- [lib/geo-config.ts](/Users/shimingdediannao/Documents/New%20project/lib/geo-config.ts)
- [mock/default-case.ts](/Users/shimingdediannao/Documents/New%20project/mock/default-case.ts)
- [lib/geo-priority-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/geo-priority-engine.ts)
- [lib/citation-score-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/citation-score-engine.ts)
- [lib/distribution-matrix-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/distribution-matrix-engine.ts)
- [lib/content-cluster-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/content-cluster-engine.ts)
- [lib/evidence-enhancer.ts](/Users/shimingdediannao/Documents/New%20project/lib/evidence-enhancer.ts)
- [lib/execution-plan-engine.ts](/Users/shimingdediannao/Documents/New%20project/lib/execution-plan-engine.ts)

逻辑大致包括：

- 根据品牌、产品、行业、人群、痛点、竞品生成问句模板
- 根据方向生成推荐标题、内容结构和素材建议
- 根据品牌认知、决策成本、负面风险做优先级分层
- 根据内容结构、问答匹配度和证据信号输出 AI 引用友好度评分
- 根据方向与平台生成分布式占位矩阵
- 根据方向生成内容集群、变体版本和证据增强建议
- 根据目标 AI 平台输出发布建议与账号策略
- 根据选定方向和文章类型生成文章草稿
- 自动给出 7 天 / 30 天执行计划

未来如果要接真实模型 API，推荐优先替换以下接口：

- [app/api/generate/route.ts](/Users/shimingdediannao/Documents/New%20project/app/api/generate/route.ts)
- [app/api/article/route.ts](/Users/shimingdediannao/Documents/New%20project/app/api/article/route.ts)

## 目录结构

```text
app/
  api/
    article/route.ts
    generate/route.ts
  articles/page.tsx
  directions/[slug]/page.tsx
  publishing/page.tsx
  results/page.tsx
  tasks/new/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  app-shell.tsx
  article-lab.tsx
  demo-initializer.tsx
  direction-detail-view.tsx
  landing-page.tsx
  publishing-guide-view.tsx
  results-dashboard.tsx
  section-card.tsx
  task-builder.tsx
lib/
  citation-score-engine.ts
  content-cluster-engine.ts
  distribution-matrix-engine.ts
  evidence-enhancer.ts
  execution-plan-engine.ts
  geo-config.ts
  geo-priority-engine.ts
  rule-engine.ts
  storage.ts
  types.ts
  utils.ts
mock/
  default-case.ts
package.json
tailwind.config.ts
postcss.config.js
tsconfig.json
```

## 面向未来扩展的建议

如果后续你要把这个 Demo 升级成正式产品，建议下一步做这些：

- 接入真实大模型 API，把规则引擎换成“规则 + LLM 混合生成”
- 增加任务保存、历史记录、账号系统
- 增加导出 Word / Markdown / PDF
- 增加品牌库、行业模板库、案例库
- 增加批量生成问答和内容排期表
- 增加后台配置，让 GEO 方向、平台策略、模板可视化维护

## 执行说明

这个版本的目标是：

- 一次安装即可跑起来
- 不需要联网抓规则
- 不需要数据库
- 不需要真实 API Key
- 打开后就能看到完整演示结果

如果你后续要我继续，我可以直接在这个版本上再往下补：

- 登录页 / 控制台页
- 导出功能
- 任务历史
- 真正的 LLM 接口接入
- 多案例切换
- Admin 配置后台
