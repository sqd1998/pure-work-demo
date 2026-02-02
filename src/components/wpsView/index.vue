<template>
  <div ref="viewRef" class="wps" />
</template>
<script setup>
import { onMounted, ref } from "vue";
import * as WPS from "../../plugins/jwps.es6.1.3.js";
const props = defineProps({
  wpsUrl: String,
  token: String
});
const simpleMode = "normal";
const viewRef = ref(null);

onMounted(() => {
  console.log("props", props);

  openWps(props.wpsUrl, props.token);
});
const openWps = (url, token) => {
  const wps = WPS.config({
    mode: simpleMode,
    mount: viewRef.value,
    wpsUrl: url
  });
  wps.setToken({ token });
};
</script>

<style lang="scss" scoped>
.wps {
  width: 100%;
  height: 100vh; /* 强制占满视口高度 */
  :deep(#wps-iframe) {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
}
</style>
