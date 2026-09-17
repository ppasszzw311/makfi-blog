/**
  統計客戶端執行時（由 BaseLayout 在 site.config.ts statsScript 啟用時注入）。

  工作方式：每次頁面載入（首次整頁 + Swup 導航，經 onPageLoad）先呼叫外掛的trackVisit（若匯出）記錄一次訪問，再收集當前頁的統計掛載點（[data-stats]），按需向統計外掛請求資料並填充數字。因此數字隨每次訪問即時更新，不再烙印在構建產物裡。

  節約請求的三層設計：
  1. 快取：sessionStorage + TTL（生產 5 分鐘；dev 1 分鐘），成功與失敗都會快取，失敗為負快取：TTL 內重新整理/換頁既不重試也不重畫，避免失敗請求風暴。
  2. 複用：文章介面響應附帶全站資料時直接複用，省掉 /total 請求。
  3. 限速：序列佇列 + 最小請求間隔，避免瞬時併發打爆統計服務。

  掛載點與外掛契約詳見同目錄《使用規則.md》。
  statsScript 啟用時掛載點隨頁面渲染（佔位「-」），獲取成功填充數字，失敗保留「-」。
 */
import { onPageLoad } from '@/lib/pageLifecycle'

// 統計外掛必須匯出的介面（均為可選，按需匯出）
interface StatsPlugin {
  // 埋點上報（可選）：客戶端在每次頁面載入時呼叫一次，向統計服務記錄一次訪問
  trackVisit?: (path?: string) => void
  getSiteTotal?: () => Promise<{ siteTotal: number; siteUnique: number }>
  getArticleStats?: (path: string) => Promise<{
    articleTotal: number
    articleUnique: number
    // 可選：附帶的全站資料（有則免去 /total 請求）
    siteTotal?: number
    siteUnique?: number
  }>
}

// 統計指令碼名（BaseLayout 寫在 <html data-stats-script> 上）
const SCRIPT_NAME = document.documentElement.dataset.statsScript || ''

// 快取 TTL（毫秒）：生產 5 分鐘；dev 1 分鐘短快取，兼顧除錯新鮮度與請求頻率
const CACHE_TTL = import.meta.env.DEV ? 60_000 : 5 * 60_000
// 速率限制：相鄰兩次請求的最小間隔（毫秒）
const REQUEST_GAP = 150

// ---------- 外掛載入（相對路徑 glob，名字對不上即取不到，天然免疫路徑穿越） ----------

const pluginModules = import.meta.glob<StatsPlugin>('./*.ts')
let pluginPromise: Promise<StatsPlugin | null> | null = null

function loadPlugin(): Promise<StatsPlugin | null> {
  pluginPromise ??= (async () => {
    if (!SCRIPT_NAME) return null
    const importer = pluginModules[`./${SCRIPT_NAME}.ts`]
    if (!importer) {
      console.warn(`[stats] 未找到統計指令碼 src/stats/${SCRIPT_NAME}.ts，統計已停用`)
      return null
    }
    try {
      const plugin = await importer()
      if (
        typeof plugin.trackVisit !== 'function' &&
        typeof plugin.getSiteTotal !== 'function' &&
        typeof plugin.getArticleStats !== 'function'
      ) {
        console.warn(`[stats] 統計指令碼 ${SCRIPT_NAME}.ts 未匯出任何外掛介面，統計已停用`)
        return null
      }
      return plugin
    } catch (err) {
      console.warn(`[stats] 載入統計指令碼 ${SCRIPT_NAME}.ts 失敗：`, err)
      return null
    }
  })()
  return pluginPromise
}

// ---------- sessionStorage 快取（TTL 內同一瀏覽器會話不重複請求，失敗也快取） ----------

interface CachedData {
  pv: number
  uv: number
  t: number
}

// 負快取：請求失敗的記錄，TTL 內不重試
interface CachedError {
  err: true
  t: number
}

type CacheEntry = CachedData | CachedError

function readCache(key: string): CacheEntry | null {
  if (CACHE_TTL <= 0) return null
  try {
    const raw = sessionStorage.getItem(`stats:${key}`)
    if (!raw) return null
    const hit = JSON.parse(raw) as CacheEntry
    if (typeof hit.t !== 'number' || Date.now() - hit.t > CACHE_TTL) return null
    return hit
  } catch {
    return null
  }
}

function writeCache(key: string, data: CacheEntry) {
  try {
    sessionStorage.setItem(`stats:${key}`, JSON.stringify(data))
  } catch {
    // 隱私模式等場景寫入失敗可忽略
  }
}

// ---------- 序列佇列（速率限制） ----------

let chain: Promise<unknown> = Promise.resolve()
let lastStart = 0

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = lastStart + REQUEST_GAP - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastStart = Date.now()
    return task()
  })
  chain = run.catch(() => undefined)
  return run
}

