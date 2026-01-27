<script setup lang="ts">
import type {
  AttachmentsProps,
  BubbleListProps,
  ConversationsProps,
  PromptsProps
} from "ant-design-x-vue";
import type { VNode } from "vue";
import {
  CloudUploadOutlined,
  CommentOutlined,
  EllipsisOutlined,
  FireOutlined,
  HeartOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReadOutlined,
  ShareAltOutlined,
  SmileOutlined
} from "@ant-design/icons-vue";
import { Badge, Button, Flex, Space, Typography, theme } from "ant-design-vue";
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  useXAgent,
  useXChat,
  Welcome
} from "ant-design-x-vue";
import aiPng from "@/assets/home/ai.png";
import { computed, h, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const { token } = theme.useToken();

const styles = computed(() => {
  return {
    layout: {
      width: "100%",
      "min-width": "970px",
      height: "722px",
      "border-radius": `${token.value.borderRadius}px`,
      display: "flex",
      background: `${token.value.colorBgContainer}`,
      "font-family": `AlibabaPuHuiTi, ${token.value.fontFamily}, sans-serif`
    },
    menu: {
      background: `${token.value.colorBgLayout}80`,
      width: "280px",
      height: "100%",
      display: "flex",
      "flex-direction": "column"
    },
    conversations: {
      padding: "0 12px",
      flex: 1,
      "overflow-y": "auto"
    },
    chat: {
      height: "100%",
      width: "100%",
      "max-width": "700px",
      margin: "0 auto",
      "box-sizing": "border-box",
      display: "flex",
      "flex-direction": "column",
      padding: `${token.value.paddingLG}px`,
      gap: "16px"
    },
    messages: {
      flex: 1
    },
    placeholder: {
      "padding-top": "32px",
      "text-align": "left",
      flex: 1
    },
    sender: {
      "box-shadow": token.value.boxShadow
    },
    logo: {
      display: "flex",
      height: "72px",
      "align-items": "center",
      "justify-content": "start",
      padding: "0 24px",
      "box-sizing": "border-box"
    },
    "logo-img": {
      width: "24px",
      height: "24px",
      display: "inline-block"
    },
    "logo-span": {
      display: "inline-block",
      margin: "0 8px",
      "font-weight": "bold",
      color: token.value.colorText,
      "font-size": "16px"
    },
    addBtn: {
      background: "#1677ff0f",
      border: "1px solid #1677ff34",
      width: "calc(100% - 24px)",
      margin: "0 12px 24px 12px"
    }
  } as const;
});

defineOptions({ name: "AI助手独立设置" });

const sleep = () => new Promise(resolve => setTimeout(resolve, 500));

function renderTitle(icon: VNode, title: string) {
  return h(Space, { align: "start" }, () => [icon, h("span", title)]);
}

const defaultConversationsItems = [
  {
    key: "0",
    label: "什么是 Ant Design X？"
  }
];

const placeholderPromptsItems: PromptsProps["items"] = [
  {
    key: "1",
    label: renderTitle(
      h(FireOutlined, { style: { color: "#FF4D4F" } }),
      "热门话题"
    ),
    description: "您对什么感兴趣？",
    children: [
      {
        key: "1-1",
        description: `我今天的会议安排？`
      },
      {
        key: "1-2",
        description: `什么是 AGI？`
      },
      {
        key: "1-3",
        description: `文档在哪里？`
      }
    ]
  },
  {
    key: "2",
    label: renderTitle(
      h(ReadOutlined, { style: { color: "#1890FF" } }),
      "工作指南"
    ),
    description: "如何设计一个好的产品？",
    children: [
      {
        key: "2-1",
        icon: h(HeartOutlined),
        description: `了解优秀设计`
      },
      {
        key: "2-2",
        icon: h(SmileOutlined),
        description: `设置 AI 角色`
      },
      {
        key: "2-3",
        icon: h(CommentOutlined),
        description: `表达感受`
      }
    ]
  }
];

const senderPromptsItems: PromptsProps["items"] = [
  {
    key: "1",
    description: "热门话题",
    icon: h(FireOutlined, { style: { color: "#FF4D4F" } })
  },
  {
    key: "2",
    description: "设计指南",
    icon: h(ReadOutlined, { style: { color: "#1890FF" } })
  }
];

const roles: BubbleListProps["roles"] = {
  ai: {
    placement: "start",
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: "16px"
      }
    }
  },
  local: {
    placement: "end",
    variant: "shadow"
  }
};

// ==================== 状态 ====================
const headerOpen = ref(false);
const content = ref("");
const conversationsItems = ref(defaultConversationsItems);
const activeKey = ref(defaultConversationsItems[0].key);
const attachedFiles = ref<AttachmentsProps["items"]>([]);
const agentRequestLoading = ref(false);

// ==================== 运行时 ====================
const [agent] = useXAgent<string, { message: string }, string>({
  request: async ({ message }, { onSuccess }) => {
    agentRequestLoading.value = true;
    await sleep();
    agentRequestLoading.value = false;
    onSuccess([`模拟成功返回。您说：${message}`]);
  }
});

const { onRequest, messages, setMessages } = useXChat({
  agent: agent.value
});

