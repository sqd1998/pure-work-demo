<template>
  <div class="app-container">
    <div class="logic-flow-view">
      <!-- 工具栏 -->
      <Control
        v-if="showLf"
        class="demo-control"
        :lf="lf"
        @runForm="openFormRunner"
      />
      <!-- 左侧面板 -->
      <NodePanel v-if="showLf" :lf="lf" :title="title" />
      <!-- 画布 -->
      <div id="lf-view" ref="container" />
      <!-- 属性面板 -->
      <PropertyDialog
        v-if="showAttribute"
        :title="title"
        :nodeData="nodeData"
        :flowDetail="flowDetail"
        :lf="lf"
        @closed="showAttribute = false"
      />
      <FormRunnerDialog
        v-model="showFormRunner"
        :node="runnerNodeData"
        @submitted="handleFormSubmitted"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import LogicFlow from "@logicflow/core";
import { Menu, Snapshot, MiniMap } from "@logicflow/extension";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";
import start from "./registerNode/start/start";
import end from "./registerNode/end/end";
import registerBezier from "./registerEdge/registerBezier";
import endParallel from "./registerNode/endParallel/endParallel";
import background from "./registerNode/background/background";
import background2 from "./registerNode/background2/background";
import PropertyDialog from "./PropertySetting/PropertyDialog.vue";
import NodePanel from "./LFComponents/NodePanel.vue";
import Control from "./LFComponents/Control.vue";
import FormRunnerDialog from "./components/FormRunnerDialog.vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  title: {
    type: String,
    default: ""
  }
});

let lf: any = reactive({});
let showAddPanel = ref(false);
let addPanelStyle = reactive({
  top: 0,
  left: 0
});
let nodeData = ref(null);
let addClickNode = ref(null);
let showAttribute = ref(false);
let config = reactive({
  background: {
    backgroundColor: "#e2eefe",
    type: "dot"
  },
  grid: {
    size: 10,
    visible: false
  },
  keyboard: {
    enabled: true
  },
  adjustEdge: false, //允许调整边
  adjustEdgeStartAndEnd: false, //是否允许拖动边的端点来调整连线
  edgeSelectedOutline: true, //鼠标 hover 的时候显示边的外框
  // edgeTextDraggable: true,
  hoverOutline: false,
  nodeTextEdit: false, //节点是否可编辑。false不可编辑
  edgeTextEdit: false, //边是否可编辑。false不可编辑
  autoExpand: false, //点拖动靠近画布边缘时是否自动扩充画布
  textEdit: false, //是否开启文本编辑
  snapline: false, //对齐线。true开启
  // 旋转
  allowRotate: false,
  overlapMode: 1
});
let flowDetail = reactive({});
let container = ref(null);
let showLf = ref(false);
let showFormRunner = ref(false);
let runnerNodeData = ref(null);
let collectedFormData = ref([]);

const $_initLf = () => {
  // 画布配置
  const myLf = new LogicFlow({
    ...config,
    plugins: [Menu, MiniMap, Snapshot],
    container: container.value
  });
  lf = myLf;
  showLf.value = true;
  // 设置主题
  lf.setTheme({
    baseNode: {
      fill: "#FFFFFF",
      stroke: "transparent",
      strokeWidth: 0,
      radius: 8
    },
    circle: {
      stroke: "transparent",
      strokeWidth: 0
    },
    rect: {
      fill: "#FFFFFF",
      stroke: "transparent",
      outlineColor: "#88f",
      strokeWidth: 0,
      radius: 8
    },
    ellipse: {
      stroke: "transparent",
      strokeWidth: 0
    },
    polygon: {
      stroke: "transparent",
      strokeWidth: 0
    },
    diamond: {
      stroke: "transparent",
      strokeWidth: 0
    },
    polyline: {
      stroke: "#000000",
      hoverStroke: "#000000",
      selectedStroke: "#000000",
      strokeWidth: 1
    },
    edgeText: {
      color: "#000000",
      background: {
        fill: "#e2eefe"
      }
    }
  });
  lf.setDefaultEdgeType("myBezier"); //线类型，贝塞尔曲线
  $_registerNode();
};

// 自定义
const $_registerNode = () => {
  start(lf);
  end(lf);
  endParallel(lf);
  background(lf); // 注册背景节点
  background2(lf); // 注册纵向背景节点
  lf.register(registerBezier);
  $_render();
};

const $_render = () => {
  let flowJson = { nodes: [], edges: [] };

  lf.render(flowJson); //回显
  $_LfEvent();
};

