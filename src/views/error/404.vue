<template>
  <div class="w-full h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="h-12 border-b flex items-center px-4 gap-2 bg-white">
      <el-button-group>
        <el-button type="primary" @click="handleZoomIn">放大</el-button>
        <el-button type="primary" @click="handleZoomOut">缩小</el-button>
        <el-button type="primary" @click="handleFit">自适应</el-button>
      </el-button-group>
      <el-divider direction="vertical" />
      <el-button-group>
        <el-button type="primary" @click="handleShowJSON">查看JSON</el-button>
        <el-button @click="handleExportPNG">导出图片</el-button>
        <el-button @click="handleClear">清空画布</el-button>
      </el-button-group>
    </div>

    <div
      class="flex-1 flex w-full h-full overflow-hidden"
      @click="closeContextMenu"
    >
      <div ref="stencilRef" class="w-60 h-full border-r relative bg-white" />
      <div id="container" ref="containerRef" class="flex-1 h-full bg-gray-50" />
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuState.visible"
      :style="{
        position: 'fixed',
        top: contextMenuState.y + 'px',
        left: contextMenuState.x + 'px',
        zIndex: 9999
      }"
      class="bg-white shadow-md border rounded py-1 w-32 cursor-pointer"
    >
      <div
        v-if="contextMenuState.targetCell?.shape === 'lane'"
        class="px-4 py-2 hover:bg-gray-100 text-sm"
        @click.stop="handleSwitchLaneDirection"
      >
        切换方向
      </div>
      <div
        class="px-4 py-2 hover:bg-gray-100 text-sm text-red-500"
        @click.stop="handleDeleteNode"
      >
        删除
      </div>
    </div>

    <!-- JSON查看/编辑弹窗 -->
    <el-dialog v-model="jsonVisible" title="JSON数据" width="60%">
      <el-input
        v-model="jsonContent"
        type="textarea"
        :rows="15"
        placeholder="JSON数据"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="jsonVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveJSON">应用</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 节点属性编辑弹窗 -->
    <el-dialog v-model="attrVisible" title="编辑节点属性" width="30%">
      <el-form :model="nodeForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="nodeForm.label" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="nodeForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="attrVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveNodeAttr">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, shallowRef, markRaw } from "vue";
import { type Cell, type CellView, Graph, type Node } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Stencil } from "@antv/x6-plugin-stencil";
import { Export } from "@antv/x6-plugin-export";
import "@antv/x6-plugin-stencil/dist/index.css";
import { message } from "@/utils/message";

defineOptions({
  name: "Flow2"
});

const ports = {
  groups: {
    top: {
      position: "top",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff"
        }
      }
    },
    right: {
      position: "right",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff"
        }
      }
    },
    bottom: {
      position: "bottom",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff"
        }
      }
    },
    left: {
      position: "left",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff"
        }
      }
    }
  },
  items: [
    { group: "top" },
    { group: "right" },
    { group: "bottom" },
    { group: "left" }
  ]
};

const containerRef = ref<HTMLElement | null>(null);
const stencilRef = ref<HTMLElement | null>(null);
const graphRef = shallowRef<Graph | null>(null);

// 状态管理
const jsonVisible = ref(false);
const jsonContent = ref("");
const attrVisible = ref(false);
const currentNode = shallowRef<Node | null>(null);
const nodeForm = reactive({
  label: "",
  description: ""
});

// 右键菜单状态
const contextMenuState = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetCell: null as Cell | null
});

// 工具栏功能
const handleZoomIn = () => {
  graphRef.value?.zoom(0.1);
};

const handleZoomOut = () => {
  graphRef.value?.zoom(-0.1);
};

const handleFit = () => {
  graphRef.value?.zoomToFit({ padding: 10, maxScale: 1 });
};

