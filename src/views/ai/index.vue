<template>
  <div class="ai-portal-container">
    <div class="ai-portal-wrapper">
      <t-chatbot
        ref="chatRef"
        :default-messages="mockData"
        :message-props="messageProps"
        :sender-props="senderProps"
        :chat-service-config="chatServiceConfig"
        class="ai-chatbot"
      >
        <template #sender-footer-prefix>
          <div class="model-select">
            <t-tooltip
              v-model:visible="allowToolTip"
              content=""
              trigger="hover"
            >
              <t-select
                v-model="selectValue"
                :options="selectOptions"
                value-type="object"
                class="model-select-dropdown"
                @focus="allowToolTip = false"
              />
            </t-tooltip>
            <t-button
              :class="{ 'is-active': isChecked }"
              variant="outline"
              @click="checkClick"
            >
              <SystemSumIcon />
              <span>深度思考</span>
            </t-button>
          </div>
        </template>
      </t-chatbot>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, watch } from "vue";
import { SystemSumIcon } from "tdesign-icons-vue-next";
import {
  type SSEChunkData,
  type AIMessageContent,
  type TdChatMessageConfigItem,
  type ChatRequestParams,
  type ChatMessagesData,
  type ChatServiceConfig,
  type TdChatbotApi
} from "@tdesign-vue-next/chat";

defineOptions({
  name: "AiPortal"
});

// 默认初始化消息
const mockData: ChatMessagesData[] = [
  {
    id: "123",
    role: "assistant",
    content: JSON.parse(
      JSON.stringify([
        {
          type: "text",
          status: "complete",
          data: "欢迎使用TDesign Chatbot智能助手，你可以这样问我："
        },
        {
          type: "suggestion",
          status: "complete",
          data: [
            {
              title: "南极的自动提款机叫什么名字",
              prompt: "南极的自动提款机叫什么名字？"
            },
            {
              title: "南极自动提款机在哪里",
              prompt: "南极自动提款机在哪里"
            }
          ]
        }
      ])
    )
  }
];

const allowToolTip = ref(false);

const selectOptions = [
  {
    label: "默认模型",
    value: "default"
  },
  {
    label: "Deepseek",
    value: "deepseek-r1"
  },
  {
    label: "混元",
    value: "hunyuan"
  }
];
const selectValue = ref({
  label: "默认模型",
  value: "default"
});
const isChecked = ref(false);
const checkClick = () => {
  isChecked.value = !isChecked.value;
};

const chatRef = ref<TdChatbotApi | null>(null);
const activeR1 = ref(false);
const activeSearch = ref(false);
const reqParamsRef = ref({ think: false, search: false });
// 消息属性配置
const messageProps = (msg: ChatMessagesData): TdChatMessageConfigItem => {
  const { role, content } = msg;
  // 将 content 断言为通用对象数组并使用类型守卫，避免 "text" 与 "thinking" 无重叠的比较报错
  const contentItems = content as unknown as Array<{
    type?: string;
    status?: string;
    [k: string]: any;
  }>;
  const thinking = contentItems.find(item => item.type === "thinking") as
    | { type: "thinking"; status?: string; [k: string]: any }
    | undefined;

  if (role === "user") {
    return {
      variant: "base",
      placement: "right",
      avatar: "https://tdesign.gtimg.com/site/avatar.jpg"
    };
  }
  if (role === "assistant") {
    return {
      placement: "left",
      actions: ["replay", "copy", "good", "bad"],
      handleActions: {
        good: async ({ message, active }) => {
          console.log("点赞", message, active);
        },
        bad: async ({ message, active }) => {
          console.log("点踩", message, active);
        },
        replay: ({ message, active }) => {
          console.log("自定义重新回复", message, active);
          chatRef.value?.regenerate();
        },
        searchItem: ({ content, event }) => {
          event.preventDefault();
          console.log("点击搜索条目", content);
        },
        suggestion: ({ content }) => {
          console.log("点击建议问题", content);
          chatRef.value?.addPrompt(content.prompt);
        }
      },
      chatContentProps: {
        thinking: {
          maxHeight: 100,
          layout: "block",
          collapsed: thinking?.status === "complete"
        }
      }
    };
  }
  return {};
};

