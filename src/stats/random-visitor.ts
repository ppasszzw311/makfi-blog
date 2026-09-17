/**
  測試用統計外掛：隨機生成全站與文章的 PV / UV 數字，用於本地調整統計顯示效果。

  啟用：site.config.ts 填 statsScript: 'random-visitor'（僅生產環境注入，dev 不生效）。
  注意 client.ts 有 TTL 快取（生產 5 分鐘），TTL 內換頁數字保持不變；清掉 sessionStorage
  或等 TTL 過期即可看到新隨機數。測試完記得換回正式統計指令碼或留空停用。
*/

// 每次請求的人為延遲（毫秒），方便觀察佔位「-」到數字填充的過渡
const FAKE_DELAY = 300

// 位數的隨機範圍：[minDigits, maxDigits]，按需調整來測試不同長度的排版
const SITE_PV_DIGITS: [number, number] = [4, 6]
const SITE_UV_DIGITS: [number, number] = [3, 5]
const ARTICLE_PV_DIGITS: [number, number] = [1, 4]
const ARTICLE_UV_DIGITS: [number, number] = [1, 4]

function randomDigits([min, max]: [number, number]): number {
  const digits = min + Math.floor(Math.random() * (max - min + 1))
  const low = 10 ** (digits - 1)
  return low + Math.floor(Math.random() * (9 * low))
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function trackVisit(_path?: string) {}

export async function getSiteTotal() {
  await delay(FAKE_DELAY)
  return { siteTotal: randomDigits(SITE_PV_DIGITS), siteUnique: randomDigits(SITE_UV_DIGITS) }
}

export async function getArticleStats(_path: string) {
  await delay(FAKE_DELAY)
  return {
    articleTotal: randomDigits(ARTICLE_PV_DIGITS),
    articleUnique: randomDigits(ARTICLE_UV_DIGITS),
    siteTotal: randomDigits(SITE_PV_DIGITS),
    siteUnique: randomDigits(SITE_UV_DIGITS),
  }
}
