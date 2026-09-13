export type ArticleCategory = "通知" | "活动" | "观察" | "社团";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  tags: string[];
  publishedAt: string;
  readTime: string;
  pinned?: boolean;
  cover?: string;
  body: string[];
}

export interface ForumPost {
  id: string;
  author: string;
  authorId: string;
  avatarTone: string;
  createdAt: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  replies: number;
  likes: number;
  follows: number;
  liked: boolean;
  followed: boolean;
  pinned?: boolean;
}

export interface ForumComment {
  id: string;
  author: string;
  authorId: string;
  createdAt: string;
  content: string;
  likes: number;
  liked: boolean;
  quote?: string;
}

export interface ConsoleNavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

export interface ConsoleNavGroup {
  label?: string;
  items: ConsoleNavItem[];
}
