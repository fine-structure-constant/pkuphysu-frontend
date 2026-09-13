# PKUPHYSU Frontend — Agent Implementation Guide

## 1. Mission

Build a new student-union frontend in this repository using **Astro + Vue 3 + TypeScript**.

The initial milestone established a frontend-only prototype. This integration milestone extends it
to coordinated frontend/backend development. It must preserve:

- page hierarchy and navigation;
- a coherent visual system;
- responsive desktop/mobile layouts;
- local mock data where the backend has no corresponding API;
- clear typed boundaries between public UI and administrator UI;
- real API integration for authentication, forum, console management, database inspection, and WeChat crawling.

The latest user request explicitly authorizes changes to `../pkuphysu-backend` for this integration
milestone. Keep `../blog_Firefly`, `../halo`, and `../pkuphysu-website` read-only references.

The word “Astra” in the original request is interpreted as **Astro**. If that interpretation is wrong, stop before scaffolding and ask the user.

## 2. Source References and Precedence

Inspect these local projects before implementing:

1. `../blog_Firefly/` — authoritative reference for the public site's visual language:
   translucent cards, wallpaper/hero composition, rounded panels, layered shadows,
   soft borders, responsive two-column content, widgets, theme tokens, and restrained motion.
2. `../pkuphysu-website/` — behavioral and information-architecture reference for the existing
   student-union pages and forum. In particular inspect:
   - `src/pages/Home.vue`
   - `src/pages/BlogCenterV2.vue`
   - `src/components/blog-center/BlogPostCard.vue`
   - `src/components/blog-center/BlogCommentCard.vue`
   - `src/components/blog-center/BlogPostEditor.vue`
3. `../halo/ui/console-src/` and `../halo/ui/packages/components/` — authoritative reference for
   the `/console` layout, spacing, navigation hierarchy, dashboard shell, widgets, search entry,
   mobile navigation, and interaction density.

Priority when references conflict:

1. this document and the user's latest instructions;
2. requested route relationships and milestone scope;
3. Firefly visual language for public pages and forum;
4. Halo visual language for `/console` only;
5. existing `pkuphysu-website` behavior.

Do not turn the new project into a copy of Firefly's full feature set. Reuse only the visual
principles needed for this student-union site.

## 3. Licensing Boundary

- `../blog_Firefly` is MIT licensed. If any substantial code or assets are copied, retain the
  required MIT copyright and license notice.
- `../halo` is GPL-3.0 licensed. Directly copying Halo source code or derived components may make
  the new project subject to GPL-3.0 distribution obligations.
- Until the user explicitly chooses a compatible license and accepts those obligations, reproduce
  Halo's **observable layout and interaction design with newly written code**. Do not copy Halo
  trademarks, logos, translations, generated API clients, source files, or bundled assets.
- If the user explicitly approves GPL-3.0 reuse, add the appropriate license and notices before
  copying any Halo implementation.

### Project license decision

The project owner has explicitly selected GPL-3.0-only for this frontend and permits compatible
GPL-3.0 reuse when the corresponding notices are retained. The implementation should still prefer
newly written application code; this decision does not permit copying Halo branding or product
content into the rendered UI. The sidebar may use Halo's local Iconify Remix Icon collection
(`@iconify/vue` + `@iconify-json/ri`) as an icon-source reference, with its upstream Apache-2.0
package license remaining visible in dependency metadata.

The intended result for `/console` is visually and behaviorally very close to Halo Console, but it
must use PKUPHYSU naming and placeholder content.

## 4. Milestone-One Scope

### In scope

- Astro project scaffold with Vue integration.
- Shared public shell, global design tokens, light/dark-ready variables, and responsive behavior.
- Routes `/`, `/archive`, `/about`, `/articles`, `/forum`, and `/console`.
- Active navigation state and working links between every page.
- Static or locally mocked content for all lists, cards, charts, counters, users, comments, and
  widgets.
- Frontend-only interactions: menus, tabs, modal shells, filters, search fields, hover/press states,
  forum post selection, comment drawer/panel, and console sidebar collapse on small screens.
- Loading, empty, and error-state components demonstrated with mock-state toggles or fixtures.
- Visual verification on desktop and mobile sizes.

