<template>
  <div ref="myNode" class="node-title">
    <span class="node-name"><span /></span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
const props = defineProps({
  properties: {
    type: Object,
    default: null
  }
});
let myNode = ref(null);

onMounted(() => {
  let borderColor = "#e6f7ff";
  if (props.properties.frontend_status == "0") {
    borderColor = "#f56c6c";
  }
  myNode.value.style.border = `1px solid ${borderColor}`; //stroke边框
});
</script>

<style scoped lang="scss">
.node-icon {
  font-size: 16px;
}
</style>
