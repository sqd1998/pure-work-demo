<script setup lang="ts">
import { useRouter } from "vue-router";
import noAccess from "@/assets/status/403.svg?component";
import { onMounted, onUnmounted } from "vue";
import { message } from "@/utils/message";
import { storageLocal } from "@pureadmin/utils";
import { getLogin } from "@/api/user";

defineOptions({
  name: "403"
});
interface UserInfo {
  pk?: number;
}

const router = useRouter();
onMounted(() => {
  window.addEventListener("visibilitychange", handleVisible);
});
onUnmounted(() => {
  window.removeEventListener("visibilitychange", handleVisible);
});
const handleVisible = e => {
  if (
    e.target.visibilityState === "visible" ||
    e.target.visibilityState === "unloaded"
  ) {
    console.info("触发刷新");
  }
};
const toWps = () => {
  sessionStorage.wpsUrl =
    "https://wwo.wps.cn/office/w/55bd82a90c5d4db89b2d5d5386a4f0e4?_w_appid=5b8f173bd752464d81b7aa78001c697f&_w_filepath=%E3%80%90%E4%B8%A4%E4%BC%9A%E3%80%91%E4%B9%A6%E5%86%99%E6%96%B0%E6%97%B6%E4%BB%A3%E5%85%89%E8%BE%89.docx&_w_filetype=db&_w_tokentype=1&_w_userid=3&_w_signature=lHlhT63GJlvBwRbtrzj10lgm5w4%3D";
  sessionStorage.token = "38106";
  const jump = router.resolve({ name: "toWps" });
  window.open(jump.href, "_blank");
};
const getViewUrlDbPath = async (id: string) => {
  if (!id) {
    message("请选择文件！", { type: "error" });
    return;
  }
  const pk = (storageLocal().getItem("user-info") as UserInfo).pk;
  const params = {
    fileId: id,
    userId: pk
  };
  await getLogin(params)
    .then(res => {
      if (res.data) {
        let r = (res as any).data.data;
        sessionStorage.wpsUrl = r.wpsUrl;
        sessionStorage.token = r.token;
      } else {
        message("请求错误！", { type: "error" });
      }
    })
    .catch(() => {
      message("请求错误！", { type: "error" });
    });
};
</script>

<template>
  <div
    class="flex flex-col md:flex-row justify-center items-center min-h-full w-full p-4 md:p-0"
  >
    <noAccess />
    <div class="mt-8 md:ml-12 md:mt-0 text-center md:text-left">
      <p
        v-motion
        class="font-medium text-4xl mb-4! dark:text-white"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 80
          }
        }"
      >
        403
      </p>
      <p
        v-motion
        class="text-xl mb-4! text-gray-500"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 120
          }
        }"
      >
        抱歉，你无权访问该页面
      </p>
      <el-button
        v-motion
        type="primary"
        class="block mx-auto md:inline-block md:mx-0"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 160
          }
        }"
        @click="toWps()"
      >
        返回首页
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  margin: 0 !important;
}
</style>
