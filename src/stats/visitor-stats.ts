// ============================================================
// 統計外掛：visitor-stats（Cloudflare Worker 統計服務示例實現）
// 介面契約詳見同目錄《使用規則.md》
// 啟用方式：site.config.ts 中 statsScript: 'visitor-stats'
//
// 查詢統一走 /total：一次請求返回全站累計 + 全部文章累計列表，
// 外掛內部做「模組級 in-flight 去重 + localStorage TTL 快取」，
// 資料寫入 localStorage（跨標籤頁/新視窗共享）：頁面切換、預取、新開標籤
// 都直接讀快取，0 請求；過期或不存在才發 1 次請求並回寫快取，
// 徹底避免頻繁換頁/預取導致的限流（429）。
// 服務端另有 Cache-Control: public, max-age=60 邊緣快取，雙層減壓。
// ====================================================

interface ArticleEntry {
  path: string
  articleTotal: number
  articleUnique: number
  articleLastUpdated: number
}

interface TotalResponse {
  siteTotal: number
  siteUnique: number
  siteLastUpdated: number
  articles: ArticleEntry[]
}

const STATS_BASE = ''

// 統計服務 API 金鑰，不用擔心洩露， worker 增加域名識別，僅在當前域名下有效
const STATS_API_KEY = ''

interface RealtimeStatsResponse {
  total: number
  unique: number
  period: 'today'
  path?: string
}

// /total 客戶端快取 TTL（外掛僅生產環境注入）
const TOTAL_CACHE_TTL = 5 * 60_000
const TOTAL_CACHE_KEY = 'visitor-stats:total'

// /total 獲取（in-flight 去重 + localStorage TTL 快取）

let totalPromise: Promise<TotalResponse> | null = null

function fetchTotal(): Promise<TotalResponse> {
  totalPromise ??= (async () => {
    // 1. TTL 內直接用 localStorage 快取（跨標籤頁共享，換頁/新開標籤均 0 請求）
    try {
      const raw = localStorage.getItem(TOTAL_CACHE_KEY)
      if (raw) {
        const hit = JSON.parse(raw) as { t: number; data: TotalResponse }
        if (
          typeof hit.t === 'number' &&
          typeof hit.data?.siteTotal === 'number' &&
          Date.now() - hit.t <= TOTAL_CACHE_TTL
        ) {
          return hit.data
        }
      }
    } catch {
      /* 快取讀取失敗（隱私模式等）忽略，直接請求 */
    }

    // 2. 請求 /total（服務端 60s 邊緣快取）
    const res = await fetch(`${STATS_BASE}/total`)
    const data = (await res.json()) as TotalResponse
    if (!res.ok) {
      throw new Error(
        `請求失敗 (${res.status}): ${(data as unknown as { error?: string }).error ?? 'unknown'}`,
      )
    }

    // 3. 回寫快取
    try {
      localStorage.setItem(TOTAL_CACHE_KEY, JSON.stringify({ t: Date.now(), data }))
    } catch {
      /* 寫入失敗（容量滿等）可忽略 */
    }
    return data
  })()
  // 失敗時清空 in-flight，允許後續重試（client.ts 的負快取另有一層保護）
  totalPromise.catch(() => {
    totalPromise = null
  })
  return totalPromise
}

// ---------- 外掛契約實現 ----------

// 路徑歸一化：去掉尾斜槓（根路徑除外）。頁面 URL 與統計服務的 path 鍵
// 必須一致——託管平臺（如 Cloudflare Pages）會把 /posts/x 重定向到 /posts/x/，
// location.pathname 帶斜槓而 data-stats-path 不帶，不歸一化會導致統計失配。
function normalizePath(p: string): string {
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

export function trackVisit(path: string = location.pathname): void {
  fetch(`${STATS_BASE}/log?path=${encodeURIComponent(normalizePath(path))}`, {
    keepalive: true,
    referrerPolicy: 'no-referrer-when-downgrade',
  }).catch(() => {
    /* 埋點失敗靜默，不影響頁面 */
  })
}

export async function getSiteTotal(): Promise<{
  siteTotal: number
  siteUnique: number
}> {
  const total = await fetchTotal()
  return { siteTotal: total.siteTotal, siteUnique: total.siteUnique }
}

export async function getArticleStats(path: string): Promise<{
  articleTotal: number
  articleUnique: number
  siteTotal: number
  siteUnique: number
}> {
  const total = await fetchTotal()
  // 未收錄的文章（如剛釋出還沒被 /log 埋點過）統一顯示 0，不視為錯誤
  const article = total.articles?.find((a) => a.path === normalizePath(path))
  return {
    articleTotal: article?.articleTotal ?? 0,
    articleUnique: article?.articleUnique ?? 0,
    siteTotal: total.siteTotal,
    siteUnique: total.siteUnique,
  }
}

export async function getRealtimeStats(
  opts: { path?: string; period?: 'today' | 'all' } = {},
): Promise<RealtimeStatsResponse> {
  if (!STATS_API_KEY) {
    throw new Error('未配置 STATS_API_KEY，/stats 介面需要 Authorization: Bearer <API_KEY> 鑑權')
  }
  const params = new URLSearchParams({ period: opts.period ?? 'today' })
  if (opts.path) params.set('path', opts.path)
  const res = await fetch(`${STATS_BASE}/stats?${params}`, {
    headers: { Authorization: `Bearer ${STATS_API_KEY}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`請求失敗 (${res.status}): ${(data as { error?: string }).error ?? 'unknown'}`)
  }
  return data as RealtimeStatsResponse
}
