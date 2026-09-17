/**
  Utterances 評論介面卡，基於 https://utteranc.es ：
  借用 GitHub Issues 儲存評論，評論者需授權 GitHub App 登入後發言。

  啟用方式：site.config.ts 設定 `commentScript: utterances`，並在下方配置區填寫 repo。
  介面卡契約詳見同目錄《使用規則.md》。
 */

// ========== 配置區：使用前在這裡填寫你的 utterances 設定 ==========
const config = {
  // 必填：接收評論的公開 GitHub 倉庫，格式 '使用者名稱/倉庫名'（需在該倉庫安裝 utterances App）。
  // 留空則評論區停用（控制台會提示）。
  repo: '',
  // 評論與頁面的對映方式：'pathname'（推薦，按頁面路徑建 Issue）、'url'、'title' 等
  issueTerm: 'pathname',
  // 可選：為自動建立的 Issue 打標籤（標籤需已存在於倉庫），留空不打
  label: '',
  // 明 / 暗兩套主題，可選值見 https://utteranc.es 的 theme
  lightTheme: 'github-light',
  darkTheme: 'github-dark',
}
// =================================================================

const UTTERANCES_ORIGIN = 'https://utteranc.es'

const utterancesTheme = (dark: boolean) => (dark ? config.darkTheme : config.lightTheme)

const isDark = () => document.documentElement.classList.contains('dark')

// 掛載評論（契約必選）：向容器注入 utterances 引導指令碼（async），iframe 由其自行渲染
export function mountComment(container: HTMLElement): void {
  if (!config.repo) {
    throw new Error(
      '[comments] utterances.repo 未配置，請編輯 src/comments/utterances.ts 填寫 repo',
    )
  }
  const script = document.createElement('script')
  script.src = `${UTTERANCES_ORIGIN}/client.js`
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('repo', config.repo)
  script.setAttribute('issue-term', config.issueTerm)
  if (config.label) script.setAttribute('label', config.label)
  script.setAttribute('theme', utterancesTheme(isDark()))
  container.appendChild(script)
}

// 主題切換（契約可選）：跟隨全域性 theme-change 事件，把新主題同步進已渲染的 utterances iframe
export function onThemeChange(dark: boolean): void {
  document.querySelectorAll<HTMLIFrameElement>('.utterances iframe').forEach((iframe) => {
    iframe.contentWindow?.postMessage(
      { type: 'set-theme', theme: utterancesTheme(dark) },
      UTTERANCES_ORIGIN,
    )
  })
}
