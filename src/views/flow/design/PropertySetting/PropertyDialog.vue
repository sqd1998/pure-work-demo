<template>
  <div>
    <el-drawer
      v-model="showNodeAttribute"
      :wrapperClosable="true"
      direction="rtl"
      :size="drawerSize"
      append-to-body
      :close-on-click-modal="true"
      @closed="closed"
    >
      <template #header>
        <div class="drawer-header">
          <div class="unit">
            {{ getLabelByValue(nodeData.type, pixelOption, "value", "label") }}
          </div>
          <div v-if="nodeData.type === 'endParallel'" class="drawer-actions">
            <el-button @click="closed">取消</el-button>
            <el-button type="primary" @click="saveEndParallelProperty">
              保存并关闭
            </el-button>
          </div>
        </div>
      </template>
      <div class="property-dialog-body">
        <startProperty
          v-if="nodeData.type === 'start'"
          :title="title"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <endProperty
          v-if="nodeData.type === 'end'"
          :title="title"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <graphicProperty
          v-if="
            ['rect', 'circle', 'ellipse', 'polygon', 'diamond'].includes(
              nodeData.type
            )
          "
          :title="title"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />

        <endParallelProperty
          v-if="nodeData.type === 'endParallel'"
          ref="endParallelPropertyRef"
          :title="title"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          :showActions="false"
          @closed="closed"
        />

        <!-- 连线 -->
        <myBezier
          v-if="nodeData.type === 'myBezier'"
          :title="title"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import startProperty from "../registerNode/start/startProperty.vue";
import endProperty from "../registerNode/end/endProperty.vue";
import graphicProperty from "../registerNode/graphic/graphicProperty.vue";
import endParallelProperty from "../registerNode/endParallel/endParallelProperty.vue";
import myBezier from "../registerEdge/myBezier.vue";

const props = defineProps({
  //标题
  title: {
    type: String,
    default: ""
  },
  nodeData: Object,
  lf: Object,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {};
    }
  }
});
const pixelOption = [
  {
    value: "start",
    label: "开始"
  },
  {
    value: "end",
    label: "结束"
  },
  {
    value: "rect",
    label: "矩形节点"
  },
  {
    value: "circle",
    label: "圆形节点"
  },
  {
    value: "ellipse",
    label: "椭圆节点"
  },
  {
    value: "diamond",
    label: "菱形节点"
  },
  {
    value: "polygon",
    label: "多边形节点"
  },
  {
    value: "endParallel",
    label: "表单节点"
  },
  {
    value: "background",
    label: "横向泳道节点"
  },
  {
    value: "background2",
    label: "纵向泳道节点"
  },
  {
    value: "myBezier",
    label: "连线"
  }
];
const emit = defineEmits(["closed"]);

const drawerSize = computed(() => {
  return props.nodeData?.type === "endParallel" ? "88vw" : "550px";
});

let showNodeAttribute = ref(true);
let endParallelPropertyRef = ref(null);
const getLabelByValue = (
  value: any,
  arr: any[],
  typeValue: string | number,
  typeLabel: string | number
) => {
  let label = "";
  arr.forEach(i => {
    if (i[typeValue] == value) {
      label = i[typeLabel];
    }
  });
  return label;
};

const saveEndParallelProperty = () => {
  endParallelPropertyRef.value?.confirmFunc?.();
};

//弹窗关闭
const closed = () => {
  emit("closed", true);
};

onMounted(() => {});
</script>
<style scoped lang="scss">
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-right: 32px;
}

.property-dialog-body {
  height: 100%;
  overflow: hidden;
}

:deep(.el-drawer__body) {
  padding: 0 20px 16px;
  overflow: hidden;
}
</style>
