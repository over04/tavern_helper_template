<template>
  <!-- 生成浮层只挂在全屏壳里：楼层内的紧凑面板沿用酒馆原生的生成提示，不叠一层 -->
  <div v-if="生成中" class="ls-浮层" role="status" aria-live="polite">
    <div class="ls-浮层-卡">
      <span class="ls-浮层-转圈" aria-hidden="true"></span>
      <p class="ls-浮层-标题">模型正在生成</p>
      <p class="ls-浮层-读数">{{ 字数读数 }}</p>
      <div class="ls-浮层-按钮组">
        <button class="ls-浮层-按钮 ls-浮层-停止" type="button" @click="停止生成">
          <i class="fa-solid fa-stop" aria-hidden="true"></i>
          停止生成
        </button>
        <button class="ls-浮层-按钮 ls-浮层-退出" type="button" @click="切换全屏">
          <i class="fa-solid fa-compress" aria-hidden="true"></i>
          退出全屏
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 切换全屏 } from '../全屏';
import { 已生成字数, 生成中, 停止生成 } from '../生成状态';

const 字数读数 = computed(() => (已生成字数.value > 0 ? `已生成 ${已生成字数.value} 字` : '正在接收内容'));
</script>

<style lang="scss" scoped>
/* 遮罩只盖住全屏壳，不盖住酒馆页面本身：界面之外的区域本来就不属于它。
   半透明而不是全遮：生成期间内容仍在往下走，玩家看得见才安心。 */
.ls-浮层 {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: var(--ls-遮罩);
}

.ls-浮层-卡 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  max-width: 280px;
  padding: 22px 24px 20px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
  box-shadow: var(--ls-shadow-lift);
  text-align: center;
}

.ls-浮层-转圈 {
  width: 26px;
  height: 26px;
  margin-bottom: 4px;
  border: 2px solid var(--ls-accent-line);
  border-top-color: var(--ls-accent);
  border-radius: 50%;
  animation: ls-浮层-转 0.9s linear infinite;
}

@keyframes ls-浮层-转 {
  to {
    transform: rotate(360deg);
  }
}

.ls-浮层-标题 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ls-text);
}

.ls-浮层-读数 {
  margin: 0;
  font-size: 12.5px;
  color: var(--ls-text-muted);
}

.ls-浮层-按钮组 {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.ls-浮层-按钮 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border-radius: var(--ls-r-sm);
  font-size: 13px;
  cursor: pointer;
}

/* 停止生成是主要动作，退出全屏是次要动作：主次靠底色区分，悬停只改颜色不动位置 */
.ls-浮层-停止 {
  border: none;
  background: var(--ls-accent);
  color: var(--ls-surface);
}

.ls-浮层-退出 {
  border: 1px solid var(--ls-border-strong);
  background: transparent;
  color: var(--ls-text-body);
}

@media (hover: hover) {
  .ls-浮层-停止:hover {
    background: var(--ls-accent-hover);
  }

  .ls-浮层-退出:hover {
    border-color: var(--ls-accent-line);
    background: var(--ls-surface-hover);
    color: var(--ls-text);
  }
}
</style>