// ---------- 掛載點收集與填充 ----------

interface MountGroup {
  pv: HTMLElement[]
  uv: HTMLElement[]
}

// 收集當前頁掛載點：site = 全站統計；articles = 按路徑分組的文章統計
function collect() {
  const site: MountGroup = { pv: [], uv: [] }
  const articles = new Map<string, MountGroup>()
  document.querySelectorAll<HTMLElement>('[data-stats]').forEach((el) => {
    const path = el.closest<HTMLElement>('[data-stats-path]')?.dataset.statsPath
    switch (el.dataset.stats) {
      case 'site-pv':
        site.pv.push(el)
        break
      case 'site-uv':
        site.uv.push(el)
        break
      case 'article-pv':
      case 'article-uv': {
        if (!path) return
        let group = articles.get(path)
        if (!group) {
          group = { pv: [], uv: [] }
          articles.set(path, group)
        }
        ;(el.dataset.stats === 'article-pv' ? group.pv : group.uv).push(el)
        break
      }
    }
  })
  return { site, articles }
}

// 按文件語言本地化數字
const fmt = (n: number) => n.toLocaleString(document.documentElement.lang || undefined)

// 填充數字（成功時呼叫；失敗時掛載點保留初始「-」佔位）
function fill(group: MountGroup, data: { pv: number; uv: number }) {
  const pv = fmt(data.pv)
  const uv = fmt(data.uv)
  group.pv.forEach((el) => {
    el.textContent = pv
  })
  group.uv.forEach((el) => {
    el.textContent = uv
  })
}

// 失敗佔位：顯式寫回「-」
function fillPlaceholder(group: MountGroup) {
  group.pv.forEach((el) => {
    el.textContent = '-'
  })
  group.uv.forEach((el) => {
    el.textContent = '-'
  })
}

// ---------- 每次頁面載入的重新整理流程 ----------

async function refresh() {
  if (!SCRIPT_NAME) return
  const plugin = await loadPlugin()
  if (!plugin) return

  // 0. 埋點上報：每次頁面載入（首次整頁 + Swup 導航）呼叫一次，記錄一次訪問。
  //    fire-and-forget：不快取、不限速（每次真實訪問都應記錄）；
  //    實現須內部靜默失敗，這裡也不再捕獲，避免影響後續數字展示。
  plugin.trackVisit?.(location.pathname)

  const { site, articles } = collect()
  const needSite = site.pv.length > 0 || site.uv.length > 0
  if (!needSite && articles.size === 0) return

  // 1. 全站統計：快取命中（成功/失敗）直接按快取顯示，不再請求
  let siteData: CachedData | null = null
  let siteCached = false
  if (needSite) {
    const cached = readCache('site')
    if (cached) {
      siteCached = true
      if ('err' in cached) fillPlaceholder(site)
      else {
        siteData = cached
        fill(site, cached)
      }
    }
  }

  // 2. 文章統計：快取優先（成功填數字 / 失敗填「-」），未命中進序列佇列
  const getArticle = plugin.getArticleStats
  if (typeof getArticle === 'function') {
    for (const [path, group] of articles) {
      const cached = readCache(`art:${path}`)
      if (cached) {
        if ('err' in cached) fillPlaceholder(group)
        else fill(group, cached)
        continue
      }
      enqueue(async () => {
        try {
          const res = await getArticle(path)
          const data: CachedData = { pv: res.articleTotal, uv: res.articleUnique, t: Date.now() }
          fill(group, data)
          writeCache(`art:${path}`, data)
          if (typeof res.siteTotal === 'number' && typeof res.siteUnique === 'number') {
            const s: CachedData = { pv: res.siteTotal, uv: res.siteUnique, t: Date.now() }
            writeCache('site', s)
            if (needSite && !siteData) {
              siteData = s
              fill(site, s)
            }
          }
        } catch (err) {
          console.warn(`[stats] 獲取文章統計失敗（${path}）：`, err)
          // 失敗也寫負快取：TTL 內重新整理/換頁不重試
          writeCache(`art:${path}`, { err: true, t: Date.now() })
          fillPlaceholder(group)
        }
      })
    }
  }

  // 3. 全站統計兜底：無任何快取時才請求 /total（佇列尾執行，若文章響應已順帶填充則跳過）
  const getSite = plugin.getSiteTotal
  if (needSite && !siteCached && !siteData && typeof getSite === 'function') {
    enqueue(async () => {
      if (siteData) return
      try {
        const res = await getSite()
        const s: CachedData = { pv: res.siteTotal, uv: res.siteUnique, t: Date.now() }
        fill(site, s)
        writeCache('site', s)
      } catch (err) {
        console.warn('[stats] 獲取全站統計失敗：', err)
        writeCache('site', { err: true, t: Date.now() })
        fillPlaceholder(site)
      }
    })
  }
}

onPageLoad(() => {
  refresh().catch(() => {})
})
