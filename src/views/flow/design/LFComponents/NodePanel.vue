<template>
  <div class="node-panel">
    <el-input
      v-model="filterText"
      prefix-icon="el-icon-search"
      placeholder="输入关键字"
      class="mt15"
      style="margin-bottom: 8px"
    />
    <div>
      <el-tree
        ref="treeRef"
        :data="treeList"
        :default-expanded-keys="['2', '3', '4', '5', '6']"
        node-key="id"
        :props="{
          children: 'children',
          label: 'name'
        }"
        :draggable="false"
        :allow-drop="allowDrop"
        :filter-node-method="filterNodeMethod"
      >
        <template v-slot="{ node, data }">
          <div class="custom-tree-node">
            <start v-if="data.type == 'start'" class="endParallel" />
            <end v-if="data.type == 'end'" class="endParallel" />
            <startParallel
              v-if="data.type == 'endParallel'"
              class="endParallel"
            />
            <rect2
              v-if="data.type == 'rect'"
              class="endParallel"
              style="width: 24px; height: 24px; margin: 0 2px 0 0"
            />
            <circle2
              v-if="data.type == 'circle'"
              class="endParallel"
              style="width: 24px; height: 24px; margin: 0 2px 0 0"
            />
            <ellipse2
              v-if="data.type == 'ellipse'"
              class="endParallel"
              style="
                transform: rotate(90deg);
                width: 23px;
                height: 23px;
                margin: 0;
              "
            />
            <polygon2
              v-if="data.type == 'polygon'"
              class="endParallel"
              style="width: 25px; height: 25px; margin: 0"
            />
            <diamond2
              v-if="data.type == 'diamond'"
              class="endParallel"
              style="width: 25px; height: 25px; margin: 0"
            />

            <rect2
              v-if="data.type == 'background'"
              class="endParallel"
              style="width: 25px; height: 25px; margin: 0"
            />
            <rect2
              v-if="data.type == 'background2'"
              class="endParallel"
              style="
                transform: rotate(90deg);
                width: 25px;
                height: 25px;
                margin: 0;
              "
            />

            <span
              class="drag-label"
              :title="node.label"
              @mousedown="mousedownFunc(data)"
              >{{ node.label }}</span
            >
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { randomNumber } from "@/utils/index";
import start from "@/assets/svg/start.svg?component";
import end from "@/assets/svg/end.svg?component";
import startParallel from "@/assets/svg/startParallel.svg?component";
import rect2 from "@/assets/svg/rect.svg?component";
import circle2 from "@/assets/svg/circle.svg?component";
import ellipse2 from "@/assets/svg/ellipse.svg?component";
import polygon2 from "@/assets/svg/polygon.svg?component";
import diamond2 from "~icons/mingcute/diamond-line";

const props = defineProps({
  lf: {
    type: Object
  }
});

let treeList = ref([
  {
    id: "3",
    name: "基础节点",
    children: [
      {
        id: "31",
        type: "start",
        name: "开始",
        children: []
      },
      {
        id: "39",
        type: "endParallel",
        name: "普通",
        children: []
      },
      {
        id: "40",
        type: "end",
        name: "结束",
        children: []
      }
    ]
  },
  {
    id: "6",
    name: "图形节点",
    children: [
      {
        id: "32",
        type: "rect",
        name: "矩形",
        children: []
      },
      {
        id: "33",
        type: "circle",
        name: "圆形",
        children: []
      },
      {
        id: "34",
        type: "ellipse",
        name: "椭圆",
        children: []
      },
      {
        id: "35",
        type: "polygon",
        name: "多边形",
        children: []
      },
      {
        id: "36",
        type: "diamond",
        name: "菱形",
        children: []
      }
    ]
  },
  {
    id: "4",
    name: "背景节点",
    children: [
      {
        id: "41",
        type: "background",
        name: "横向泳道",
        children: []
      },
      {
        id: "42",
        type: "background2",
        name: "纵向泳道",
        children: []
      }
    ]
  }
]);
let filterText = ref("");
let dragRow = reactive({
  type: "",
  name: ""
}); //拖拽的行
let randomNum = ref(null);

let treeRef = ref(null);

watch(filterText, val => {
  treeRef.value.filter(val);
});

const mousedownFunc = val => {
  let typeList = [
    "start",
    "end",
    "endParallel",
    "rect",
    "circle",
    "ellipse",
    "polygon",
    "diamond",
    "decision",
    "background",
    "background2"
  ];
  if (typeList.includes(val.type)) {
    dragRow = val;
    randomNum.value = randomNumber();
    props.lf.dnd.startDrag({
      type: val.type,
      text: val.name,
      id: randomNum.value
    });
  }
};

// 停止拖拽时节点可放置的位置
const allowDrop = () => {
  return false; // 停止拖拽后树节点位置不发生改变
};

const filterNodeMethod = (value, data) => {
  if (!value) return true;
  return data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1; //支持大小写模糊搜索
};

onMounted(() => {
  props.lf.on("node:dnd-add", () => {
    if (dragRow.type == "start") {
      props.lf.setProperties(randomNum.value, {
        frontend_status: "1", //0配置错误，1配置正常
        name: dragRow.name
      });
    } else if (dragRow.type == "end") {
      props.lf.setProperties(randomNum.value, {
        frontend_status: "1", //0配置错误，1配置正常
        name: dragRow.name
      });
    } else if (dragRow.type == "endParallel") {
      props.lf.setProperties(randomNum.value, {
        name: dragRow.name,
        desc: "",
        frontend_status: "1"
      });
    } else if (dragRow.type == "background" || dragRow.type == "background2") {
      props.lf.setProperties(randomNum.value, {
        name: dragRow.name,
        desc: "",
        frontend_status: "1",
        menu: [],
        text: "123"
      });
    } else if (
      dragRow.type == "rect" ||
      dragRow.type == "circle" ||
      dragRow.type == "ellipse" ||
      dragRow.type == "polygon" ||
      dragRow.type == "diamond"
    ) {
      props.lf.setProperties(randomNum.value, {
        name: dragRow.name,
        desc: "",
        frontend_status: "1",
        menu: []
      });
    }
  });
});
</script>
<style lang="scss" scoped>
.node-panel {
  position: absolute;
  top: 50px;
  left: 25px;
  width: 180px;
  padding: 0 13px 20px;
  background-color: white;
  box-shadow: 0 0 10px 1px rgb(228, 224, 219);
  border-radius: 6px;
  z-index: 101;
}
.node-item {
  margin-bottom: 20px;
}
.node-item-icon {
  width: 30px;
  height: 30px;
  margin-left: 20px;
  background-size: cover;
}
.node-label {
  font-size: 12px;
  margin-top: 5px;
  user-select: none;
}
.custom-tree-node {
  display: flex;
  .drag-label {
    user-select: none; //禁止选择文本
  }

  .endParallel {
    width: 16px;
    height: 16px;
    margin: 1px 4px 0 0;
    font-size: 14px;
    position: relative;
    bottom: 1px;
  }
  .unified-size {
    width: 25px;
    height: 25px;
    margin: 0;
  }
  .rotate-90 {
    transform: rotate(90deg);
  }
}
</style>
