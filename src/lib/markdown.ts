import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
  typographer: false,
});

const forbiddenTags = ["base", "embed", "form", "iframe", "link", "meta", "object", "script", "style"];
const forbiddenAttributes = ["srcdoc"];

const fallbackSanitize = (html: string) => html
  .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
  .replace(/<\s*(?:iframe|object|embed|form|style|link|meta|base)(?:\s[^>]*)?>[\s\S]*?<\s*\/\s*(?:iframe|object|embed|form|style|link|meta|base)\s*>/gi, "")
  .replace(/\s+on[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

const sanitize = (html: string) => {
  if (!html) return "";
  if (typeof window === "undefined") return fallbackSanitize(html);

  return DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"],
    FORBID_ATTR: forbiddenAttributes,
    FORBID_TAGS: forbiddenTags,
  });
};

export const sanitizeBackendHtml = (html: string) => sanitize(html);

export const renderMarkdown = (source: string) => sanitize(markdown.render(source || ""));

export const htmlToPlainText = (html: string) => {
  if (!html) return "";
  if (typeof document === "undefined") return fallbackSanitize(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const template = document.createElement("template");
  template.innerHTML = sanitize(html);
  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
};

export interface RenderedPostContent {
  title: string;
  html: string;
  text: string;
}

/**
 * The forum currently stores a post title as the first Markdown heading.
 * Remove that heading from the body so the UI does not show it twice.
 */
export const normalizePostContent = (html: string): RenderedPostContent => {
  const safeHtml = sanitize(html || "");
  if (typeof document === "undefined") {
    const text = htmlToPlainText(safeHtml);
    return { title: text.split(/\n|。/)[0]?.trim().slice(0, 54) || "", html: safeHtml, text };
  }

  const template = document.createElement("template");
  template.innerHTML = safeHtml;
  const firstElement = template.content.firstElementChild;
  let title = "";
  if (firstElement && /^H[1-3]$/.test(firstElement.tagName)) {
    title = (firstElement.textContent || "").trim();
    firstElement.remove();
  }

  const bodyHtml = template.innerHTML.trim();
  const text = htmlToPlainText(bodyHtml || safeHtml);
  if (!title) title = text.split(/\n|。/)[0]?.trim().slice(0, 54) || "";
  return { title, html: bodyHtml || safeHtml, text };
};
