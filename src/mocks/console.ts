import type { ConsoleNavGroup } from "../types";

export const consoleNavGroups: ConsoleNavGroup[] = [
  { items: [{ label: "总览", path: "/console", icon: "grid" }] },
  {
    label: "内容",
    items: [
      { label: "文章", path: "/console/content/articles", icon: "file" },
      { label: "论坛帖子", path: "/console/content/posts", icon: "message" },
      { label: "评论", path: "/console/content/comments", icon: "message" },
      { label: "举报", path: "/console/content/reports", icon: "flag" },
    ],
  },
  { items: [{ label: "附件", path: "/console/attachments", icon: "image" }] },
  { items: [{ label: "用户", path: "/console/users", icon: "users" }] },
  {
    label: "外观",
    items: [
      { label: "菜单", path: "/console/appearance/menus", icon: "menu" },
      { label: "主题", path: "/console/appearance/themes", icon: "sparkles" },
    ],
  },
  {
    label: "数据库",
    items: [
      { label: "数据表", path: "/console/database/tables", icon: "database" },
      { label: "迁移", path: "/console/database/migrations", icon: "settings" },
    ],
  },
  {
    label: "WeChat",
    items: [{ label: "扫码爬文", path: "/console/wechat", icon: "message" }],
  },
  {
    label: "系统",
    items: [
      { label: "设置", path: "/console/system/settings", icon: "settings" },
      { label: "工具", path: "/console/system/tools", icon: "wrench" },
    ],
  },
];

export const consoleStats = [
  { label: "文章", value: "128", delta: "+12%", icon: "file", tone: "primary" },
  { label: "评论", value: "486", delta: "+8.4%", icon: "message", tone: "blue" },
  { label: "用户", value: "2,846", delta: "+18%", icon: "users", tone: "green" },
  { label: "访问", value: "18.6k", delta: "+6.8%", icon: "chart", tone: "violet" },
];
