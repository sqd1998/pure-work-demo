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
        <el-input
          v-model="jsonString"
          type="textarea"
          :rows="25"
          placeholder="请输入JSON数据"
        />
        <div class="json-copy">
          <el-tooltip content="复制" placement="left">
            <el-icon @click="copyFunc(jsonString)"><CopyDocument /></el-icon>
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
import { CopyDocument } from "@element-plus/icons-vue";
import { ref, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  graphData: Object
});
const emit = defineEmits(["closed", "update"]);

let showViewJson = ref(true);
let jsonString = ref("");

const copyFunc = data => {
  if (data) {
    let oInput = document.createElement("textarea");
    oInput.value = data;
    document.body.appendChild(oInput);
    oInput.select();
    try {
      document.execCommand("Copy");
      ElMessage.success("复制成功");
    } catch (err) {
      ElMessage.error("复制失败");
    }
    document.body.removeChild(oInput);
  }
};

// 监听graphData变化
watch(
  () => props.graphData,
  newVal => {
    if (newVal) {
      jsonString.value = JSON.stringify(newVal, null, 2);
    }
  },
  { immediate: true, deep: true }
);

//弹窗关闭
const closed = () => {
  emit("closed", true);
};

const updateGraph = () => {
  try {
    const updatedData = JSON.parse(jsonString.value);
    emit("update", updatedData);
    showViewJson.value = false;
  } catch (error) {
    ElMessage.error("JSON 格式错误，请检查后再更新");
  }
};

onMounted(() => {});
</script>
<style scoped lang="scss">
.json-container {
  position: relative;
}

.json-copy {
  position: absolute;
  top: 0;
  right: 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
