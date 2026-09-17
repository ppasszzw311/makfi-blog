export interface SocialLink {
  platform: string
  url: string
}

export interface PortfolioItemRaw {
  title: string
  description: string
  url?: string
  repoUrl?: string
  image?: string
  tags?: string[]
  period?: string
}

export const siteConfig = {
  // 站點地址，用於 sitemap 、 RSS 等地方
  // Site URL used for sitemap, RSS, etc.
  // 例 e.g. https://example.com
  url: 'https://blog.makfichen.dev',

  // 站點資訊 Site info
  title: 'Pablo Chen\'s Blog',
  subtitle: 'Pablo 的筆記小天地!',
  description: 'Pablo 的筆記小天地!',

  // 首頁卡片的頭像和網站圖示 Logo ， public/ 下的靜態路徑，以 / 開頭
  // Avatar and site logo for the home profile card. Static paths under public/, starting with /
  // 例 e.g. /avatar.webp 、 /logo.webp
  avatar: '/avatar.webp',
  logo: '/logo.webp',

  // 作者 Author name
  author: 'Pablo Chen',

  // 預設語言： zh 、 ja 、 en
  // Default language: zh, ja, en
  defaultLang: 'en' as 'zh' | 'ja' | 'en',

  // 預設主題： auto 、 light 、 dark
  // Default theme: auto, light, dark
  defaultTheme: 'auto' as 'auto' | 'light' | 'dark',

  // 首頁每頁文章數 Posts per page on the home page
  postsPerPage: 10,

  // 個人名片社交按鈕，改為空陣列 [] 則不顯示社交按鈕
  // Social buttons on the profile card. Set to an empty array [] to hide them
  // 支援 Supported: github 、 twitter 、 linkedin 、 youtube 、 instagram 、 facebook 、 devto 、 medium 、 rss 、 email 、 website
  // 沒有獨立設定圖示的使用通用連結圖示
  // Platforms without a dedicated icon fall back to a generic link icon
  socials: [{ platform: 'rss', url: '/rss.xml' }] as SocialLink[],

  // 統計指令碼，指令碼位於 src/stats/ 目錄，契約詳見 src/stats/使用規則.md ，留空不啟用
  // Statistics script. Scripts live in src/stats/, see src/stats/usageRules.md for the plugin contract. Leave empty to disable
  statsScript: '',

  // 作品集，改為空陣列 [] 顯示空狀態頁。截圖放在 public/portfolio/ 下，引用以 /portfolio/檔名.字尾
  // Portfolio items. Set to an empty array [] to show an empty state. Screenshots go under public/portfolio/ and are referenced as /portfolio/filename.ext
  // 例 e.g. { title: '個人部落格', description: '用 Astro 打造的個人部落格', url: 'https://blog.example.com', repoUrl: 'https://github.com/you/blog', image: '/portfolio/blog.webp', tags: ['Astro', 'TypeScript'], period: '2025.09' }
  portfolio: [] as PortfolioItemRaw[],

  // 評論指令碼，指令碼位於 src/comments/ 目錄，契約詳見 src/comments/使用規則.md ，留空不啟用評論區
  // Comment script. Scripts live in src/comments/, see src/comments/usageRules.md for the adapter contract. Leave empty to disable the comment section
  commentScript: '',

  // 根據檔案儲存時間自動更新文章的 updated 欄位，僅在啟動和構建時更新
  // Auto-update each post's `updated` field from its file save time only updated during startup and build
  autoUpdatePostUpdated: false,
}
