<script setup lang="ts">
// Renders themeConfig.footer (the single source of the footer text) at the end of
// documentation pages, where the default theme's own footer is hidden.
import { useData } from 'vitepress'

const { theme } = useData()
</script>

<template>
  <footer v-if="theme.footer" class="DocFooterNotice">
    <p v-if="theme.footer.message" class="message" v-html="theme.footer.message"></p>
    <p v-if="theme.footer.copyright" class="copyright" v-html="theme.footer.copyright"></p>
  </footer>
</template>

<style scoped>
.DocFooterNotice {
  margin-top: 48px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 24px;
  text-align: center;
}

.message,
.copyright {
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