const handleClear = () => {
  graphRef.value?.clearCells();
  message("画布已清空", { type: "success" });
};
const handleExportPNG = () => {
  if (!graphRef.value) return;
  graphRef.value.exportSVG();
};
const handleShowJSON = () => {
  if (!graphRef.value) return;
  try {
    jsonContent.value = JSON.stringify(graphRef.value.toJSON(), null, 2);
    jsonVisible.value = true;
  } catch (e) {
    message(e || "无法生成JSON数据", { type: "error" });
  }
};

const handleSaveJSON = () => {
  try {
    const data = JSON.parse(jsonContent.value);
    graphRef.value?.fromJSON(data);
    // 加载完成后重新调整层级，确保泳道在底层
    graphRef.value?.getNodes().forEach(node => {
      if (node.shape === "lane") {
        node.toBack();
      }
    });
    jsonVisible.value = false;
    message("JSON加载成功", { type: "success" });
  } catch (e) {
    message("JSON格式错误", { type: "error" });
  }
};

const handleSaveNodeAttr = () => {
  if (!currentNode.value) return;

  // 更新Label
  const node = currentNode.value;
  if (node.shape === "lane") {
    node.attr("name-text/text", nodeForm.label);
  } else {
    node.attr("label/text", nodeForm.label);
  }

  // 更新描述 (存储在 data 中)
  const data = node.getData() || {};
  node.setData({ ...data, description: nodeForm.description });

  attrVisible.value = false;
  message("属性保存成功", { type: "success" });
};

const handleSwitchLaneDirection = () => {
  const node = contextMenuState.targetCell as Node;
  if (!node || node.shape !== "lane") return;

  const { width, height } = node.getSize();
  const data = node.getData() || {};
  const isHorizontal = data.direction === "horizontal";

  // 交换宽高度
  node.resize(height, width);

  if (isHorizontal) {
    // 切换为纵向 (默认)
    node.attr({
      "name-rect": {
        refWidth: "100%",
        height: 30,
        refHeight: null,
        width: null
      },
      "name-text": {
        style: {
          writingMode: "horizontal-tb"
        }
      }
    });
    node.setData({ ...data, direction: "vertical" });
  } else {
    // 切换为横向
    node.attr({
      "name-rect": {
        refHeight: "100%",
        width: 30,
        refWidth: null,
        height: null
      },
      "name-text": {
        style: {
          writingMode: "vertical-rl"
        }
      }
    });
    node.setData({ ...data, direction: "horizontal" });
  }

  closeContextMenu();
};

const closeContextMenu = () => {
  contextMenuState.visible = false;
  contextMenuState.targetCell = null;
};

const handleDeleteNode = () => {
  if (contextMenuState.targetCell) {
    graphRef.value?.removeCell(contextMenuState.targetCell.id);
    message("删除成功", { type: "success" });
  }
  closeContextMenu();
};

function registerGateway(name: string, symbol: string) {
  Graph.registerNode(
    name,
    {
      inherit: "polygon",
      ports: { ...ports },
      attrs: {
        body: {
          refPoints: "0,10 10,0 20,10 10,20",
          strokeWidth: 2,
          stroke: "#5F95FF",
          fill: "#EFF4FF"
        },
        label: {
          text: symbol,
          fontSize: 32,
          fontWeight: "bold",
          fill: "#5F95FF"
        }
      }
    },
    true
  );
}

Graph.registerNode(
  "event",
  {
    inherit: "circle",
    ports: { ...ports },
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: "#5F95FF",
        fill: "#FFF"
      }
    }
  },
  true
);

Graph.registerNode(
  "start-event",
  {
    inherit: "circle",
    ports: { ...ports },
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: "#52C41A",
        fill: "#FFF"
      }
    }
  },
  true
);

Graph.registerNode(
  "end-event",
  {
    inherit: "circle",
    ports: { ...ports },
    attrs: {
      body: {
        strokeWidth: 4,
        stroke: "#FF4D4F",
        fill: "#FFF"
      }
    }
  },
  true
);

