<template>
  <div class="form-designer-panel">
    <FcDesigner
      ref="designerRef"
      class="form-designer-panel__designer"
      :height="height"
      :config="designerConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import FcDesigner from "@form-create/designer";
import type { Config } from "@form-create/designer";
import type { Options, Rule } from "@form-create/element-ui";

const props = defineProps({
  rule: {
    type: Array,
    default: () => []
  },
  option: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: [String, Number],
    default: "720px"
  }
});

const designerRef = ref<InstanceType<typeof FcDesigner> | null>(null);

const pocAllowedItems = ["input", "datePicker", "timePicker", "timeRange"];
const pocHiddenItems = [
  "textarea",
  "password",
  "inputNumber",
  "number",
  "radio",
  "checkbox",
  "select",
  "switch",
  "rate",

  "slider",
  "dateRange",
  "colorPicker",
  "cascader",
  "upload",
  "transfer",
  "elTransfer",
  "tree",
  "treeSelect",
  "elTreeSelect",
  "editor",
  "wangEditor",
  "signaturePad",
  "group",
  "subForm",
  "tableForm",
  "tableFormColumn",
  "alert",
  "button",
  "text",
  "title",
  "html",
  "divider",
  "tag",
  "image",
  "row",
  "table",
  "tabs",
  "space",
  "card",
  "collapse",
  "col",
  "tabPane",
  "collapseItem"
];

const designerConfig = computed<Config>(() => ({
  showSaveBtn: false,
  showAi: false,
  showLanguage: false,
  showJsonPreview: false,
  showInputData: false,
  showDevice: false,
  showPreviewBtn: false,
  hiddenMenu: ["subform", "aide", "layout"],
  hiddenItem: pocHiddenItems,
  allowDrag: {
    default: pocAllowedItems
  },
  formOptions: {
    submitBtn: false,
    resetBtn: false
  }
}));

const cloneData = <T,>(data: T): T => {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
};

const getRule = (): Rule[] => {
  return cloneData(filterPocRules(designerRef.value?.getRule?.() || []));
};

const getOption = (): Options => {
  return cloneData(
    designerRef.value?.getOption?.() || {
      submitBtn: false,
      resetBtn: false
    }
  );
};

const isPocRule = (rule: Rule) => {
  return pocAllowedItems.includes(rule?._fc_drag_tag || rule?.type);
};

const filterPocRules = (rules: Rule[] = []) => {
  return rules.filter(isPocRule);
};

const setRule = (rule: Rule[] = []) => {
  designerRef.value?.setRule?.(cloneData(filterPocRules(rule)));
};

const setOption = (option: Options = {}) => {
  designerRef.value?.setOption?.(
    cloneData({
      submitBtn: false,
      resetBtn: false,
      ...option
    })
  );
};

const loadDesignerData = async () => {
  await nextTick();
  setRule((props.rule || []) as Rule[]);
  setOption((props.option || {}) as Options);
};

watch(
  () => [props.rule, props.option],
  () => {
    loadDesignerData();
  },
  { immediate: true, deep: true }
);

defineExpose({
  getRule,
  getOption,
  setRule,
  setOption
});
</script>

<style scoped lang="scss">
.form-designer-panel {
  width: 100%;
  min-width: 960px;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;

  &__designer {
    width: 100%;
  }

  :deep(._fc-designer) {
    overflow: hidden;
  }
}
</style>
