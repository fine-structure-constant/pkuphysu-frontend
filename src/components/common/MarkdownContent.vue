<script setup lang="ts">
import { computed } from "vue";
import { renderMarkdown, sanitizeBackendHtml } from "../../lib/markdown";

const props = defineProps<{
  html?: string;
  markdown?: string;
}>();

const renderedHtml = computed(() => props.html !== undefined ? sanitizeBackendHtml(props.html) : renderMarkdown(props.markdown || ""));
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>
