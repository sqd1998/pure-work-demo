<template>
  <div>
    <el-dialog
      v-model="showViewJson"
      title="查看JSON"
      width="700px"
      top="15px"
      append-to-body
      @closed="closed"
    >
      <div class="json-container">
        <vueJsonPretty
          v-model:data="graphDataJson"
          :deep="10"
          :showLine="false"
          :virtual="true"
          :editable="true"
          editableTrigger="dblclick"
          :height="500"
        />
        <div class="json-copy">
          <el-tooltip content="复制" placement="left">
            <el-icon @click="copyFunc(JSON.stringify(graphDataJson))"
              ><CopyDocument
            /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showViewJson = false">取消</el-button>
          <el-button type="primary" @click="updateGraph">更新</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { CopyDocument } from "@element-plus/icons-vue";
import { ref, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  graphData: Object
});
const emit = defineEmits(["closed", "update"]);

let showViewJson = ref(true);
let graphDataJson = ref({});
const copyFunc = data => {
  if (data) {
    let oInput = document.createElement("input");
    oInput.value = data;
    document.body.appendChild(oInput);
    oInput.select();
    ElMessage.success("复制成功");
    document.execCommand("Copy");
    document.body.removeChild(oInput);
  }
};

// 监听graphData变化
watch(
  () => props.graphData,
  newVal => {
    if (newVal) {
      graphDataJson.value = newVal;
    }
  },
  { immediate: true, deep: true }
);

//弹窗关闭
const closed = () => {
  emit("closed", true);
};

const updateGraph = () => {
  emit("update", graphDataJson.value);
  showViewJson.value = false;
};

onMounted(() => {});
</script>
<style scoped lang="scss">
.json-container {
  position: relative;
}
.json-copy {
  position: absolute;
  right: 20px;
  top: 0;
  font-size: 16px;
  cursor: pointer;
}
</style>