watch(
  activeKey,
  () => {
    if (activeKey.value !== undefined) {
      setMessages([]);
    }
  },
  { immediate: true }
);

// ==================== 事件 ====================
function onSubmit(nextContent: string) {
  if (!nextContent) return;
  if (another) {
    another.close();
  }
  const routeUrl = router.resolve({
    path: "/aichat",
    query: {
      message: nextContent
    }
  });
  var another = window.open(routeUrl.href, "_blank");

  //进入提问 onRequest(nextContent);

  content.value = "";
}

const onPromptsItemClick: PromptsProps["onItemClick"] = info => {
  if (another) {
    another.close();
  }
  const routeUrl = router.resolve({
    path: "/aichat",
    query: {
      message: info.data.description as string
    }
  });
  var another = window.open(routeUrl.href, "_blank");
  // onRequest(info.data.description as string);
};

function onAddConversation() {
  conversationsItems.value = [
    ...conversationsItems.value,
    {
      key: `${conversationsItems.value.length}`,
      label: `新对话 ${conversationsItems.value.length}`
    }
  ];
  activeKey.value = `${conversationsItems.value.length}`;
}

const onConversationClick: ConversationsProps["onActiveChange"] = key => {
  activeKey.value = key;
};

const handleFileChange: AttachmentsProps["onChange"] = info =>
  (attachedFiles.value = info.fileList);

// ==================== 节点 ====================
const placeholderNode = computed(() =>
  h(
    Space,
    { direction: "vertical", size: 16, style: styles.value.placeholder },
    () => [
      h(Welcome, {
        variant: "borderless",
        icon: h("img", {
          src: aiPng,
          style: {
            width: "48px",
            height: "48px"
          }
        }),
        title: "您好，我是 智见助手",
        description: "基于 Deep Seek 的 Ai 大模型智能体，创造更智能的工作体验~"
        // extra: h(Space, {}, () => [
        //   h(Button, { icon: h(ShareAltOutlined) }),
        //   h(Button, { icon: h(EllipsisOutlined) })
        // ])
      }),
      h(Prompts, {
        title: "您想了解什么？",
        items: placeholderPromptsItems,
        styles: {
          list: {
            width: "100%"
          },
          item: {
            flex: 1
          }
        },
        onItemClick: onPromptsItemClick
      })
    ]
  )
);

const items = computed<BubbleListProps["items"]>(() => {
  if (messages.value.length === 0) {
    return [{ content: placeholderNode, variant: "borderless" }];
  }
  return messages.value.map(({ id, message, status }) => ({
    key: id,
    loading: status === "loading",
    role: status === "local" ? "local" : "ai",
    content: message
  }));
});
</script>

<template>
  <div :style="styles.layout">
    <div v-show="false" :style="styles.menu">
      <!-- 🌟 Logo -->
      <div :style="styles.logo">
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable="false"
          alt="logo"
          :style="styles['logo-img']"
        />
        <span :style="styles['logo-span']">Ant Design X Vue</span>
      </div>

      <!-- 🌟 添加会话 -->
      <Button type="link" :style="styles.addBtn" @click="onAddConversation">
        <PlusOutlined />
        新建对话
      </Button>

      <!-- 🌟 会话管理 -->
      <Conversations
        :items="conversationsItems"
        :style="styles.conversations"
        :active-key="activeKey"
        @active-change="onConversationClick"
      />
    </div>

    <div :style="styles.chat">
      <!-- 🌟 消息列表 -->
      <Bubble.List :items="items" :roles="roles" :style="styles.messages" />

      <!-- 🌟 提示词 -->
      <Prompts :items="senderPromptsItems" @item-click="onPromptsItemClick" />

      <!-- 🌟 输入框 -->
      <Sender
        :value="content"
        :style="styles.sender"
        :loading="agentRequestLoading"
        @submit="onSubmit"
        @change="value => (content = value)"
      >
        <template #prefix>
          <Badge :dot="attachedFiles.length > 0 && !headerOpen">
            <Button type="text" @click="onSubmit('openAttachments')">
              <template #icon>
                <PaperClipOutlined />
              </template>
            </Button>
          </Badge>
        </template>

        <template #header>
          <Sender.Header
            title="附件"
            :open="headerOpen"
            :styles="{ content: { padding: 0 } }"
            @open-change="open => (headerOpen = open)"
          >
            <Attachments
              :before-upload="() => false"
              :items="attachedFiles"
              @change="handleFileChange"
            >
              <template #placeholder="type">
                <Flex
                  v-if="type && type.type === 'inline'"
                  align="center"
                  justify="center"
                  vertical
                  gap="2"
                >
                  <Typography.Text style="font-size: 30px; line-height: 1">
                    <CloudUploadOutlined />
                  </Typography.Text>
                  <Typography.Title
                    :level="5"
                    style="margin: 0; font-size: 14px; line-height: 1.5"
                  >
                    上传文件
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    点击或将文件拖拽到此区域上传
                  </Typography.Text>
                </Flex>
                <Typography.Text v-if="type && type.type === 'drop'">
                  将文件拖拽到此处
                </Typography.Text>
              </template>
            </Attachments>
          </Sender.Header>
        </template>
      </Sender>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.main-content {
  width: 97% !important;
  overflow: hidden;
  height: 85vh !important;
}
</style>
