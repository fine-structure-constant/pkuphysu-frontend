<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "../components/common/Icon.vue";
import MarkdownContent from "../components/common/MarkdownContent.vue";
import { apiJson, ApiError, jsonBody } from "../lib/api";
import { htmlToPlainText, normalizePostContent } from "../lib/markdown";
import { clearAuthSession, getAuthSession, getInitials } from "../lib/session";

type BrowseType = "posts" | "follow" | "comments";
interface ApiPost { id: number; text: string; type: number; timestamp: number; follownum: number; likenum: number; reply: number; tags?: string[]; is_follow?: number; is_like?: number; userid: number; username: string; }
interface ApiComment { cid: number; pid: number; text: string; quote?: { username?: string; text?: string } | null; timestamp: number; userid: number; username: string; likenum: number; is_like?: number; }
interface ForumPost { id: number; author: string; authorId: number; createdAt: number; title: string; excerpt: string; content: string; contentHtml: string; tags: string[]; replies: number; likes: number; follows: number; liked: boolean; followed: boolean; }
interface ForumComment { id: number; author: string; authorId: number; createdAt: number; content: string; contentHtml: string; likes: number; liked: boolean; quote?: string; }

const posts = ref<ForumPost[]>([]);
const topics = ref<string[]>([]);
const browseType = ref<BrowseType>("posts");
const query = ref("");
const selectedPostId = ref<number | null>(null);
const comments = ref<ForumComment[]>([]);
const commentsLoading = ref(false);
const commentSort = ref<"newest" | "oldest">("newest");
const replyContent = ref("");
const editorOpen = ref(false);
const editorTitle = ref("");
const editorContent = ref("");
const editorTags = ref("");
const editorMode = ref<"write" | "preview">("write");
const replyMode = ref<"write" | "preview">("write");
const loading = ref(true);
const busy = ref(false);
const toast = ref("");
const queryInput = ref<HTMLInputElement>();
const editorTrigger = ref<HTMLButtonElement>();

const displayTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", ".");
const postFromApi = (post: ApiPost): ForumPost => { const rendered = normalizePostContent(post.text || ""); return { id: post.id, author: post.username || "匿名用户", authorId: post.userid, createdAt: post.timestamp, title: rendered.title || `讨论 #${post.id}`, excerpt: rendered.text.slice(0, 180), content: rendered.text, contentHtml: rendered.html, tags: post.tags || [], replies: post.reply || 0, likes: post.likenum || 0, follows: post.follownum || 0, liked: post.is_like === 1, followed: post.is_follow === 1 }; };
const commentFromApi = (comment: ApiComment): ForumComment => ({ id: comment.cid, author: comment.username || "匿名用户", authorId: comment.userid, createdAt: comment.timestamp, content: htmlToPlainText(comment.text || ""), contentHtml: comment.text || "", likes: comment.likenum || 0, liked: comment.is_like === 1, quote: comment.quote?.username });
const selectedPost = computed(() => posts.value.find((post) => post.id === selectedPostId.value) ?? null);
const parsedQuery = computed(() => query.value.trim().split(/\s+/).filter(Boolean));
const filteredPosts = computed(() => posts.value.filter((post) => parsedQuery.value.every((item) => { if (item.startsWith("#")) return String(post.id).includes(item.slice(1)); if (item.startsWith(":")) return post.tags.some((tag) => tag.includes(item.slice(1))); return `${post.title} ${post.excerpt} ${post.author} ${post.tags.join(" ")}`.toLowerCase().includes(item.toLowerCase()); })));
const emptyText = computed(() => browseType.value === "follow" ? "还没有关注的内容" : browseType.value === "comments" ? "还没有有回复的讨论" : query.value ? "没有匹配的讨论" : "暂时没有内容");
const visibleComments = computed(() => commentSort.value === "newest" ? [...comments.value].reverse() : comments.value);
const editorPreviewSource = computed(() => [editorTitle.value.trim() ? `# ${editorTitle.value.trim()}` : "", editorContent.value].filter(Boolean).join("\n\n"));

let toastTimer: number | undefined;
const showToast = (message: string) => { toast.value = message; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.value = ""; }, 2600); };
const handleError = (error: unknown) => { if (error instanceof ApiError && error.status === 401) { clearAuthSession(); window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; } showToast(error instanceof ApiError ? error.message : "请求失败，请稍后重试"); };

