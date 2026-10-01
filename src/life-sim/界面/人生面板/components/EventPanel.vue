<template>
  <section v-if="entries.length" class="events">
    <CollapsibleList class="event-list" :items="entries" :limit="3">
      <template #default="{ items }">
        <article v-for="[name, ev] in items" :key="name" class="event">
          <header class="event-head">
            <h4 class="event-name">{{ name }}</h4>
            <span v-if="ev.发生时间" class="event-time">{{ ev.发生时间 }}</span>
            <span v-if="ev.截止时间" class="event-deadline">{{ ev.截止时间 }}</span>
            <span v-if="ev.所属主题" class="event-theme">{{ ev.所属主题 }}</span>
          </header>
          <p class="event-detail">{{ ev.细节段落 }}</p>
          <div class="event-options">
            <button
              v-for="[key, op] in optionEntries(ev)"
              :key="key"
              class="option"
              type="button"
              @click="pick(name, op.动作)"
            >
              <span class="option-act">{{ op.动作 }}</span>
              <span v-if="op.代价" class="option-cost">{{ op.代价 }}</span>
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
.events {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-top: 1px solid var(--c-border);
}

.event-list {
  --collapse-gap: 10px;
}

.event {
  padding: 14px 15px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-surface);
}

.event:hover {
  border-color: var(--c-border-strong);
}

.event-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.event-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text);
}

.event-time,
.event-deadline {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--c-bg-alt);
  color: var(--c-text-muted);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.event-theme {
  font-size: 12px;
  color: var(--c-text-faint);
}

.event-detail {
  margin-top: 6px;
  font-family: var(--f-serif);
  font-size: 14px;
  line-height: 1.75;
  color: var(--c-text-body);
}

.event-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.option {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  cursor: pointer;
  text-align: left;
}

.option:hover {
  background: var(--c-surface-sunken);
  border-color: var(--c-border-strong);
}

.option-act {
  font-size: 13.5px;
  color: var(--c-text);
}

.option:hover .option-act {
  color: var(--c-accent-hover);
}

.option-cost {
  margin-left: auto;
  flex: none;
  font-size: 11.5px;
  color: var(--c-text-faint);
}
</style>
