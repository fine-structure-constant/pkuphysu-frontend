import type { Article } from "../types";

export const articles: Article[] = [
  {
    slug: "autumn-recruitment-brief",
    title: "物院学生会秋季招新说明",
    excerpt: "认识我们的部门、工作方式和一群认真生活的人，报名入口将在原型中保留为演示状态。",
    category: "通知",
    tags: ["学生会", "招新"],
    publishedAt: "2026-09-08",
    readTime: "4 min",
    pinned: true,
    cover: "/hero.jpg",
    body: [
      "新学期开始，物理学院学生会开放部门体验与招新说明。本页面为前端原型，所有时间、联系人和报名入口均为占位内容。",
      "我们希望把课程之外的好奇心也聚在一起：从学术交流，到校园生活，再到一次次把想法落地的实践。欢迎先浏览部门介绍，再决定是否加入。",
      "后续接入服务端后，这里会替换为正式公告、报名流程和可追踪的活动信息。",
    ],
  },
  {
    slug: "night-at-the-lab",
    title: "在实验室里看见一整晚的星光",
    excerpt: "一份关于开放实验室、低温物理和那些没有写进课本的提问的观察记录。",
    category: "观察",
    tags: ["实验室", "观察"],
    publishedAt: "2026-09-02",
    readTime: "7 min",
    cover: "/hero.jpg",
    body: [
      "晚上十点，实验楼的灯还亮着。有人在讨论测量误差，有人在白板上重新画出一条并不完美的曲线。",
      "学生会希望记录下这些不那么正式、却很有生命力的瞬间。科学并不总以结论开始，它也常常从一句‘如果呢？’开始。",
      "这是用于展示文章详情布局的 mock 文章，图片和具体实验信息均不代表正式发布内容。",
    ],
  },
  {
    slug: "campus-walk-notes",
    title: "从未名湖到理科一号楼：一条慢慢走的路线",
    excerpt: "给刚刚熟悉校园的同学，一份不赶时间的物院周边路线和休息点记录。",
    category: "活动",
    tags: ["校园", "新生"],
    publishedAt: "2026-08-26",
    readTime: "3 min",
    body: [
      "路线从湖边开始，经过几处适合停下来读书的树荫，再回到理科一号楼。活动本身是一个轻量的 mock 行程。",
      "如果你正在寻找一条认识校园的方式，可以带上水和一位愿意聊天的同学。",
    ],
  },
  {
    slug: "student-union-open-day",
    title: "学生会开放日：把问题带来，把答案带走",
    excerpt: "部门成员会在现场介绍日常工作，也欢迎你带来对校园生活的任何问题。",
    category: "社团",
    tags: ["开放日", "交流"],
    publishedAt: "2026-08-19",
    readTime: "2 min",
    body: [
      "开放日是一个轻松的见面机会。你不需要准备自我介绍，也不需要马上做决定。",
      "本页面只展示前端交互和内容状态，时间地点会在正式数据接入后替换。",
    ],
  },
  {
    slug: "summer-semester-review",
    title: "夏季学期工作回顾",
    excerpt: "把过去一个学期里做过的事整理成几页轻量的记录，方便下一次出发。",
    category: "通知",
    tags: ["回顾", "学生会"],
    publishedAt: "2026-07-28",
    readTime: "5 min",
    body: [
      "我们把学期里的活动、反馈和仍然悬而未决的问题放在一起，希望它们可以成为下一次工作的起点。",
      "感谢每一位参与、提问或只是路过并留下建议的同学。",
    ],
  },
];

export const archiveGroups = [
  { year: "2026", months: [{ label: "九月", articles: articles.slice(0, 2) }, { label: "八月", articles: articles.slice(2, 4) }] },
  { year: "2026", months: [{ label: "七月", articles: articles.slice(4) }] },
];
