<template>
  <div class="background-node">
    <!-- 隐藏内部内容 -->
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  properties: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style lang="scss" scoped>
.background-node {
  width: 100%;
  height: 200px;
  /* 设置所有边框为黑色实线 */
  border-top: 2px solid #000000;
  border-right: 2px solid #000000;
  border-bottom: 2px solid #000000;
  border-left: 2px solid #000000;
  background-color: rgba(255, 255, 255, 0);
  box-sizing: border-box;
  /* 确保边框显示在最上层 */
  z-index: -1;
}
.lf-text-disabled {
  display: none;
}
</style>
