/**
  評論客戶端執行時（由 Comments.astro 在 site.config.ts commentScript 啟用時注入）。

  工作方式：每次頁面載入（首次整頁 + Swup 導航，經 onPageLoad）查詢評論區掛載點
  （[data-comment-script]），用 IntersectionObserver 監聽評論區臨近視口時才動態
  載入指名的介面卡並掛載評論。評論在首屏之下時，首屏載入完全不請求任何評論資源。

  效能四件套：
  1. 懶載入：IntersectionObserver 提前 rootMargin 預載，不支援 IO 的環境降級為立即載入；
  2. 程式碼拆分：import.meta.glob 讓每個介面卡成為獨立 chunk，只拉取被指名的那一個，
     模組會話級快取，Swup 換頁不重複拉取；
  3. 預留佔位：掛載區由服務端渲染（最小高度 + shimmer 骨架），介面卡渲染出首個
     非 script 子節點後撤掉骨架，全程無佈局跳動；
  4. 非同步載入：介面卡載入與第三方指令碼注入均為非同步，任何失敗都只 console.warn
     並隱藏評論區（is-error），不影響頁面其餘部分。

  掛載點與介面卡契約詳見同目錄《使用規則.md》。
 */
import { onPageLoad } from '@/lib/pageLifecycle'

// 評論介面卡必須匯出的介面（mountComment 必選，其餘可選，按需匯出）
export interface CommentAdapter {
  // 把評論掛載進容器；拋錯 = 掛載失敗（執行時隱藏整個評論區）
  mountComment: (container: HTMLElement) => void | Promise<void>
  // 主題切換回調（dark = 是否深色），由執行時監聽全域性 theme-change 事件轉發
  onThemeChange?: (dark: boolean) => void
  // Swup 換頁、評論區即將隨舊 DOM 銷燬前的清理鉤子（定時器/監聽器等，一般無需）
  unmountComment?: () => void
}

// 提前預載距離：評論區距視口多近時開始載入介面卡
const LOAD_MARGIN = '300px 0px'
// 骨架兜底超時（毫秒）：介面卡已掛載但遲遲渲染不出內容時，超時撤掉骨架防卡死
const SKELETON_TIMEOUT = 8000

// ---------- 介面卡載入（相對路徑 glob，名字對不上即取不到，天然免疫路徑穿越） ----------

const adapterModules = import.meta.glob<CommentAdapter>(['./*.ts', '!./client.ts'])
// 會話級快取：同一介面卡只加載一次，Swup 換頁直接複用
const adapterCache = new Map<string, Promise<CommentAdapter | null>>()

function loadAdapter(name: string): Promise<CommentAdapter | null> {
  let cached = adapterCache.get(name)
  if (!cached) {
    cached = (async () => {
      const importer = adapterModules[`./${name}.ts`]
      if (!importer) {
        console.warn(`[comments] 未找到評論介面卡 src/comments/${name}.ts，評論區已停用`)
        return null
      }
      try {
        const adapter = await importer()
        if (typeof adapter.mountComment !== 'function') {
          console.warn(`[comments] 評論介面卡 ${name}.ts 未匯出 mountComment，評論區已停用`)
          return null
        }
        return adapter
      } catch (err) {
        console.warn(`[comments] 載入評論介面卡 ${name}.ts 失敗：`, err)
        return null
      }
    })()
    adapterCache.set(name, cached)
  }
  return cached
}

// ---------- 佔位狀態機：介面卡渲染出內容（非 script 子節點）後撤掉骨架 ----------

function watchContent(container: HTMLElement, onContent: () => void) {
  const done = () => {
    observer.disconnect()
    clearTimeout(timer)
    onContent()
  }
  const observer = new MutationObserver(() => {
    // script 標籤只是引導程式碼（如 utterances 注入的 client.js），不算渲染完成
    if (Array.from(container.children).some((el) => el.tagName !== 'SCRIPT')) done()
  })
  const timer = setTimeout(done, SKELETON_TIMEOUT)
  observer.observe(container, { childList: true })
  return () => {
    observer.disconnect()
    clearTimeout(timer)
  }
}

// ---------- 每次頁面載入：臨近視口才載入介面卡並掛載 ----------

let currentAdapter: CommentAdapter | null = null

async function mount(section: HTMLElement) {
  const name = (section.dataset.commentScript || '').trim()
  const container = section.querySelector<HTMLElement>('.comment-mount')
  if (!name || !container) return

  const stopWatching = watchContent(container, () => section.classList.add('is-loaded'))

  const adapter = await loadAdapter(name)
  if (!adapter) {
    stopWatching()
    section.classList.add('is-error')
    return
  }
  currentAdapter = adapter

  try {
    await adapter.mountComment(container)
  } catch (err) {
    stopWatching()
    currentAdapter = null
    console.warn(`[comments] 掛載評論介面卡 ${name}.ts 失敗：`, err)
    section.classList.add('is-error')
  }
}

function init() {
  const section = document.querySelector<HTMLElement>('[data-comment-script]')
  if (!section || section.dataset.commentInit) return
  section.dataset.commentInit = '1'

  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        io.disconnect()
        mount(section).catch(() => {})
      },
      { rootMargin: LOAD_MARGIN },
    )
    io.observe(section)
  } else {
    mount(section).catch(() => {})
  }
}

// ---------- 全域性事件：主題轉發 + 換頁清理 ----------

document.addEventListener('theme-change', (e) => {
  currentAdapter?.onThemeChange?.((e as CustomEvent<string>).detail === 'dark')
})

document.addEventListener('astro:before-swap', () => {
  currentAdapter?.unmountComment?.()
  currentAdapter = null
})

onPageLoad(() => {
  init()
})
