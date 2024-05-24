import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/blog/",
  title: "程序猿大本营",
  description: "A VitePress Site",
  srcDir: "./src",
  themeConfig: {
    search: {
      // provider: "algolia",
      provider: "local",
      options: {
        _render(src, env, md) {
          const html = md.render(src, env);
          // if (env.frontmatter?.search === false) return "";
          // if (env.relativePath.startsWith("some/path")) return "";
          if (env.frontmatter?.title) return md.render(`# ${env.frontmatter.title}`) + html;
          return html;
        }
      }
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Vue", link: "/vue" },
      { text: "React", link: "/react" }
      // { text: "Examples", link: "/markdown-examples" }
    ],
    sidebar: [
      {
        text: "Vue-Menu",
        items: [{ text: "mini-vue", link: "/vue" }]
      },
      {
        text: "React-Menu",
        items: [
          { text: "mini-React1", link: "/react" },
          { text: "mini-React2", link: "/react2" },
          { text: "mini-React3", link: "/react3" }
        ]
      }
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/whoelse666/mini-vue" }]
  }
});
