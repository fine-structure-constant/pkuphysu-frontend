import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";

const backendTarget = process.env.VITE_API_TARGET || "http://localhost:18080";
const backendRoutes = ["/auth", "/iaaa", "/email", "/user", "/users", "/admins", "/forum/posts", "/forum/comments", "/forum/tags", "/forum/follow", "/forum/like", "/forum/comment", "/forum/reports", "/files", "/static", "/admin", "/dba", "/wechat", "/markdown", "/ping"];

export default defineConfig({
  integrations: [vue()],
  output: "static",
  site: "https://pkuphysu.example",
  vite: {
    server: {
      proxy: Object.fromEntries(backendRoutes.map((route) => [route, { target: backendTarget, changeOrigin: true }])),
    },
  },
});
