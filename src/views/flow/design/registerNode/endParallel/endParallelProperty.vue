<template>
  <div class="end-parallel-property">
    <el-tabs v-model="activeTab" class="property-tabs">
      <template #extra>
        <div v-if="showActions && flowDetail.status != '2'" class="action-bar">
          <el-button @click="cancelFunc">取消</el-button>
          <el-button type="primary" @click="confirmFunc">保存并关闭</el-button>
        </div>
      </template>
      <el-tab-pane label="基础信息" name="basic">
        <el-form
          ref="propertyFormRef"
          :model="propertyForm"
          :inline-message="true"
          :rules="rules"
          label-position="top"
          :disabled="flowDetail.status == '2'"
        >
          <el-form-item label="名称" prop="name">
            <el-input v-model="propertyForm.name" clearable />
          </el-form-item>
          <el-form-item label="描述" prop="desc">
            <el-input v-model="propertyForm.desc" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="表单设计" name="form">
        <FormDesignerPanel
          ref="formDesignerRef"
          height="calc(100vh - 150px)"
          :rule="propertyForm.formRule"
          :option="propertyForm.formOption"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import type { FormInstance } from "element-plus";
import type { Options, Rule } from "@form-create/element-ui";
import FormDesignerPanel from "../../components/FormDesignerPanel.vue";

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  showActions: {
    type: Boolean,
    default: true
  },
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {};
    }
  }
});
const emit = defineEmits(["closed"]);

const defaultFormOption = (): Options => ({
  submitBtn: false,
  resetBtn: false
});

const cloneData = <T,>(data: T): T => {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
};

let activeTab = ref("basic");
let propertyForm = reactive({
  name: "",
  desc: "",
  assignList: [],
  formRule: [] as Rule[],
  formOption: defaultFormOption()
});
let rules: any = reactive({
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ],
  desc: [
    {
      max: 50,
      message: "最大50字符"
    }
  ]
});
let propertyFormRef = ref<FormInstance | null>(null);
let formDesignerRef = ref<InstanceType<typeof FormDesignerPanel> | null>(null);

//更新节点属性
const setProperties = () => {
  const formRule = formDesignerRef.value?.getRule?.() || propertyForm.formRule;
  const formOption =
    formDesignerRef.value?.getOption?.() || propertyForm.formOption;

  props.lf.setProperties(props.nodeData.id, {
    name: propertyForm.name,
    desc: propertyForm.desc,
    frontend_status: "1", //0配置错误，1配置正常
    formRule: cloneData(formRule),
    formOption: cloneData(formOption)
  });
};

//确定
const confirmFunc = () => {
  propertyFormRef.value?.validate(valid => {
    if (valid) {
      setProperties();
      props.lf.updateText(props.nodeData.id, propertyForm.name);
      emit("closed");
    }
  });
};

//取消
const cancelFunc = () => {
  emit("closed");
};

defineExpose({
  confirmFunc,
  cancelFunc
});

onMounted(() => {
  propertyForm.name = props.nodeData.properties.name;
  propertyForm.desc = props.nodeData.properties.desc
    ? props.nodeData.properties.desc
    : "";
  propertyForm.formRule = cloneData(props.nodeData.properties.formRule || []);
  propertyForm.formOption = cloneData(
    props.nodeData.properties.formOption || defaultFormOption()
  );
});
</script>
<style scoped lang="scss">
.end-parallel-property {
  display: flex;
  flex-direction: column;
  min-width: 980px;
  height: 100%;
  overflow: hidden;
}

.property-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    flex: none;
    margin-bottom: 12px;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.action-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
