<template>
  <div>
    <!-- 画布左上角几个按钮 -->
    <div class="panelLayout" style="height: 200px; background: #fff">
      <el-tooltip content="放大" title="放大" placement="left">
        <el-icon @click="$_zoomIn"><ZoomIn /></el-icon>
      </el-tooltip>
      <el-tooltip content="缩小" title="缩小" placement="left">
        <el-icon @click="$_zoomOut"><ZoomOut /></el-icon>
      </el-tooltip>
      <el-tooltip content="大小适应" title="大小适应" placement="left">
        <el-icon @click="$_zoomReset"><Aim /></el-icon>
      </el-tooltip>
      <el-tooltip
        content="定位还原(大小&定位)"
        title="定位还原(大小&定位)"
        placement="left"
      >
        <el-icon @click="$_reset"><Position /></el-icon>
      </el-tooltip>
      <el-tooltip content="上一步" title="上一步" placement="left">
        <el-icon :disabled="undoDisable" @click="$_undo"
          ><DArrowLeft
        /></el-icon>
      </el-tooltip>
      <el-tooltip content="下一步" title="下一步" placement="left">
        <el-icon :disabled="redoDisable" @click="$_redo"
          ><DArrowRight
        /></el-icon>
      </el-tooltip>
      <el-tooltip content="小地图" title="小地图" placement="left">
        <el-icon @click="$_showMiniMap"><MapLocation /></el-icon>
      </el-tooltip>
      <el-tooltip content="下载图片" title="下载图片" placement="left">
        <el-icon @click="$_download"><Download /></el-icon>
      </el-tooltip>
      <el-tooltip content="运行流程" title="运行流程" placement="left">
        <el-icon @click="runFormFunc"><VideoPlay /></el-icon>
      </el-tooltip>
      <el-tooltip content="查看JSON" title="查看JSON" placement="left">
        <el-icon @click="viewJsonFunc"><View /></el-icon>
      </el-tooltip>
      <el-tooltip content="清空画布" title="清空画布" placement="left">
        <el-icon @click="clearFunc"><Delete /></el-icon>
      </el-tooltip>
    </div>
    <viewJson
      v-if="showViewJson"
      :graphData="graphData"
      @closed="showViewJson = false"
      @update="updateGraphData"
    />
  </div>
</template>
<script setup lang="ts">
import viewJson from "../LFComponents/view-json.vue";
import { ref, onMounted } from "vue";

const props = defineProps({
  lf: Object,
  catTurboData: Boolean
});
const emit = defineEmits(["update", "runForm"]);
let undoDisable = ref(true);
let redoDisable = ref(true);
let graphData = ref(null);

let showViewJson = ref(false);

//运行流程
const runFormFunc = () => {
  emit("runForm");
};

//查看JSON
const viewJsonFunc = () => {
  graphData.value = props.lf.getGraphData();
  showViewJson.value = true;
};

//清空画布
const clearFunc = () => {
  // 使用空数据重新渲染画布
  props.lf.render({ nodes: [], edges: [] });
};

//更新视图
const updateGraphData = (data: any) => {
  props.lf.render(data);
};

let $_zoomIn = () => {
  props.lf.zoom(true);
};

let $_zoomOut = () => {
  props.lf.zoom(false);
};

let $_zoomReset = () => {
  props.lf.resetZoom();
};

let $_reset = () => {
  props.lf.resetZoom();
  props.lf.resetTranslate();
};

let $_undo = () => {
  props.lf.undo();
};

let $_redo = () => {
  props.lf.redo();
};

let $_download = () => {
  // eslint-disable-next-line vue/no-mutating-props
  props.lf.extension.snapshot.customCssRules = `
    .lf-canvas-overlay {
      background: #e2eefe;
    }
  `;
  // 使用带有参数的getSnapshot方法
  props.lf.getSnapshot("流程图", {
    backgroundColor: "#ffffff",
    fileType: "png",
    quality: 1
  });
};

let $_showMiniMap = () => {
  props.lf.extension.miniMap.show(props.lf.graphModel.width - 155, 220);
};

onMounted(() => {
  props.lf.on("history:change", ({ data: { undoAble, redoAble } }) => {
    undoDisable.value = !undoAble;
    redoDisable.value = !redoAble;
  });
});
</script>
<style lang="scss" scoped>
// 自动布局按钮位置控制
.panelLayout {
  position: absolute;
  top: 40px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 30px;
  height: 130px;
  padding: 4px 0;
  background: #f3f5f8;
  border-radius: 12px;
  box-shadow: 3px 0 10px 1px rgb(228 224 219);

  i {
    cursor: pointer;
  }
}
</style>