Graph.registerNode(
  "activity",
  {
    inherit: "rect",
    ports: { ...ports },
    markup: [
      {
        tagName: "rect",
        selector: "body"
      },
      {
        tagName: "image",
        selector: "img"
      },
      {
        tagName: "text",
        selector: "label"
      }
    ],
    attrs: {
      body: {
        rx: 6,
        ry: 6,
        stroke: "#5F95FF",
        fill: "#EFF4FF",
        strokeWidth: 1
      },
      img: {
        x: 6,
        y: 6,
        width: 16,
        height: 16,
        "xlink:href":
          "https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*pwLpRr7QPGwAAAAAAAAAAAAAARQnAQ"
      },
      label: {
        fontSize: 12,
        fill: "#262626"
      }
    }
  },
  true
);

Graph.registerNode(
  "subprocess",
  {
    inherit: "rect",
    ports: { ...ports },
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "text", selector: "label" },
      { tagName: "image", selector: "badge" },
      { tagName: "text", selector: "expand" },
      { tagName: "text", selector: "details" }
    ],
    attrs: {
      body: {
        rx: 6,
        ry: 6,
        stroke: "#5F95FF",
        fill: "#FAFBFF",
        strokeWidth: 1
      },
      label: {
        ref: "body",
        refX: "50%",
        refY: "50%",
        textAnchor: "middle",
        textVerticalAnchor: "middle",
        fontSize: 12,
        fill: "#262626"
      },
      badge: {
        ref: "body",
        refX: 0,
        refY: 0,
        x: 6,
        y: 6,
        width: 16,
        height: 16,
        "xlink:href":
          "https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*pwLpRr7QPGwAAAAAAAAAAAAAARQnAQ"
      },
      expand: {
        ref: "body",
        refX: "100%",
        refY: "100%",
        x: -8,
        y: -8,
        textVerticalAnchor: "bottom",
        textAnchor: "end",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#5F95FF",
        cursor: "pointer",
        text: "+",
        event: "subproc:toggle"
      },
      details: {
        ref: "body",
        refX: "50%",
        refY: 44,
        y: 0,
        textAnchor: "middle",
        textVerticalAnchor: "top",
        fontSize: 12,
        fill: "#8C8C8C",
        display: "none",
        textWrap: {
          width: -24
        },
        text: ""
      }
    }
  },
  true
);

registerGateway("gateway-parallel", "⨁");
registerGateway("gateway-exclusive", "×");

Graph.registerNode(
  "lane",
  {
    inherit: "rect",
    markup: [
      {
        tagName: "rect",
        selector: "body"
      },
      {
        tagName: "rect",
        selector: "name-rect"
      },
      {
        tagName: "text",
        selector: "name-text"
      }
    ],
    attrs: {
      body: {
        fill: "#FFF",
        stroke: "#5F95FF",
        strokeWidth: 1
      },
      "name-rect": {
        refWidth: "100%",
        height: 30,
        fill: "#5F95FF",
        stroke: "#fff",
        strokeWidth: 0
      },
      "name-text": {
        ref: "name-rect",
        refY: 0.5,
        refX: 0.5,
        textAnchor: "middle",
        fontWeight: "bold",
        fill: "#fff",
        fontSize: 12
      }
    }
  },
  true
);

Graph.registerEdge(
  "bpmn-edge",
  {
    inherit: "edge",
    attrs: {
      line: {
        stroke: "#a2b1c3",
        strokeWidth: 2,
        targetMarker: "classic"
      }
    }
  },
  true
);

