<template>
  <section v-if="entries.length" class="ls-events">
    <CollapsibleList class="ls-event-list" :items="entries" :limit="3">
      <template #default="{ items }">
        <article v-for="[name, ev] in items" :key="name" class="ls-event">
          <header class="ls-event-head">
            <h4 class="ls-event-name">{{ name }}</h4>
            <span v-if="ev.发生时间" class="ls-event-time">{{ ev.发生时间 }}</span>
            <span v-if="ev.截止时间" class="ls-event-deadline">{{ ev.截止时间 }}</span>
            <span v-if="ev.所属主题" class="ls-event-theme">{{ ev.所属主题 }}</span>
          </header>
          <p class="ls-event-detail">{{ ev.细节段落 }}</p>
          <div class="ls-event-options">
            <button
              v-for="[key, op] in optionEntries(ev)"
              :key="key"
              class="ls-option"
              type="button"
              @click="pick(name, op.动作)"
            >
              <span class="ls-option-act">{{ op.动作 }}</span>
              <span v-if="op.代价" class="ls-option-cost">{{ op.代价 }}</span>
            </button>
          </div>
        </article>
      </template>
    </CollapsibleList>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { injectInput } from '../inject';
import CollapsibleList from './CollapsibleList.vue';

type Option = { 动作: string; 代价: string };
type Event = {
  细节段落: string;
  发生时间: string;
  截止时间: string;
  所属主题: string;
  选项: Record<string, Option>;
};

const props = defineProps<{
  events: Record<string, Event>;
}>();

const entries = computed(() => Object.entries(props.events ?? {}));

function optionEntries(ev: Event) {
  return Object.entries(ev.选项 ?? {});
}

function pick(name: string, action: string) {
  injectInput(`「事件」「${name}」：${action}`);
}
</script>

<style lang="scss" scoped>
.ls-events {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-top: 1px solid var(--ls-border);
}

.ls-event-list {
  --ls-collapse-gap: 10px;
}

.ls-event {
  padding: 14px 15px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
}

.ls-event:hover {
  border-color: var(--ls-border-strong);
}

.ls-event-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ls-event-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ls-text);
}

.ls-event-time,
.ls-event-deadline {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ls-bg-alt);
  color: var(--ls-text-muted);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.ls-event-theme {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-event-detail {
  margin-top: 6px;
  font-family: var(--ls-f-serif);
  font-size: 14px;
  line-height: 1.75;
  color: var(--ls-text-body);
}

.ls-event-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.ls-option {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  cursor: pointer;
  text-align: left;
}

.ls-option:hover {
  background: var(--ls-surface-sunken);
  border-color: var(--ls-border-strong);
}

.ls-option-act {
  font-size: 13.5px;
  color: var(--ls-text);
}

.ls-option:hover .ls-option-act {
  color: var(--ls-accent-hover);
}

.ls-option-cost {
  margin-left: auto;
  flex: none;
  font-size: 11.5px;
  color: var(--ls-text-faint);
}
</style>
