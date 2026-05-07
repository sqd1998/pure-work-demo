<template>
  <el-dialog
    v-model="visible"
    title="运行表单"
    width="720px"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <el-empty
      v-if="!currentNode"
      description="请先在画布中选择一个已配置表单的普通节点"
    />
    <div v-else>
      <div class="runner-header">
        <div class="runner-title">
          {{
            currentNode.properties?.name ||
            currentNode.text?.value ||
            "表单节点"
          }}
        </div>
        <div class="runner-desc">
          {{ currentNode.properties?.desc || "请填写当前节点表单内容" }}
        </div>
      </div>
      <form-create
        v-if="formRule.length"
        v-model:api="formApi"
        :rule="formRule"
        :option="formOption"
      />
      <el-empty
        v-else
        description="当前节点还没有设计表单字段，点击继续进入下一节点"
      />
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!currentNode" @click="submitForm">
        {{ formRule.length ? "提交并继续" : "继续" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { Api, Options, Rule } from "@form-create/element-ui";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["update:modelValue", "submitted", "closed"]);

const formApi = ref<Api | null>(null);

const cloneData = <T,>(data: T): T => {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
};

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const currentNode = computed<any>(() => props.node);

const formRule = computed<Rule[]>(() => {
  return cloneData(currentNode.value?.properties?.formRule || []);
});

const formOption = computed<Options>(() => {
  return cloneData({
    submitBtn: false,
    resetBtn: false,
    ...currentNode.value?.properties?.formOption
  });
});

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      formApi.value = null;
    }
  }
);

const emitSubmitted = (formData = {}) => {
  const submitPayload = {
    nodeId: currentNode.value.id,
    nodeType: currentNode.value.type,
    nodeName: currentNode.value.properties?.name,
    formData: cloneData(formData),
    formRule: formRule.value,
    formOption: formOption.value
  };

  visible.value = false;
  emit("submitted", submitPayload);
  ElMessage.success("表单数据已收集");
};

const submitForm = () => {
  if (!formRule.value.length) {
    emitSubmitted({});
    return;
  }

  if (!formApi.value) {
    ElMessage.warning("表单尚未初始化完成");
    return;
  }

  formApi.value.submit(
    formData => {
      emitSubmitted(formData);
    },
    () => {
      ElMessage.warning("请检查表单必填项或格式");
    }
  );
};

const handleClosed = () => {
  emit("closed");
};
</script>

<style scoped lang="scss">
.runner-header {
  padding: 0 0 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.runner-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.runner-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
