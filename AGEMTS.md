# AGEMTS.md

## 项目用途

基于 `vue-pure-admin-thin` 的 Vue 3 后台管理前端项目，当前包含 AI 门户、AI 对话、流程设计器等页面；`src/views/flow` 是基于 LogicFlow 的流程图编辑模块。

## 技术栈

- 框架：Vue `^3.5.22`
- 构建工具：Vite `^7.1.12`
- 语言：TypeScript `^5.9.3`
- 路由：Vue Router `^4.6.3`
- 状态管理：Pinia `^3.0.3`
- UI 组件库：Element Plus `^2.11.5`、TDesign Vue Next `^1.17.7`、`@tdesign-vue-next/chat` `0.5.0-alpha.10`
- 表单低代码：`@form-create/designer ^3.4.0`、`@form-create/element-ui ^3.2.42`
- 流程/图编辑：LogicFlow `@logicflow/core ^2.1.10`、`@logicflow/extension ^2.1.12`；项目依赖中也包含 AntV X6 相关包
- CSS 方案：SCSS、Tailwind CSS `^4.1.16`、Element Plus/TDesign 全局样式
- shadcn/ui：未检测到 `components.json`，当前不是 shadcn 项目

## shadcn 配置

- `components.json`：不存在
- 已安装组件列表：不适用
- registry 配置：不适用

## 目录结构

```text
pure-work-demo/
├── build/                    # Vite/构建插件配置
├── mock/                     # mock 数据
├── public/                   # 静态资源
├── src/
│   ├── api/                  # 接口层
│   ├── assets/               # 图片、svg、iconfont 等资源
│   ├── components/           # 全局/公共组件
│   ├── config/               # 平台配置
│   ├── directives/           # 自定义指令
│   ├── layout/               # 后台布局
│   ├── plugins/              # Element Plus 等插件注册
│   ├── router/               # 路由与动态路由工具
│   ├── store/                # Pinia store
│   ├── style/                # 全局样式、Tailwind 入口
│   ├── utils/                # 工具函数
│   └── views/
│       ├── ai2/              # AI 门户
│       ├── AIChatResult/     # AI 对话结果页
│       ├── flow/             # LogicFlow 流程设计器模块
│       ├── login/            # 登录页
│       └── welcome/          # 首页
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

## 主要入口

- `src/main.ts`：创建 Vue 应用，注册 Element Plus、TDesign、TDesign Chat、Pinia、Router、全局指令和图标组件。
- `src/App.vue`：应用根组件。
- `src/router/index.ts`：路由实例、路由守卫、静态路由自动导入、动态路由初始化逻辑。
- `src/router/modules/*.ts`：静态路由模块；`src/router/modules/ai.ts` 中注册了 `/flow` 页面。
- `src/views/flow/index.vue`：流程设计器页面外层入口。
- `src/views/flow/design/index.vue`：LogicFlow 画布初始化、节点/边注册、事件绑定、属性面板挂载。
- `src/views/flow/design/components/FormDesignerPanel.vue`：封装 `@form-create/designer` 的 `FcDesigner`，提供节点表单规则和表单配置的读取/回显能力。
- `src/views/flow/design/components/FormRunnerDialog.vue`：运行节点表单，基于 `form-create` 渲染设计结果并收集用户填写数据。

## 开发/构建命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev` 或 `pnpm serve`
- 生产构建：`pnpm build`
- staging 构建：`pnpm build:staging`
- 预览：`pnpm preview`
- 构建后预览：`pnpm preview:build`
- 类型检查：`pnpm typecheck`
- ESLint 修复：`pnpm lint:eslint`
- Prettier 格式化：`pnpm lint:prettier`
- Stylelint 修复：`pnpm lint:stylelint`
- 全量 lint：`pnpm lint`

## 重要约定

- 包管理器使用 `pnpm`，`preinstall` 会执行 `npx only-allow pnpm`。
- Node 版本要求：`^20.19.0 || >=22.13.0`；pnpm 版本要求：`>=9`。
- 路由模块位于 `src/router/modules`，除 `remaining.ts` 外会被 `import.meta.glob` 自动导入。
- 路径别名 `@` 指向 `src`，项目中大量使用 `@/...` 导入。
- Flow 模块当前以 LogicFlow 为核心：自定义节点注册位于 `src/views/flow/design/registerNode`，自定义边位于 `src/views/flow/design/registerEdge`，左侧节点面板位于 `src/views/flow/design/LFComponents/NodePanel.vue`，属性抽屉位于 `src/views/flow/design/PropertySetting/PropertyDialog.vue`。
- Flow 已在普通节点 `endParallel` 的属性面板中集成 form-create designer；设计器数据保存到节点 `properties.formRule` 与 `properties.formOption`，保证 `lf.getGraphData()` 可完整保存与回显。
- PoC 阶段 form-create designer 仅允许使用文本框 `input` 与日期框 `datePicker`，其他组件菜单/字段已在 `FormDesignerPanel.vue` 中隐藏，并在保存/回显时过滤非 PoC 字段。
- Flow 工具栏提供“运行流程”按钮，PoC 阶段从唯一 `start` 节点开始按单出边串行运行，遇到 `endParallel` 普通节点弹出 form-create 表单，提交后继续到下一节点，遇到 `end` 节点完成并输出运行结果。
- 节点表单提交后会写入节点 `properties.formSubmitData` 和 `properties.formSubmitHistory`，同时记录到本次流程运行上下文。
- LogicFlow 节点属性更新主要通过 `lf.setProperties` 与 `lf.updateText` 完成；节点可视化组件通过 `createApp + h` 挂载到 LogicFlow HTML 节点中。
- 避免在未确认生命周期清理的情况下重复挂载 LogicFlow HTML 节点中的 Vue 子应用；后续重构时应考虑卸载逻辑。

## 最后更新时间

2026-05-07 15:10:10 +08:00

更新摘要：将表单节点的保存入口移动到抽屉标题右侧，避免被 form-create designer 区域挤出视口；同步调整抽屉和设计器高度以减少竖向滚动。
