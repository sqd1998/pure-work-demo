<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { usePermissionStoreHook } from "@/store/modules/permission";
import ChevronRight from "~icons/ep/arrow-right";

const router = useRouter();
const menus = computed(() => usePermissionStoreHook().wholeMenus);

const activeIndex = ref<number | null>(null);
const activeSubIndex = ref<number | null>(null);

let closeTimer: any = null;

const handleMouseEnter = (index: number) => {
  if (closeTimer) clearTimeout(closeTimer);
  activeIndex.value = index;
  // Default to first sub-menu if available
  if (menus.value[index].children && menus.value[index].children.length > 0) {
    // Find first visible child
    const firstChildIndex = menus.value[index].children.findIndex(
      child => !child.meta?.hidden
    );
    activeSubIndex.value = firstChildIndex !== -1 ? firstChildIndex : null;
  } else {
    activeSubIndex.value = null;
  }
};

const handleMouseLeave = () => {
  closeTimer = setTimeout(() => {
    activeIndex.value = null;
    activeSubIndex.value = null;
  }, 200); // Small delay to allow moving cursor to submenu
};

const handleOverlayEnter = () => {
  if (closeTimer) clearTimeout(closeTimer);
};

const handleOverlayLeave = () => {
  handleMouseLeave();
};

const handleSubMenuEnter = (index: number) => {
  activeSubIndex.value = index;
};

const navigateTo = (route: any) => {
  if (route.children && route.children.length > 0) {
    // If it has children, maybe don't navigate or navigate to redirect?
    // For now, let's assume leaf nodes are clickable
    return;
  }
  router.push({ name: route.name });
  activeIndex.value = null;
};

// Helper to resolve icon
const getIcon = (item: any) => {
  return item.meta?.icon;
};

const isExternal = (path: string) => /^(https?:|mailto:|tel:)/.test(path);

const handleLinkClick = (item: any) => {
  if (isExternal(item.path)) {
    window.open(item.path, "_blank");
  } else {
    router.push(item.path);
  }
  activeIndex.value = null;
};
</script>

<template>
  <div class="mega-menu-container" @mouseleave="handleMouseLeave">
    <!-- Level 1 Menu -->
    <ul class="level-1-menu">
      <li
        v-for="(item, index) in menus"
        :key="item.path"
        class="level-1-item"
        :class="{ active: activeIndex === index }"
        @mouseenter="handleMouseEnter(index)"
        @click="
          (!item.children || item.children.length === 0) &&
          handleLinkClick(item)
        "
      >
        <span class="menu-title">
          <component
            :is="useRenderIcon(item.meta.icon)"
            v-if="item.meta?.icon"
            class="menu-icon"
          />
          {{ item.meta?.title }}
        </span>
        <span
          v-if="item.children && item.children.length > 0"
          class="arrow-icon"
        >
          <!-- Optional arrow -->
        </span>
      </li>
    </ul>

    <!-- Mega Overlay -->
    <div
      v-if="activeIndex !== null && menus[activeIndex]?.children?.length"
      class="mega-overlay"
      @mouseenter="handleOverlayEnter"
      @mouseleave="handleOverlayLeave"
    >
      <div class="mega-content">
        <!-- Level 2 (Left Sidebar) -->
        <div class="level-2-sidebar">
          <div
            v-for="(subItem, subIndex) in menus[activeIndex].children"
            v-show="!subItem.meta?.hidden"
            :key="subItem.path"
            class="level-2-item"
            :class="{ active: activeSubIndex === subIndex }"
            @mouseenter="handleSubMenuEnter(subIndex)"
            @click="
              (!subItem.children || subItem.children.length === 0) &&
              handleLinkClick(subItem)
            "
          >
            <span class="sub-title">{{ subItem.meta?.title }}</span>
            <ChevronRight
              v-if="subItem.children && subItem.children.length"
              class="chevron"
            />
          </div>
        </div>

        <!-- Level 3 (Right Content) -->
        <div v-if="activeSubIndex !== null" class="level-3-content">
          <div class="level-3-grid">
            <template
              v-if="menus[activeIndex].children[activeSubIndex]?.children"
            >
              <div
                v-for="leafItem in menus[activeIndex].children[activeSubIndex]
                  .children"
                v-show="!leafItem.meta?.hidden"
                :key="leafItem.path"
                class="level-3-item"
                @click="handleLinkClick(leafItem)"
              >
                <div class="leaf-card">
                  <component
                    :is="useRenderIcon(leafItem.meta.icon)"
                    v-if="leafItem.meta?.icon"
                    class="leaf-icon"
                  />
                  <div class="leaf-info">
                    <span class="leaf-title">{{ leafItem.meta?.title }}</span>
                    <!-- Assuming we might want a description if available, mimicking Aliyun -->
                    <!-- <span class="leaf-desc">Description here</span> -->
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="no-children">
              <!-- If Level 2 item has no children, maybe show itself or empty -->
              <span>No further items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mega-menu-container {
  position: relative;
  height: 100%;
}

.level-1-menu {
  display: flex;
  height: 100%;
  padding: 0;
  margin: 0;
  list-style: none;

  .level-1-item {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    cursor: pointer;
    transition: all 0.3s;

    &:hover,
    &.active {
      color: var(--el-color-primary);
      background-color: rgb(0 0 0 / 2%);

      &::after {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        content: "";
        background-color: var(--el-color-primary);
      }
    }

    .menu-title {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }
}

.mega-overlay {
  position: fixed;
  top: var(--el-header-height, 48px); /* Adjust based on header height */
  left: 0;
  z-index: 2000;
  width: 100vw;
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 8px 16px rgb(0 0 0 / 10%);
}

.mega-content {
  display: flex;
  max-width: 1400px; /* Or 100% if full width desired */
  height: 100%;
  min-height: 400px;
  margin: 0 auto;
}

.level-2-sidebar {
  flex-shrink: 0;
  width: 240px;
  padding: 20px 0;
  background: #f7f9fa;
  border-right: 1px solid #eee;

  .level-2-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;

    &:hover,
    &.active {
      color: var(--el-color-primary);
      background: #fff;

      .chevron {
        color: var(--el-color-primary);
      }
    }

    .sub-title {
      font-weight: 500;
    }

    .chevron {
      font-size: 12px;
      color: #999;
    }
  }
}

.level-3-content {
  flex: 1;
  padding: 30px 40px;
  background: #fff;
}

.level-3-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.level-3-item {
  cursor: pointer;

  .leaf-card {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      background-color: #f7f9fa;

      .leaf-title {
        color: var(--el-color-primary);
      }
    }
  }

  .leaf-icon {
    margin-top: 2px;
    margin-right: 12px;
    font-size: 20px;
    color: #666;
  }

  .leaf-info {
    display: flex;
    flex-direction: column;
  }

  .leaf-title {
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .leaf-desc {
    font-size: 12px;
    line-height: 1.5;
    color: #999;
  }
}
</style>
