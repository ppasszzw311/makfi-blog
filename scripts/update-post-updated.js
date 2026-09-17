import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 按檔案儲存時間（mtime）同步文章 frontmatter 的 updated 欄位。
// 通過 buildStart 觸發：構建時和每次 dev 啟動時都會同步一次；
// dev 執行中修改文章不觸發同步，避免儲存過程中的中間態汙染 updated。

const POSTS_DIR = fileURLToPath(new URL('../src/content/posts', import.meta.url))
const STATE_FILE = fileURLToPath(new URL('../.generated/post-updated.json', import.meta.url))

// state: { "<posts 相對路徑>": { mtime: <寫入後文件 mtime 毫秒值>, stamp: <寫入的 updated 值> } }
// 寫入 updated 本身會重新整理檔案 mtime，所以用「mtime 是否與上次寫入時一致」來判斷
// 檔案在同步之後有沒有被再次儲存，避免指令碼自己的寫入在每次啟動時反覆觸發重寫；
// 不能寫完再把 mtime 改回去：Git for Windows 的索引按秒比對 mtime，恢復後
// 位元組數相同的時間戳變更會被 git 誤判為未修改，導致改動提交不上去。
let state = {}
let stateLoaded = false

function loadState() {
  if (stateLoaded) return
  stateLoaded = true
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    state = {}
  }
}

function saveState() {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf-8')
}

function collectMdFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectMdFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatStamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function syncPostUpdated(full, rel, log = false) {
  loadState()
  const stat = statSync(full)
  const mtime = Math.round(stat.mtimeMs)
  const cached = state[rel]
  // 同步之後檔案沒有被再次儲存（mtime 一致），無需處理
  if (cached && cached.mtime === mtime) return false

  const raw = readFileSync(full, 'utf-8')
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) {
    state[rel] = { mtime, stamp: '' }
    return false
  }
  const stamp = formatStamp(stat.mtime)
  const current = fm[1].match(/^updated:\s*(['"]?)(.*)\1\s*$/m)?.[2]
  if (current !== undefined && current.trim() === stamp) {
    state[rel] = { mtime, stamp }
    return false
  }

  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  let body
  if (/^updated:.*$/m.test(fm[1])) {
    body = fm[1].replace(/^updated:.*$/m, `updated: ${stamp}`)
  } else {
    // 缺失時追加到後設資料末尾；有 draft 欄位時插到 draft 之前，
    // 與 format-post-meta 的規範字段順序（...published、updated、draft）保持一致
    const lines = fm[1].split(/\r?\n/)
    let at = lines.length
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (/^draft:/.test(lines[i])) {
        at = i
        break
      }
    }
    lines.splice(at, 0, `updated: ${stamp}`)
    body = lines.join(eol)
  }
  writeFileSync(full, raw.replace(fm[0], `---${eol}${body}${eol}---`), 'utf-8')
  state[rel] = { mtime: Math.round(statSync(full).mtimeMs), stamp }
  if (log) console.log(`[post-updated] ${rel} -> ${stamp}`)
  return true
}

export function updatePostUpdated({ enabled = true } = {}) {
  if (!enabled) return null
  return {
    name: 'update-post-updated',
    buildStart() {
      loadState()
      const rels = collectMdFiles(POSTS_DIR).map((full) => ({
        full,
        rel: path.relative(POSTS_DIR, full).split(path.sep).join('/'),
      }))
      // 清理已刪除文章殘留的狀態
      for (const rel of Object.keys(state)) {
        if (!rels.some((r) => r.rel === rel)) delete state[rel]
      }
      let count = 0
      for (const { full, rel } of rels) {
        if (syncPostUpdated(full, rel, true)) count += 1
      }
      if (count > 0) console.log(`[post-updated] synced ${count} posts`)
      saveState()
    },
  }
}
