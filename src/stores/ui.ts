export type SortBy = 'name' | 'count'

function sortSetting(key: string) {
  return {
    get(): SortBy {
      if (typeof localStorage === 'undefined') return 'count'
      return localStorage.getItem(key) === 'name' ? 'name' : 'count'
    },
    set(value: SortBy) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
    },
  }
}

// 分類頁排序，預設按數量
export const categoriesSort = sortSetting('categoriesSort')

// 標籤頁排序，預設按數量
export const tagsSort = sortSetting('tagsSort')
