<template>
  <el-dropdown
    v-model:visible="menuVisible"
    :hide-on-click="false"
    trigger="contextmenu"
    placement="bottom-end"
  >
    <template #dropdown>
      <div class="dropdown-menu">
        <ul class="dropdown-list" role="menu">
          <li
            v-for="item in items"
            :key="item"
            class="dropdown-item"
            role="menuitem"
            @click="onSelect(item)"
          >
            {{ item }}
          </li>
        </ul>
      </div>
    </template>

    <div
      ref="elRef"
      class="drag-ball"
      :class="{ dragging: dragging, hover: hovering }"
      :style="{ right: elRight + 'px', top: elTop + 'px' }"
      role="button"
      aria-label="悬浮球"
      @pointerdown="onPointerDown"
      @pointerenter="hovering = true"
      @pointerleave="hovering = false"
    >
      <HugeiconsAiScan width="32" height="32" />
    </div>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from "vue";
import HugeiconsAiScan from "~icons/hugeicons/ai-scan";

const elRef = ref<HTMLElement | null>(null);
const elRight = ref(25); // 初始右侧距离
const elTop = ref(60); // 初始上方距离

const dragging = ref(false);
const hovering = ref(false);
const menuVisible = ref(false);

const items = ["1", "2", "3", "4", "5"];

let startX = 0;
let startY = 0;
let startRight = 0;
let startTop = 0;
let startLeft = 0; // 新增：基于 left 计算
let moved = false; // 标记是否发生移动
const MOVE_THRESHOLD = 6; // 超过此像素视为拖动

// 新增：记录上一次有效 clientX/clientY，用于增量计算
let lastClientX = 0;
let lastClientY = 0;

const onPointerMove = (e: PointerEvent) => {
  // 如果没有开始拖动就返回
  if (!dragging.value) return;

  // 每次基于上一次事件计算增量，避免单次绝对坐标跳变导致累计错误
  const rawDx = e.clientX - lastClientX;
  const rawDy = e.clientY - lastClientY;

  // 更新 lastClient 为当前（先判断是否异常）
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MAX_SINGLE_JUMP = Math.max(300, Math.round(vw * 0.6)); // 单次移动阈值，过大视为异常

  // 如果 single jump 超过阈值，忽略此次事件（可能是坐标系跳变/跨屏）
  if (Math.abs(rawDx) > MAX_SINGLE_JUMP || Math.abs(rawDy) > MAX_SINGLE_JUMP) {
    // 只更新 lastClientX/Y，不用这次数据来移动（避免瞬移）
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    return;
  }

  // 更新 moved 判定（用累计相对于 start 的距离判断）
  const dxFromStart = e.clientX - startX;
  const dyFromStart = e.clientY - startY;
  if (!moved && Math.hypot(dxFromStart, dyFromStart) > MOVE_THRESHOLD) {
    moved = true;
    menuVisible.value = false;
  }

  // 基于 startLeft + 累计增量移动（这里用 rawDx 累加到 startLeft）
  let newLeft = startLeft + (e.clientX - startX); // 也可以用累加 last->current 的方式
  // 限制可视区域
  const el = elRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    newLeft = Math.max(0, Math.min(newLeft, vw - rect.width));
    const newRight = vw - rect.width - newLeft;

    let newTop = startTop + (e.clientY - startY);
    newTop = Math.max(0, Math.min(newTop, vh - rect.height));

    elRight.value = Math.round(newRight);
    elTop.value = Math.round(newTop);
  }

  // 更新 lastClientX/Y 为当前，供下一次增量计算使用
  lastClientX = e.clientX;
  lastClientY = e.clientY;
};

const onPointerUp = (e?: PointerEvent) => {
  if (!dragging.value) return;
  dragging.value = false;

  // 释放指针捕获（在元素上释放）
  try {
    const el = elRef.value;
    if (e && el && (el as Element).releasePointerCapture) {
      (el as Element).releasePointerCapture((e as PointerEvent).pointerId);
    }
  } catch {}

  // 移除全局监听
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);

  // 如果没有实际移动，视为点击，切换下拉显示
  if (!moved) {
    menuVisible.value = !menuVisible.value;
  }
};

const onPointerDown = (e: PointerEvent) => {
  // 只处理左键或触控
  if (e.pointerType === "mouse" && e.button !== 0) return;

  const el = elRef.value;
  if (!el) return;

  (el as Element).setPointerCapture?.(e.pointerId);

  dragging.value = true;
  hovering.value = true;
  moved = false;

  startX = e.clientX;
  startY = e.clientY;
  // 初始化 lastClientX/Y 与 start 保持一致
  lastClientX = e.clientX;
  lastClientY = e.clientY;

  startRight = elRight.value;
  startTop = elTop.value;

  const rect = el.getBoundingClientRect();
  startLeft = rect.left;

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
};

// 点击选择（下拉项）
const onSelect = (val: string) => {
  menuVisible.value = false;
  // 处理选择逻辑...
};

// 清理
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
});
</script>

<style scoped lang="scss">
.drag-ball {
  position: fixed;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(204, 204, 204, 0.5);
  color: #191717;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(15, 20, 28, 0.25);
  cursor: grab;
  user-select: none;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
  opacity: 0.72;
  z-index: 2000;
  padding: 0 14px;
  backdrop-filter: blur(4px);
}

/* hover 或 focus 时更明显 */
.drag-ball.hover,
.drag-ball:hover {
  opacity: 1;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 30px rgba(15, 20, 28, 0.35);
}

/* 拖拽时视觉反馈 */
.drag-ball.dragging {
  cursor: grabbing;
  transform: scale(1.03);
  opacity: 0.95;
  box-shadow: 0 14px 40px rgba(15, 20, 28, 0.4);
}

/* 下拉菜单样式 */
.dropdown-menu {
  min-width: 140px;
  max-width: 260px;
  padding: 6px;
}

.dropdown-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 200px; /* 超出高度显示滚轮 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.dropdown-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color, #222);
  background: transparent;
  transition: background 120ms ease;
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>
