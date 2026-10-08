// Extends the default theme only to show the site footer on documentation pages.
// VitePress hides its footer wherever the sidebar is visible, which is every page
// except the home page; the trademark notice must appear on every public page.
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import DocFooterNotice from './DocFooterNotice.vue'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-after': () => h(DocFooterNotice)
    })
}