const loadTags = async () => { try { topics.value = ((await apiJson<Array<{ tag_name: string }>>("/forum/tags")).data || []).map((tag) => tag.tag_name).filter(Boolean); } catch { topics.value = []; } };
const loadPosts = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({ limit: "50", begin: "0" });
    parsedQuery.value.forEach((item) => item.startsWith("#") ? params.set("keyword", item.slice(1)) : item.startsWith(":") ? params.append("tag", item.slice(1)) : params.append("keyword", item));
    const endpoint = browseType.value === "follow" ? "/forum/follow" : "/forum/posts";
    const data = (await apiJson<ApiPost[]>(`${endpoint}?${params}`)).data || [];
    posts.value = data.map(postFromApi).filter((post) => browseType.value !== "comments" || post.replies > 0);
  } catch (error) { handleError(error); } finally { loading.value = false; }
};
const loadComments = async () => {
  if (selectedPostId.value === null) return;
  commentsLoading.value = true;
  try { comments.value = ((await apiJson<ApiComment[]>(`/forum/comments/${selectedPostId.value}?limit=100&begin=0&sort=asc`)).data || []).map(commentFromApi); }
  catch (error) { handleError(error); } finally { commentsLoading.value = false; }
};
const setBrowseType = (type: BrowseType) => { browseType.value = type; selectedPostId.value = null; void loadPosts(); };
const openPost = (post: ForumPost) => { selectedPostId.value = post.id; void loadComments(); nextTick(() => document.querySelector<HTMLElement>("[data-forum-detail]")?.focus()); };
const toggleLike = async (post: ForumPost) => { try { const result = await apiJson<{ likenum: number; is_liked: boolean }>(`/forum/like/${post.id}`, { method: "POST" }); post.likes = result.data.likenum; post.liked = result.data.is_liked; } catch (error) { handleError(error); } };
const toggleFollow = async (post: ForumPost) => { try { await apiJson(`/forum/follow/${post.id}`, { method: "POST" }); post.followed = !post.followed; post.follows += post.followed ? 1 : -1; if (browseType.value === "follow" && !post.followed) posts.value = posts.value.filter((item) => item.id !== post.id); } catch (error) { handleError(error); } };
const toggleCommentLike = async (comment: ForumComment) => { try { const result = await apiJson<{ likenum: number; is_liked: boolean }>(`/forum/comment/like/${comment.id}`, { method: "POST" }); comment.likes = result.data.likenum; comment.liked = result.data.is_liked; } catch (error) { handleError(error); } };
const openEditor = () => { editorTrigger.value = document.activeElement as HTMLButtonElement; editorMode.value = "write"; editorOpen.value = true; nextTick(() => document.querySelector<HTMLTextAreaElement>("[data-editor-content]")?.focus()); };
const closeEditor = () => { editorOpen.value = false; editorMode.value = "write"; editorTitle.value = ""; editorContent.value = ""; editorTags.value = ""; editorTrigger.value?.focus(); };
const submitPost = async () => {
  const content = editorContent.value.trim();
  if (!content) { showToast("请先写下内容，再提交"); return; }
  busy.value = true;
  try { await apiJson("/forum/posts", { method: "POST", body: jsonBody({ text: editorTitle.value.trim() ? `# ${editorTitle.value.trim()}\n\n${content}` : content, tags: editorTags.value.split(/[ ,，]+/).filter(Boolean).slice(0, 8), type: 0 }) }); closeEditor(); browseType.value = "posts"; await loadPosts(); showToast("帖子已发布"); }
  catch (error) { handleError(error); } finally { busy.value = false; }
};
const submitComment = async () => { if (selectedPostId.value === null || !replyContent.value.trim()) { showToast("请先写下回复"); return; } try { await apiJson("/forum/comments", { method: "POST", body: jsonBody({ pid: selectedPostId.value, text: replyContent.value.trim(), quote: null }) }); replyContent.value = ""; replyMode.value = "write"; await loadComments(); if (selectedPost.value) selectedPost.value.replies += 1; showToast("回复已发布"); } catch (error) { handleError(error); } };
const onKeydown = (event: KeyboardEvent) => { if (!editorOpen.value) return; if (event.key === "Escape") { closeEditor(); return; } if (event.key !== "Tab") return; const dialog = document.querySelector<HTMLElement>(".forum-editor"); const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>("button, input, textarea, [href], [tabindex]:not([tabindex='-1'])")].filter((element) => !element.hasAttribute("disabled")) : []; if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } };

onMounted(async () => { if (!getAuthSession()?.token) { window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; } window.addEventListener("keydown", onKeydown); try { await apiJson("/user/me"); await Promise.all([loadTags(), loadPosts()]); } catch (error) { handleError(error); } queryInput.value?.focus(); });
onBeforeUnmount(() => { window.removeEventListener("keydown", onKeydown); window.clearTimeout(toastTimer); });
</script>

