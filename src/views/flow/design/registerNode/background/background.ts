import { createApp, h } from "vue";
import background from "./background.vue";
import { randomNumber } from "@/utils/index";

export default function registerBackground(lf) {
  lf.register("background", ({ HtmlNode, HtmlNodeModel }) => {
    class BackgroundNode extends HtmlNode {
      setHtml(rootEl) {
        const { model } = this.props;
        const el = document.createElement("div");
        rootEl.innerHTML = "";
        rootEl.appendChild(el);

        // Vue 3 使用 createApp 来创建应用实例
        const app = createApp({
          render: () =>
            h(background, {
              properties: model.properties
            })
        });

        // 挂载 Vue 应用到元素上
        app.mount(el);
      }
    }

    class BackgroundModel extends HtmlNodeModel {
      createId() {
        return randomNumber(); //id用随机数数字
      }
      constructor(data, graphModel) {
        super(data, graphModel);
        // 右键菜单自由配置
        this.menu = [
          {
            text: "删除",
            callback(node) {
              lf.deleteNode(node.id);
            }
          },
          {
            text: "复制",
            callback(node) {
              lf.cloneNode(node.id);
            }
          }
        ];
      }
      // 返回空数组表示没有连接点
      getDefaultAnchor() {
        return [];
      }
      initNodeData(data) {
        super.initNodeData(data);
        const width = 900; // 设置固定宽度为700px
        const height = 200;
        this.width = width;
        this.height = height;
        this.text.value = "";
        // 允许拖动
        this.draggable = true;
        // 禁用默认旋转功能，通过右击菜单实现
        this.rotatable = false;
        // 禁止双击打开侧边框
        this.textEdit = false;
        this.nodeTextEdit = false;
        this.zIndex = -1000;
        this.autoToFront = false; // 禁止自动置顶
        this.properties.autoToFront = false;
      }
    }
    return {
      view: BackgroundNode,
      model: BackgroundModel
    };
  });
}