### Integration boundary

- `/auth`, `/iaaa`, `/email`, `/user`, `/forum`, `/admin`, `/dba`, and `/wechat` use the backend routes.
- Keep the overview statistics and layout designer as explicitly marked mock content until a statistics API exists.
- Destructive operations must have a clear confirmation in the administrator UI.
- `../pkuphysu-backend` may be modified only for the requested integration contract and its tests.
- Deployment, certificates, analytics, and SEO beyond basic page metadata remain out of scope.
- Copying the legacy Python application.
- Implementing every Halo console module. Milestone one needs the console shell, dashboard, route
  skeletons, and representative placeholder pages only.

Do not introduce fake API modules that resemble production calls. Keep remaining fixtures in
`src/mocks/` and keep production calls in typed helpers under `src/lib/`.

## 5. Technology Decisions

- Astro with strict TypeScript.
- Vue 3 through `@astrojs/vue` for interactive islands.
- pnpm as the only package manager.
- Tailwind CSS 4 is preferred for layout utilities, with CSS custom properties for the design
  system. Component-scoped CSS is acceptable where it improves readability.
- Use Iconify or another single tree-shakeable icon source. Do not mix several icon libraries.
- Avoid a large UI framework in milestone one unless the user approves it. The public site should
  not inherit Element Plus styling.
- Keep runtime dependencies minimal and record why each dependency is needed.

Markdown rendering convention:

- Forum and other backend-authored rich text must be rendered through `src/components/common/MarkdownContent.vue`.
- `markdown-it` is used only for local editor previews; `DOMPurify` must sanitize both local preview HTML and backend-rendered HTML before `v-html`.
- Preserve backend-provided inline styles that are part of its supported content contract, but never allow executable tags, event-handler attributes, nested browsing contexts, or navigation forms into the page.
- Keep plain-text excerpts for search and list fallback, while detail and comment views should use the sanitized rendered HTML.

Astro must provide an actual performance advantage:

- render `/`, `/archive`, `/about`, and `/articles` as static Astro pages by default;
- do not hydrate static cards, headings, navigation links, or decorative widgets;
- use Vue only for stateful areas such as `/forum`, `/console`, theme controls, mobile menus, or
  genuinely interactive widgets;
- prefer `client:visible` or `client:idle` for non-critical islands and `client:load` only when an
  interaction must be ready immediately;
- never wrap the entire public site in one Vue SPA.

## 6. Proposed Repository Structure

Use this structure unless Astro conventions require a small adjustment:

```text
pkuphysu-frontend/
├─ AGENTS.md
├─ astro.config.mjs
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ public/
│  └─ hero.jpg
└─ src/
   ├─ assets/
   ├─ components/
   │  ├─ common/
   │  ├─ home/
   │  ├─ forum/
   │  └─ console/
   ├─ islands/
   │  ├─ ForumApp.vue
   │  └─ ConsoleApp.vue
   ├─ layouts/
   │  ├─ PublicLayout.astro
   │  └─ ContentLayout.astro
   ├─ mocks/
   │  ├─ articles.ts
   │  ├─ forum.ts
   │  └─ console.ts
   ├─ pages/
   │  ├─ index.astro
   │  ├─ archive.astro
   │  ├─ about.astro
   │  ├─ articles/
   │  │  ├─ index.astro
   │  │  └─ [slug].astro
   │  ├─ forum.astro
   │  └─ console/
   │     └─ [...path].astro
   ├─ styles/
   │  ├─ tokens.css
   │  ├─ global.css
   │  └─ motion.css
   └─ types/
```

The catch-all console page should allow `/console`, `/console/dashboard`, and placeholder nested
console paths to survive reloads. Public navigation must always link back out of the console.

## 7. Route and Navigation Contract

The public navbar must contain these destinations in this order unless the user changes it:

| Label | Route | Purpose |
|---|---|---|
| 首页 | `/` | Hero, highlights, recent content, widgets |
| 归档 | `/archive` | Chronological content archive |
| 关于 | `/about` | Student-union introduction and contact placeholders |
| 文章 | `/articles` | Article/notice cards and category placeholders |
| 论坛 | `/forum` | Interactive forum prototype |
| 控制台 | `/console` | Administrative console prototype |