<template>
  <div class="forum-app page-wrap"><div class="forum-layout">
    <aside class="forum-sidebar glass-panel" aria-label="论坛工具栏"><div class="forum-sidebar__intro"><p class="eyebrow">OPEN DISCUSSION</p><h1>论坛</h1><p>把问题放在这里，等一等回声。</p></div><nav class="forum-tabs" aria-label="论坛视图"><button :class="{ active: browseType === 'posts' }" type="button" @click="setBrowseType('posts')"><Icon name="grid" :size="17" />最新讨论<span>{{ posts.length }}</span></button><button :class="{ active: browseType === 'follow' }" type="button" @click="setBrowseType('follow')"><Icon name="star" :size="17" />我的关注<span>{{ posts.filter((post) => post.followed).length }}</span></button><button :class="{ active: browseType === 'comments' }" type="button" @click="setBrowseType('comments')"><Icon name="message" :size="17" />有回复的讨论<span>{{ posts.filter((post) => post.replies > 0).length }}</span></button></nav><button class="action-button forum-sidebar__publish" type="button" @click="openEditor"><Icon name="plus" :size="17" />发起一条讨论</button><div class="forum-sidebar__topics"><div class="forum-sidebar__label"><span>热门话题</span><span class="muted">BACKEND</span></div><button v-for="topic in topics" :key="topic" type="button" @click="query = `:${topic}`; void loadPosts()"># {{ topic }}</button><span v-if="!topics.length" class="muted">暂无标签</span></div><div class="forum-sidebar__note"><span class="status-dot"></span><span>已连接论坛 API · 内容来自后端数据库</span></div></aside>
    <section class="forum-stream" aria-labelledby="forum-stream-title"><div class="forum-toolbar glass-panel"><div><p class="eyebrow">THREADS / {{ browseType === 'posts' ? 'LATEST' : browseType === 'follow' ? 'FOLLOWING' : 'COMMENTS' }}</p><h2 id="forum-stream-title">{{ browseType === 'follow' ? '我关注的讨论' : browseType === 'comments' ? '正在发生的讨论' : '最新讨论' }}</h2></div><label class="forum-search"><Icon name="search" :size="17" /><input ref="queryInput" v-model="query" type="search" placeholder="搜索，或使用 #ID / :标签" aria-label="搜索论坛" @change="loadPosts" /><kbd>⌘ K</kbd></label></div><div v-if="query" class="forum-query-hint">正在搜索 <strong>{{ query }}</strong><span>关键词 · #ID · :标签均可</span></div><div class="forum-post-list"><div v-if="loading" class="forum-empty glass-panel"><span class="empty-state__mark">…</span><div><strong>正在读取讨论</strong><p>请稍候。</p></div></div><article v-for="post in filteredPosts" v-else :key="post.id" class="forum-post glass-panel"><div class="forum-post__head"><div class="avatar avatar--blue">{{ getInitials(post.author).slice(0, 1) }}</div><div class="forum-post__author"><strong>{{ post.author }}</strong><span>#{{ post.authorId }} · {{ displayTime(post.createdAt) }}</span></div><button class="icon-button forum-post__more" type="button" aria-label="更多操作"><Icon name="more" :size="17" /></button></div><div class="forum-post__content" role="button" tabindex="0" @click="openPost(post)" @keydown.enter="openPost(post)" @keydown.space.prevent="openPost(post)"><h3>{{ post.title }}</h3><MarkdownContent :html="post.contentHtml" class="forum-markdown--excerpt" /></div><div class="forum-post__foot"><div class="tag-list"><span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span></div><div class="post-actions"><button :class="{ active: post.followed }" type="button" @click="toggleFollow(post)"><Icon name="star" :size="14" />{{ post.follows }}</button><button :class="{ active: post.liked }" type="button" @click="toggleLike(post)"><Icon name="heart" :size="14" />{{ post.likes }}</button><button type="button" @click="openPost(post)"><Icon name="message" :size="14" />{{ post.replies }}</button></div></div></article><div v-if="!loading && !filteredPosts.length" class="forum-empty glass-panel"><span class="empty-state__mark">○</span><div><strong>{{ emptyText }}</strong><p>试试切换视图，或清除当前筛选。</p><button class="text-button" type="button" @click="query = ''; browseType = 'posts'; void loadPosts()">清除筛选</button></div></div></div><div class="forum-end"><span>—</span><p>已到达当前 API 返回列表的末尾</p><span>—</span></div></section>
    <aside v-if="selectedPost" class="forum-detail glass-panel" tabindex="-1" data-forum-detail aria-label="讨论详情"><div class="forum-detail__head"><div><p class="eyebrow">POST {{ selectedPost.id }}</p><h2>讨论详情</h2></div><button class="icon-button" type="button" aria-label="关闭详情" @click="selectedPostId = null"><Icon name="close" :size="17" /></button></div><div class="forum-detail__post"><div class="forum-post__head"><div class="avatar avatar--blue">{{ getInitials(selectedPost.author).slice(0, 1) }}</div><div class="forum-post__author"><strong>{{ selectedPost.author }}</strong><span>#{{ selectedPost.authorId }}</span></div></div><h3>{{ selectedPost.title }}</h3><MarkdownContent :html="selectedPost.contentHtml" class="forum-markdown--detail" /><div class="tag-list"><span v-for="tag in selectedPost.tags" :key="tag" class="tag-chip">{{ tag }}</span></div></div><div class="comments-heading"><strong>评论</strong><div class="sort-buttons"><button :class="{ active: commentSort === 'newest' }" type="button" @click="commentSort = 'newest'">最新</button><button :class="{ active: commentSort === 'oldest' }" type="button" @click="commentSort = 'oldest'">最早</button></div></div><div class="comment-list"><div v-if="commentsLoading" class="comment-empty">正在读取评论……</div><div v-for="comment in visibleComments" v-else :key="comment.id" class="comment"><div class="avatar avatar--small avatar--ocean">{{ getInitials(comment.author).slice(0, 1) }}</div><div class="comment__body"><div class="comment__meta"><strong>{{ comment.author }}</strong><span>{{ displayTime(comment.createdAt) }}</span></div><p v-if="comment.quote" class="comment__quote">@{{ comment.quote }}</p><MarkdownContent :html="comment.contentHtml" class="forum-markdown--comment" /><button class="comment__like" :class="{ active: comment.liked }" type="button" @click="toggleCommentLike(comment)"><Icon name="heart" :size="13" />{{ comment.likes }}</button></div></div><div v-if="!commentsLoading && !visibleComments.length" class="comment-empty">还没有评论，欢迎留下第一条回应。</div></div><div class="forum-reply-form"><div class="markdown-mode-switch" role="tablist" aria-label="回复编辑模式"><button :class="{ active: replyMode === 'write' }" type="button" role="tab" :aria-selected="replyMode === 'write'" @click="replyMode = 'write'">编辑</button><button :class="{ active: replyMode === 'preview' }" type="button" role="tab" :aria-selected="replyMode === 'preview'" @click="replyMode = 'preview'">预览</button></div><textarea v-if="replyMode === 'write'" v-model="replyContent" rows="3" placeholder="写下你的回复……"></textarea><div v-else class="forum-markdown--preview"><MarkdownContent :markdown="replyContent" /></div><button class="action-button action-button--quiet forum-detail__reply" type="button" @click="submitComment"><Icon name="message" :size="16" />发布回复</button></div></aside>
  </div></div>
  <div v-if="editorOpen" class="dialog-backdrop" role="presentation" @click.self="closeEditor"><section class="forum-editor glass-panel glass-panel--strong" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div class="forum-editor__head"><div><p class="eyebrow">NEW THREAD</p><h2 id="editor-title">发起一条讨论</h2></div><button class="icon-button" type="button" aria-label="关闭编辑器" @click="closeEditor"><Icon name="close" :size="18" /></button></div><label class="editor-label">标题<input v-model="editorTitle" type="text" placeholder="一句话描述你想讨论的事" /></label><label class="editor-label editor-label--body">正文<div class="markdown-mode-switch" role="tablist" aria-label="帖子编辑模式"><button :class="{ active: editorMode === 'write' }" type="button" role="tab" :aria-selected="editorMode === 'write'" @click="editorMode = 'write'">编辑</button><button :class="{ active: editorMode === 'preview' }" type="button" role="tab" :aria-selected="editorMode === 'preview'" @click="editorMode = 'preview'">预览</button></div><textarea v-if="editorMode === 'write'" v-model="editorContent" data-editor-content rows="7" placeholder="支持 Markdown：标题、列表、引用、代码、表格和图片……"></textarea><div v-else class="forum-markdown--preview"><MarkdownContent :markdown="editorPreviewSource" /></div></label><label class="editor-label">标签<span class="editor-hint">用空格分隔，最多 8 个</span><input v-model="editorTags" type="text" placeholder="课程 讨论" /></label><div class="forum-editor__foot"><span>预览与发布均遵循后端 Markdown 规则</span><div><button class="action-button action-button--quiet" type="button" @click="closeEditor">取消</button><button class="action-button" type="button" :disabled="busy" @click="submitPost">{{ busy ? "发布中……" : "发布讨论" }}</button></div></div></section></div><Transition name="toast"><div v-if="toast" class="forum-toast" role="status">{{ toast }}</div></Transition>
</template>