// 聊天服务配置
const chatServiceConfig = ref<ChatServiceConfig>({
  endpoint: `https://1257786608-9i9j1kpa67.ap-guangzhou.tencentscf.com/sse/normal`,
  stream: true,
  onComplete: (aborted: boolean, params: RequestInit) => {
    console.log("onComplete", aborted, params);
  },
  onError: (err: Error | Response) => {
    console.error("Chatservice Error:", err);
  },
  onAbort: async () => {},
  onMessage: (chunk: SSEChunkData): AIMessageContent => {
    const { type, ...rest } = chunk.data as any;
    switch (type) {
      case "search":
        return {
          type: "search",
          data: {
            title: rest.title || `搜索到${rest?.docs?.length}条内容`,
            references: rest?.content // 深度克隆
          }
        };
      case "think":
        return {
          type: "thinking",
          status: /耗时/.test(rest?.title) ? "complete" : "streaming",
          data: {
            title: rest.title || "深度思考中",
            text: rest.content || "" // 深度克隆
          }
        };
      case "text":
        return {
          type: "markdown",
          data: rest?.msg || ""
        };
      default:
        return { type: "text", data: "" };
    }
  },
  onRequest: (innerParams: ChatRequestParams) => {
    const { prompt } = innerParams;
    return {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({
        uid: "tdesign-chat",
        prompt,
        ...reqParamsRef.value
      })
    };
  }
});

// 监听状态变化
watch(
  [activeR1, activeSearch],
  ([newR1, newSearch]) => {
    reqParamsRef.value = {
      think: newR1,
      search: newSearch
    };
  },
  { immediate: true }
);

// 发送者属性
const senderProps = {
  placeholder: "有问题，尽管问～ Enter 发送，Shift+Enter 换行"
};
</script>
<style lang="scss" scoped>
.ai-portal-container {
  width: 100%;
  height: calc(100vh - 120px);
  min-height: 600px;
  padding: 24px;
  box-sizing: border-box;
  background: var(--el-bg-color);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.ai-portal-wrapper {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
  // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

:deep(.ai-chatbot) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);

  .t-chatbot__messages {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: var(--el-bg-color);

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-lighter);
      border-radius: 3px;

      &:hover {
        background: var(--el-border-color);
      }
    }
  }

  .t-chatbot__sender {
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .t-chat-message {
    margin-bottom: 24px;

    .t-chat-message__bubble {
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
    }

    &--left .t-chat-message__bubble {
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
    }

    &--right .t-chat-message__bubble {
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
    }
  }

  .model-select {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding: 0 4px;

    .model-select-dropdown {
      width: 140px;
      height: 36px;

      .t-input {
        border-radius: 18px;
        padding: 0 16px;
        font-size: 13px;
        transition: all 0.3s ease;
        border: 1px solid var(--el-border-color);

        &:hover {
          border-color: var(--el-color-primary);
        }
      }

      .t-input.t-is-focused {
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        border-color: var(--el-color-primary);
      }
    }

    .check-box {
      height: 36px;
      padding: 0 16px;
      border-radius: 18px;
      box-sizing: border-box;
      flex: 0 0 auto;
      font-size: 13px;
      transition: all 0.3s ease;
      border: 1px solid var(--el-border-color);
      background: var(--el-bg-color);

      &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
      }

      .t-button__text {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      span {
        font-weight: 500;
      }
    }

    .check-box.is-active {
      border: 1px solid var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);

      &:hover {
        background: var(--el-color-primary-light-8);
      }
    }
  }

  .t-chat-sender {
    .t-input {
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14px;
      border: 1px solid var(--el-border-color);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
      }

      &:focus {
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        border-color: var(--el-color-primary);
      }
    }
  }
}

/* 暗色模式适配 */
html.dark {
  .ai-portal-wrapper {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }

  :deep(.ai-chatbot) {
    .t-chatbot__sender {
      border-top-color: var(--el-border-color);
    }

    .t-chat-message {
      &--left .t-chat-message__bubble {
        background: var(--el-fill-color-dark);
        border-color: var(--el-border-color);
      }

      &--right .t-chat-message__bubble {
        background: var(--el-color-primary-dark-2);
        border-color: var(--el-color-primary);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-portal-container {
    padding: 12px;
    height: calc(100vh - 100px);
  }

  .ai-portal-wrapper {
    border-radius: 8px;
  }

  :deep(.ai-chatbot) {
    .t-chatbot__messages {
      padding: 16px;
    }

    .t-chatbot__sender {
      padding: 12px 16px;
    }

    .model-select {
      flex-wrap: wrap;
      gap: 8px;

      .model-select-dropdown {
        width: 100%;
      }

      .check-box {
        flex: 1;
        min-width: 120px;
      }
    }
  }
}
</style>