Requirements:

- The brand/logo always links to `/`.
- Current-route indication must be visible without relying only on color.
- On mobile, collapse links into an accessible menu with correct focus handling and Escape-to-close.
- `/forum` retains the public navbar and Firefly background treatment.
- `/console` uses its own Halo-like application shell rather than the public navbar.
- The console logo/home affordance opens `/` in the same tab for this prototype.
- No navigation item may point to a missing route.

## 8. Public Visual Language

Use Firefly as inspiration, not as a requirement to port all of its configuration machinery.

### Foundation

- Large wallpaper/hero image with a dark readable overlay.
- Translucent navigation and content cards using `background: color-mix(...)` or rgba colors,
  `backdrop-filter: blur(...)`, a subtle one-pixel border, and restrained shadow.
- A calm cool accent hue compatible with PKU red as a secondary accent; avoid saturating every
  component in red.
- Rounded cards and pills, but keep content pages readable and institutional rather than playful.
- Establish all colors, opacity, blur, radii, shadows, widths, and motion durations as CSS variables.
- Support both light and dark tokens from the start, even if the theme switch is only a prototype.

Suggested starting tokens (adjust by visual review):

```css
--page-max: 75rem;
--glass-bg: color-mix(in srgb, var(--surface) 72%, transparent);
--glass-bg-strong: color-mix(in srgb, var(--surface) 86%, transparent);
--glass-border: color-mix(in srgb, var(--text) 12%, transparent);
--glass-blur: 18px;
--radius-card: 1rem;
--radius-control: 0.7rem;
--motion-fast: 140ms;
--motion-normal: 240ms;
```

### Motion

- Hoverable buttons may rise by 1–2 px and slightly strengthen their shadow.
- Pressed buttons scale to about `0.97–0.98` and return with a short easing curve.
- Cards may translate upward by at most 3 px; avoid continuous floating animations.
- Navigation indicators should slide/fade rather than flash.
- Use opacity and transform for page/card entrances; avoid animating layout properties.
- Honor `prefers-reduced-motion: reduce` and remove nonessential motion.
- Every interactive element needs a visible keyboard focus ring.

### Hero asset

- Reserve `public/hero.jpg` and reference it as `/hero.jpg`.
- Use the original placeholder hero supplied by the user when it becomes available.
- The referenced asset is not currently present in the inspected repositories. Do not download or
  generate a replacement without instruction; use a CSS gradient fallback while the file is absent.
- Target roughly `60–72vh` on the home page and a smaller banner or no hero on content pages.

## 9. Page Specifications

### `/` Home

Compose a Firefly-style landing page:

1. translucent/sticky navbar over the hero;
2. hero with site title, one-line student-union description, and two call-to-action buttons;
3. main two-column grid on desktop and one column on mobile;
4. primary cards for recent notices/articles and selected activities;
5. placeholder widget column.

Suggested placeholder widgets:

- student-union profile card;
- announcement card;
- upcoming events/calendar card;
- quick links card;
- site statistics card;
- recent forum activity card.

Keep widgets visibly marked as mock content. They should look complete but must not imply real data.

### `/archive`

- Static chronological timeline grouped by year/month.
- Mock search/category controls may filter locally.
- Clear links to mock article detail routes.
- Use compact glass rows rather than large hero cards.

### `/about`

- Student-union introduction, department/team placeholders, contact placeholder, and timeline.
- Use semantic headings and readable long-form width.
- Do not invent real officers, phone numbers, addresses, or official claims.

### `/articles`

- Article and notice listing with local category/tag filters.
- Provide representative states for cover/no-cover, pinned, notice, and ordinary article.
- Add a mock `/articles/[slug]` detail page so article links are functional.
- Prefer Astro-rendered content and minimal client JavaScript.

## 10. `/forum` Specification

Use `../pkuphysu-website/src/pages/BlogCenterV2.vue` as the behavioral reference while replacing its
visual layer with Firefly-style glass panels.

Preserve these concepts:

- main post stream;
- post card with avatar placeholder, author, ID, relative/absolute time, tags, content excerpt,
  reply count, like state, and follow state;
