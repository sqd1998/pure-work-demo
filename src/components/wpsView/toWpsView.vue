<template>
  <viewFile :wpsUrl="jwpsUrl" :token="jtoken" />
</template>
<script setup lang="ts">
import viewFile from "./index.vue";
let jwpsUrl = sessionStorage.wpsUrl;
let jtoken = sessionStorage.token;
</script>
