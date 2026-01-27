<template>
  <div class="app-container">
    <div class="logic-flow-view">
      <!-- 工具栏 -->
      <Control v-if="showLf" class="demo-control" :lf="lf" />
      <!-- 左侧面板 -->
      <NodePanel v-if="showLf" :lf="lf" :title="title" />
      <!-- 画布 -->
      <div id="LF-view" ref="container" />
      <!-- 属性面板 -->
      <PropertyDialog
        v-if="showAttribute"
        :title="title"
        :nodeData="nodeData"
        :flowDetail="flowDetail"
        :lf="lf"
        @closed="showAttribute = false"
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
    // 可以在这里添加子节点选择后的处理逻辑
  });

  // 节点移动开始事件
  lf.on("node:move:start", ({ data }) => {
    // 记录节点初始位置，用于后续验证
    data.__originalPosition = { x: data.x, y: data.y };
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
.logic-flow-view {
  height: 100vh;
  position: relative;
}
.demo-title {
  text-align: center;
  margin: 20px;
}
.demo-control {
  position: absolute;
  top: 15px;
  right: 100px;
  z-index: 2;
}
#LF-view {
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
  background-color: white;
  padding: 10px 5px;
}
.el-drawer__body {
  height: 80%;
  overflow: auto;
  margin-top: -30px;
  z-index: 3;
}

.lf-node-text-auto-wrap {
  cursor: pointer;
}

/* 适应节点图标 */
.lf-node-text-ellipsis-content {
  padding: 0 8px 0 34px !important;
}
.node-title {
  height: 40px;
  width: 100%;
  background: #fff;
  border: 1px solid #e6f7ff;
  box-sizing: border-box;
  padding: 10px 10px 10px 6px;
  border-radius: 8px;
  cursor: pointer;
}
.node-icon {
  width: 26px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}
.node-name > span {
  border: none !important;
}

//logicflow小地图
.lf-mini-map {
  border-radius: 6px;
  border: none !important;
  box-shadow: 3px 0 10px 1px rgb(228, 224, 219);
}

.lf-mini-map-header {
  border: none !important;
  font-size: 13px;
  height: 24px !important;
  line-height: 24px !important;
  // color: #fff;
  background-color: #ecf5ff !important;
  background-image: none !important;
}

.lf-mini-map-close {
  top: 2px !important;
}

@keyframes lf_animate_dash {
  to {
    stroke-dashoffset: 0;
  }
}
.mt15 {
  margin-top: 15px;
}
</style>