- local tabs for posts, followed items, and comments;
- search syntax presentation for keyword, `#id`, and `:tag` queries;
- post detail/comments area;
- new-post/editor modal shell;
- newest/oldest comment sort;
- loading, empty, and end-of-list states.

Milestone-one behavior:

- all data comes from typed fixtures;
- like/follow/tab/filter actions update only in-memory state;
- refreshing the page may reset state;
- submission buttons display a clearly labeled prototype toast or modal result;
- do not create `fetch` calls, token stores, or backend-shaped error handling yet.

Layout:

- desktop: content stream plus a narrower translucent sidebar for search, topics, recent updates,
  and announcements;
- tablet: sidebar may become a drawer or move below content;
- mobile: single column, sticky compact action row, touch targets at least 44 px;
- reuse the public background and navbar so the forum still feels like part of the main site.

Do not copy the old Element Plus appearance. Rebuild controls with the new tokens and components.

## 11. `/console` Specification

The Halo Console in `../halo/ui/console-src/` is the visual and interaction reference.

### Shell

- Full-height application layout.
- Fixed desktop sidebar approximately 16rem wide.
- PKUPHYSU wordmark/logo area at the top.
- Search control near the top with visible `Ctrl+K` hint; opening it shows a frontend-only command
  palette placeholder.
- Scrollable grouped navigation in the middle.
- Profile/avatar placeholder fixed at the bottom.
- Main content fills the remaining width and has a quiet gray background.
- Mobile layout replaces the fixed sidebar with a Halo-like compact bottom/header navigation.

### Initial console navigation

Use representative placeholder sections, not the entire Halo product:

- Dashboard
- 内容: 文章、页面、评论
- 附件
- 用户
- 外观: 菜单、主题
- 系统: 设置、工具

Each item must lead to a real local placeholder view under `/console/...`. The selected state,
group labels, submenu expansion, and keyboard focus should closely follow Halo's density and rhythm.

### Dashboard

- Halo-like page header with icon, title, and secondary “布局设置” button.
- Responsive 12-column widget grid on large screens, collapsing at tablet/mobile breakpoints.
- Placeholder widgets for article count, comment count, user count, recent posts, pending comments,
  quick actions, system information, and notifications.
- Widget cards must share a header/body/footer pattern and believable skeleton/empty states.
- Dragging/resizing is not required in milestone one, but visual handles or the designer shell may be
  represented when “布局设置” is opened.

### Console isolation

- Console styling must be namespaced so it cannot leak into public pages.
- Do not import Halo's generated API client or plugin runtime.
- Do not use Halo logos, the word “Halo” in the rendered UI, or its footer branding.
- Replace real operations with disabled/prototype interactions.

### Admin and user interface separation

- Treat the console as an administrator-facing interface and the public/forum pages as user-facing
  interfaces. They must remain visually distinguishable by default, including separate token scopes
  and layout conventions.
- The console primary hue is a blue with saturation and lightness close to the former red accent;
  do not reuse the public PKU red as the console's primary color.
- Console sidebar icons use the Halo-compatible Remix Icon set through the local Iconify wrapper.
- Sidebar option labels and active-state text are enlarged and pure black. The active-state
  decoration is a thick pure-black vertical bar with a visible gap before the option surface.
- Display-content blocks such as dashboard widgets have no resting shadow. A light, low-contrast
  shadow may appear on hover as feedback; modal layers and explicit floating surfaces are exempt.

### Authentication integration contract

- Authentication uses the backend Bearer JWT contract. Store only the token and non-sensitive user
  summary in browser storage; never store passwords or verification codes.
- Use the roles `general`, `member`, and `admin`. Access is cumulative: `general` can enter
  `/forum`, `member` additionally sees `/archive`, and `admin` additionally sees `/console`.
- `/archive` must validate `/auth/member-authorized` because archive authorization is not yet a
  backend domain feature. The backend `AuthMember` middleware accepts members and administrators.
- `/official_account` is a public read-only page backed by `/wechat/posts`; it displays crawled
  metadata and reserves a cover/首图 area without assuming every record has an image.
- Keep `/login` as the shared login/register entry and `/usr` as the authenticated personal space.
  The public logo area may render the current user's avatar and name, while anonymous users receive
  a login link.
