import { type CollectionEntry, getCollection } from 'astro:content'
import dayjs from 'dayjs'
import readingTime from 'reading-time'

export type Post = CollectionEntry<'posts'>

export interface YearGroup {
  year: string
  items: Post[]
}

export interface NameCount {
  name: string
  count: number
}

// 全部文章，生產環境排除 'draft: true' ，順序置頂順序再到時間倒敘排列
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })
  return posts.sort(
    (a, b) =>
      b.data.index - a.data.index || b.data.published.valueOf() - a.data.published.valueOf(),
  )
}

// 字數統計（reading-time 詞邊界統計：CJK 逐字計入、英文按詞計入，Markdown 語法符號不計）
export function wordCount(post: Post): number {
  return readingTime(post.body ?? '').words
}

// 閱讀時長：400 字/分鐘，最少 1 分鐘
export function readMinutes(post: Post): number {
  return Math.max(1, Math.ceil(wordCount(post) / 400))
}

// 日期格式化 YYYY-MM-DD HH:mm
export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 摘要：description 優先，否則從正文順序提取 120 字
export function excerptOf(post: Post): string {
  if (post.data.description) return post.data.description
  const stripped = (post.body ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`>]/g, '')
    .trim()
  return stripped.length > 120 ? `${stripped.slice(0, 120)}...` : stripped
}

// 全站字數
export function totalWords(posts: Post[]): number {
  return posts.reduce((sum, p) => sum + wordCount(p), 0)
}

// 全站閱讀時長
export function totalMinutes(posts: Post[]): number {
  return posts.reduce((sum, p) => sum + readMinutes(p), 0)
}

// 分類（預設按數量降序）
export function groupByCategory(posts: Post[]): NameCount[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    map.set(p.data.category, (map.get(p.data.category) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// 標籤（預設按數量降序）
export function groupByTags(posts: Post[]): NameCount[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.data.tags) {
      map.set(tag, (map.get(tag) || 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// 歸檔，按年分組，固定為倒序
export function groupByYear(posts: Post[]): YearGroup[] {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const year = String(dayjs(p.data.published).year())
    let items = map.get(year)
    if (!items) {
      items = []
      map.set(year, items)
    }
    items.push(p)
  }
  return [...map.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({ year, items }))
}

// 歸檔日期格式：MM-DD
export function monthDay(date: Date): string {
  return dayjs(date).format('MM-DD')
}