onMounted(() => {
  if (!containerRef.value || !stencilRef.value) return;

  const graph = new Graph({
    container: containerRef.value,
    grid: true,
    connecting: {
      router: "manhattan"
    },
    panning: true,
    embedding: {
      enabled: true,
      findParent({ node }) {
        const bbox = node.getBBox();
        return this.getNodes().filter(n => {
          if (n.shape === "lane") {
            const targetBBox = n.getBBox();
            return targetBBox.containsRect(bbox);
          }
          return false;
        });
      }
    },
    mousewheel: true,
    translating: {
      restrict(this: Graph, cellView: CellView | null) {
        if (cellView?.cell?.isNode()) {
          const cell = cellView.cell as Node;
          if (cell.shape === "lane") {
            return this.transform.getGraphArea();
          }
          const parentId = cell.prop("parent");
          if (parentId) {
            const parentNode = this.getCellById(parentId);
            if (parentNode?.isNode()) {
              const data = parentNode.getData() || {};
              const isHorizontal = data.direction === "horizontal";
              if (isHorizontal) {
                return parentNode.getBBox().moveAndExpand({
                  x: 30,
                  y: 0,
                  width: -30,
                  height: 0
                });
              } else {
                return parentNode.getBBox().moveAndExpand({
                  x: 0,
                  y: 30,
                  width: 0,
                  height: -30
                });
              }
            }
          }
          return this.transform.getGraphArea();
        }
        return this.transform.getGraphArea();
      }
    }
  });
  graph.use(
    new Snapline({
      enabled: true
    })
  );

  graphRef.value = graph;
  graph.use(new Export());

  // 监听节点添加，确保泳道在最底层
  graph.on("node:added", ({ node }) => {
    if (node.shape === "lane") {
      node.toBack();
    }
  });

  // 双击事件
  graph.on("node:dblclick", ({ node }) => {
    closeContextMenu(); // 关闭右键菜单
    currentNode.value = markRaw(node);

    // 获取 Label
    let label = "";
    if (node.shape === "lane") {
      label = node.attr("name-text/text") as string;
    } else {
      label = (node.attr("label/text") as string) || "";
      if (typeof label === "object") {
        label = (label as any)?.text || "";
      }
    }

    // 获取描述
    const data = node.getData() || {};

    nodeForm.label = label;
    nodeForm.description = data.description || "";
    attrVisible.value = true;
  });

  // 监听右键菜单
  graph.on("node:contextmenu", ({ e, node }) => {
    e.preventDefault(); // 阻止默认菜单
    contextMenuState.visible = true;
    contextMenuState.x = e.clientX;
    contextMenuState.y = e.clientY;
    contextMenuState.targetCell = markRaw(node);
  });

  // 边也可以右键删除（可选）
  graph.on("edge:contextmenu", ({ e, edge }) => {
    e.preventDefault();
    contextMenuState.visible = true;
    contextMenuState.x = e.clientX;
    contextMenuState.y = e.clientY;
    contextMenuState.targetCell = markRaw(edge);
  });

  // 画布点击时隐藏菜单
  graph.on("blank:click", () => {
    closeContextMenu();
  });

  const stencil = new Stencil({
    title: "组件库",
    target: graph,
    stencilGraphWidth: 200,
    stencilGraphHeight: 180,
    collapsable: true,
    groups: [
      {
        title: "基础节点",
        name: "group1"
      },
      {
        title: "判断节点",
        name: "group2"
      }
    ],
    layoutOptions: {
      columns: 2,
      columnWidth: 80,
      rowHeight: 55
    },
    getDropNode(node) {
      if (node.shape === "lane") {
        return graph.createNode({
          shape: "lane",
          width: 240,
          height: 500,
          zIndex: -1,
          data: { direction: "vertical" },
          attrs: {
            "name-text": {
              text: "泳道"
            }
          }
        });
      }
      return node.clone();
    }
  });

  stencilRef.value.appendChild(stencil.container);

  const r1 = graph.createNode({
    shape: "start-event",
    width: 40,
    height: 40
  });
  const r2 = graph.createNode({
    shape: "activity",
    width: 80,
    height: 40,
    label: "审批"
  });
  const r3 = graph.createNode({
    shape: "end-event",
    width: 40,
    height: 40
  });
  const r4 = graph.createNode({
    shape: "subprocess",
    width: 80,
    height: 40,
    label: "子流程"
  });
  const r5 = graph.createNode({
    shape: "gateway-exclusive",
    width: 40,
    height: 40
  });
  const r6 = graph.createNode({
    shape: "gateway-parallel",
    width: 40,
    height: 40
  });
  const r7 = graph.createNode({
    shape: "lane",
    width: 80,
    height: 40,
    attrs: {
      "name-text": {
        text: "泳道"
      }
    }
  });

  stencil.load([r1, r2, r3, r7], "group1");
  stencil.load([r5, r6], "group2");

  graph.on("subproc:toggle", ({ node }: { node: Node }) => {
    if (!node || node.shape !== "subprocess") return;

    const data = node.getData() || {};
    const expanded = !!data.expanded;
    const next = !expanded;

    node.attr("expand/text", next ? "-" : "+");
    node.attr("details/display", next ? "block" : "none");

    const defaultDetails = "1、病例证明（如有）\n2、工作 backup";
    const rawDetails = data.details;
    const detailsText = rawDetails
      ? Array.isArray(rawDetails)
        ? rawDetails.join("\n")
        : String(rawDetails)
      : defaultDetails;
    if (next) {
      node.attr("details/text", detailsText);
    }

    const lines = String(detailsText).split(/\n/).length;
    const size = node.getSize();
    const expandedHeight = Math.max(70, 40 + lines * 18 + 24);
    node.size(size.width, next ? expandedHeight : 70);

    if (next) {
      node.attr({
        label: {
          textVerticalAnchor: "top",
          refY: 18,
          refX: "50%",
          ref: "body"
        },
        details: {
          textVerticalAnchor: "top",
          refY: 40,
          refX: "50%",
          ref: "body"
        }
      });
    } else {
      node.attr("label", {
        textVerticalAnchor: "middle",
        refY: "50%",
        refX: "50%",
        ref: "body"
      });
    }

    node.setData({ ...data, expanded: next });
  });

  // Mock Data instead of fetch
  const data: any[] = [];

  const cells: Cell[] = [];
  const nodeMap: Record<string, Node> = {};

  data.forEach((item: any) => {
    if (item.shape !== "bpmn-edge") {
      const node = graph.createNode(item);
      nodeMap[item.id] = node as Node;
      cells.push(node);
    }
  });

  data.forEach((item: any) => {
    if (item.shape === "bpmn-edge") {
      const edge = graph.createEdge(item);
      if (item.label) {
        edge.setLabels([
          {
            attrs: {
              label: {
                text: item.label,
                fill: "#8C8C8C",
                fontSize: 11
              }
            }
          }
        ]);
      }
      const sourceId = edge.getSourceCellId();
      const targetId = edge.getTargetCellId();
      const sParent = nodeMap[sourceId]?.prop("parent");
      const tParent = nodeMap[targetId]?.prop("parent");
      if (sParent && tParent && sParent !== tParent) {
        edge.attr("line/strokeDasharray", "5,5");
      }
      cells.push(edge);
    }
  });
  graph.resetCells(cells);

  Object.values(nodeMap).forEach(node => {
    const parentId = node.prop("parent") as string | undefined;
    if (parentId) {
      const parentNode = nodeMap[parentId];
      if (parentNode) {
        parentNode.addChild(node);
      }
    }
  });

  Object.values(nodeMap).forEach(node => {
    if (node.shape === "activity" && node.prop("parent") === "lane-system") {
      node.attr(
        "img/xlink:href",
        "https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*mUotQqntWJQAAAAAF_AAAAgAemJ7AQ/original"
      );
    }
  });

  graph.zoomToFit({ padding: 10, maxScale: 1 });
});
</script>

<style scoped>
:deep(.x6-port-body) {
  visibility: hidden;
}

/* 仅在画布容器 (#container) 内启用悬浮显示 */
:deep(#container .x6-node:hover .x6-port-body) {
  visibility: visible;
}
</style>

<style scoped>
.main-content {
  margin: 0 !important;
}
</style>