const $_LfEvent = () => {
  lf.on("node:dbclick", ({ data }) => {
    nodeData.value = data;
    if (
      [
        "start",
        "end",
        "rect",
        "circle",
        "ellipse",
        "polygon",
        "diamond",
        "endParallel"
      ].includes(data.type)
    ) {
      showAttribute.value = true;
    }
  });
  lf.on("edge:dbclick", ({ data }) => {
    nodeData.value = data;
    showAttribute.value = true;
  });
  //来自边的事件中心发出的事件
  lf.on("edge:app-config", res => {
    nodeData.value = res;
    showAttribute.value = true;
  });
  lf.on("element:click", ({ data }) => {
    hideAddPanel();
    // 强制重置背景节点层级
    if (["background", "background2"].includes(data.type)) {
      const model = lf.graphModel.getNodeModelById(data.id);
      if (model) {
        model.zIndex = -1000;
      }
    }
  });
  lf.on("node:mousedown", ({ data }) => {
    if (["background", "background2"].includes(data.type)) {
      const model = lf.graphModel.getNodeModelById(data.id);
      if (model) {
        model.zIndex = -1000;
      }
    }
  });
  lf.on("blank:click", () => {
    hideAddPanel();
  });
  lf.on("connection:not-allowed", data => {
    if (data.msg) {
      ElMessage({
        type: "error",
        message: data.msg,
        duration: 8000
      });
    }
  });
  lf.changeMenuItemDisableStatus("nodeMenu", "编辑文本", true);

  lf.on("edge:add", ({ data }) => {
    setEdgeType(data);
  });

  lf.on("edge:delete", ({ data }) => {});

  // 子节点选择事件处理
  lf.on("node:click", ({ data }) => {
    nodeData.value = data;
  });

  // 节点移动开始事件
  lf.on("node:move:start", ({ data }) => {
    // 记录节点初始位置，用于后续验证
    data.__originalPosition = { x: data.x, y: data.y };
  });
};

const getRunnableNode = () => {
  const selectedNodes = lf.getSelectElements?.()?.nodes || [];
  const selectedNode = selectedNodes.find(node => node.type === "endParallel");
  if (selectedNode) return selectedNode;

  if (nodeData.value?.type === "endParallel") {
    return nodeData.value;
  }

  const graphData = lf.getGraphData();
  const formNodes = graphData.nodes.filter(
    node => node.type === "endParallel" && node.properties?.formRule?.length
  );

  if (formNodes.length === 1) {
    return formNodes[0];
  }

  if (formNodes.length > 1) {
    ElMessage.warning("存在多个表单节点，请先单击选择一个普通节点后再运行");
    return null;
  }

  ElMessage.warning("请先配置一个带表单字段的普通节点");
  return null;
};

const openFormRunner = () => {
  const runnableNode = getRunnableNode();
  if (!runnableNode) return;

  runnerNodeData.value = runnableNode;
  showFormRunner.value = true;
};

const handleFormSubmitted = payload => {
  collectedFormData.value.push({
    ...payload,
    submittedAt: new Date().toISOString()
  });

  lf.setProperties(payload.nodeId, {
    formSubmitData: payload.formData,
    formSubmitHistory: collectedFormData.value.filter(
      item => item.nodeId === payload.nodeId
    )
  });

  console.log("[Flow Form Runner] collected form data:", {
    current: payload,
    all: collectedFormData.value
  });
};

const hideAddPanel = () => {
  showAddPanel.value = false;
  addPanelStyle.top = 0;
  addPanelStyle.left = 0;
  addClickNode.value = null;
};

//设置边类型
const setEdgeType = data => {
  let sourceNode = lf.getGraphData().nodes.filter(i => {
    return i.id === data.sourceNodeId;
  })[0];
  if (sourceNode.type == "start") {
    lf.setProperties(data.id, {
      edgeType: "start"
    });
  } else {
    lf.setProperties(data.id, {
      edgeType: "nextStep"
    });
  }
};

onMounted(() => {
  $_initLf();
});
</script>
<style lang="scss">


@keyframes lf-animate-dash {
  to {
    stroke-dashoffset: 0;
  }
}

.logic-flow-view {
  position: relative;
  height: 100vh;
}

.demo-title {
  margin: 20px;
  text-align: center;
}

.demo-control {
  position: absolute;
  top: 15px;
  right: 100px;
  z-index: 2;
}

#lf-view {
  width: 100%;
  height: 100%;
  outline: none;
}

.time-plus {
  cursor: pointer;
}

.add-panel {
  position: absolute;
  z-index: 11;
  padding: 10px 5px;
  background-color: white;
}

.el-drawer__body {
  z-index: 3;
  height: 80%;
  margin-top: -30px;
  overflow: auto;
}

.lf-node-text-auto-wrap {
  cursor: pointer;
}

/* 适应节点图标 */
.lf-node-text-ellipsis-content {
  padding: 0 8px 0 34px !important;
}

.node-title {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 10px 10px 10px 6px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e6f7ff;
  border-radius: 8px;
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 100%;
  font-size: 18px;
}

.node-name > span {
  border: none !important;
}

//logicflow小地图
.lf-mini-map {
  border: none !important;
  border-radius: 6px;
  box-shadow: 3px 0 10px 1px rgb(228 224 219);
}

.lf-mini-map-header {
  height: 24px !important;
  font-size: 13px;
  line-height: 24px !important;
  // color: #fff;
  background-color: #ecf5ff !important;
  background-image: none !important;
  border: none !important;
}

.lf-mini-map-close {
  top: 2px !important;
}

.mt15 {
  margin-top: 15px;
}
</style>