- Account login, registration, IAAA login, email verification, avatar changes, and password changes
  call the backend. IAAA credentials are forwarded as required by the existing backend; do not add
  browser-side RSA encryption unless the backend contract explicitly adds a matching decryption step.

## 12. Components and State

Favor small, reusable primitives:

- `GlassPanel`, `ActionButton`, `TagChip`, `SectionHeading`, `EmptyState`, `SkeletonBlock`;
- `PublicNavbar`, `MobileNav`, `Hero`, `WidgetColumn`;
- `ForumPostCard`, `ForumToolbar`, `ForumSidebar`, `ForumDetailPanel`;
- `ConsoleShell`, `ConsoleSidebar`, `ConsoleMenuGroup`, `ConsolePageHeader`, `ConsoleWidgetCard`.

Keep mock types explicit. Do not pass anonymous untyped objects through large component trees.
Use Vue composables only when state is shared or behavior is nontrivial; avoid a global state library
for this prototype unless there is a demonstrated need.

## 13. Accessibility and Responsive Requirements

- Semantic landmarks: header, nav, main, aside, footer.
- Correct heading order and descriptive page titles.
- All controls keyboard operable with visible focus.
- Icon-only buttons require accessible labels and tooltips where useful.
- Dialog prototypes trap focus, close on Escape, and restore focus to the trigger.
- Maintain readable contrast despite translucent backgrounds; add a stronger surface behind long text.
- Do not encode status using color alone.
- Test at approximately 1440×900, 1024×768, 768×1024, and 390×844.
- Prevent horizontal scrolling at 390 px.
- Respect safe-area insets for mobile console navigation.

## 14. Implementation Order

1. Scaffold Astro, Vue, TypeScript, pnpm, styles, and validation scripts.
2. Add tokens, global styles, motion rules, placeholder fixtures, and base components.
3. Build the public layout, navbar, hero, and responsive widget grid.
4. Add `/`, `/archive`, `/about`, `/articles`, and mock article detail pages.
5. Build `/forum` as a focused Vue island using typed backend responses.
6. Build the isolated `/console` Vue application with backend-backed management, database, and WeChat paths.
7. Verify every link, active state, keyboard path, responsive breakpoint, and reduced-motion mode.
8. Run validation and provide desktop/mobile screenshots for review.

Keep the dashboard overview mock until a dedicated statistics API is available.

## 15. Validation Commands

The scaffold must provide these commands:

```bash
pnpm install
pnpm dev
pnpm check
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

Before handoff, at minimum run:

```bash
pnpm check
pnpm typecheck
pnpm lint
pnpm build
```

Treat warnings caused by new code as work to fix, not as successful validation.

## 16. Definition of Done for Milestone One

- All six top-level destinations render and are mutually reachable.
- Public pages visibly share one Firefly-inspired design system.
- `/forum` preserves the existing forum's recognizable layout and local interaction logic.
- `/console` closely matches Halo Console's shell and dashboard at desktop and mobile sizes while
  carrying PKUPHYSU branding.
- Static Astro pages do not ship unnecessary Vue bundles.
- Integrated areas use typed backend API helpers; only the documented overview remains mock.
- Remaining mock content is typed, local, and clearly non-production.
- Hero path is `/hero.jpg` with a graceful fallback if the asset is still absent.
- Keyboard focus, reduced motion, empty/loading states, and mobile overflow have been checked.
- `pnpm check`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.
- The final handoff lists implemented routes, validation results, known placeholders, and any license
  decision still required.

## 17. Change Discipline

- Read this file completely before acting.
- Keep frontend edits inside `pkuphysu-frontend/` and requested integration edits inside
  `pkuphysu-backend/`.
- Do not alter `blog_Firefly`, `halo`, or `pkuphysu-website`; they are read-only references.
- Do not commit secrets, copied production data, or real personal information.
- Do not add dependencies or copy GPL-licensed implementation code without surfacing the decision.
- Prefer incremental, reviewable changes and avoid generated-file noise.
- Preserve user changes in a dirty worktree.
- If a decision materially affects visual direction, licensing, route structure, or dependencies,
  stop and ask rather than silently choosing a new scope.
