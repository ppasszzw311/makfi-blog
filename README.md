# makfi-blog

A personal blog built with [Astro](https://astro.build) and the [CitrusGrid](https://github.com/rightdoor/citrus-grid) theme, deployed to Cloudflare Workers.

## Project Structure

```text
├── public/              static assets (avatar, logo, favicon, friend icons)
├── src/
│   ├── components/       theme UI components
│   ├── content/posts/    blog posts (Markdown)
│   ├── i18n/              translation strings
│   ├── layouts/           base page layout
│   ├── pages/             routes (home, archive, categories, tags, friends, about, post)
│   ├── styles/            theme styles (Tailwind v4)
│   └── site.config.ts     site title, author, socials, language, feature toggles
├── scripts/               build-time helpers (slugs, LQIP, search index, etc.)
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
| :-------------------------- | :--------------------------------------------------- |
| `npm install`                | Installs dependencies                                |
| `npm run dev`                 | Starts local dev server at `localhost:4321`          |
| `npm run build`               | Builds the production site to `./dist/`              |
| `npm run preview`             | Builds and previews locally via Wrangler             |
| `npm run new-post -- <slug>`  | Scaffolds a new post at `src/content/posts/<slug>.md`|
| `npm run check`               | Type-checks the project                              |
| `npm run deploy`              | Builds and deploys to Cloudflare Workers             |

## Writing posts

Posts live in `src/content/posts/*.md`. Frontmatter fields:

```yaml
title: "Post title"
slug: post-slug
index: 0            # higher = pinned above newer posts
description: "One-line summary"
category: "General"
tags: [tag1, tag2]
published: 2024-01-01
draft: false
```

Images referenced with a relative path (e.g. `./cover.webp`) should sit alongside the post's Markdown file.

## Customizing the site

Edit `src/site.config.ts` for the site title, author, avatar/logo, default language, social links, and to enable/disable comments, visitor stats, and friend links.

## Deploying

This project deploys Astro's static build output (`./dist`) as Cloudflare Workers assets — see `wrangler.jsonc` for the custom domain and deploy config.

## Credit

Theme based on [CitrusGrid](https://github.com/rightdoor/citrus-grid) by [rightdoor](https://github.com/rightdoor), MIT licensed.
