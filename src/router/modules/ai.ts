import HugeiconsAiScan from "~icons/hugeicons/ai-scan";
export default [
  {
    path: "/aibot",
    name: "aibot",
    component: () => import("@/views/ai2/index.vue"),
    meta: {
      icon: HugeiconsAiScan,
      title: "AI门户",
      rank: 0
    }
  },
  {
    path: "/aichat",
    meta: {
      icon: HugeiconsAiScan,
      title: "AI 助手对话框",
      rank: 2,
      showLink: false
    },
    name: "AIChatResult",
    component: () => import("@/views/AIChatResult/index.vue")
  },
  {
    path: "/flow",
    name: "flow",
    component: () => import("@/views/flow/index.vue"),
    meta: {
      icon: HugeiconsAiScan,
      title: "flow",
      rank: 0
    }
  }
] satisfies Array<RouteConfigsTable>;
