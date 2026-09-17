export interface ResumeContact {
  label: string
  value: string
  url?: string
  icon?: 'email' | 'github' | 'linkedin' | 'website' | 'link'
}

export interface ResumeSkillGroup {
  category: string
  items: string[]
}

export interface ResumeExperience {
  company: string
  role: string
  period: string
  location?: string
  highlights: string[]
}

export interface ResumeEducation {
  school: string
  degree: string
  period: string
}

export interface ResumeConfig {
  // 職稱／一句話定位，顯示在名字下方 Job title / one-line positioning shown under the name
  title: string
  // 自我介紹，幾句話即可 A short self-introduction paragraph
  summary: string
  // 聯絡方式 Contact links
  contacts: ResumeContact[]
  // 技能，依分類分組 Skills, grouped by category
  skills: ResumeSkillGroup[]
  // 工作經歷，由新到舊 Work experience, newest first
  experience: ResumeExperience[]
  // 學歷 Education
  education: ResumeEducation[]
  // 證照、獲獎等其他項目 Certifications, awards, etc.
  certifications: string[]
}

// 履歷內容，填好後會自動顯示在 /about 頁面；留空的區塊不會顯示
// Resume content — fill this in and it shows up on /about automatically; empty sections are hidden
export const resumeConfig: ResumeConfig = {
  title: '',
  summary: '',
  contacts: [
    // { label: 'Email', value: 'you@example.com', url: 'mailto:you@example.com', icon: 'email' },
    // { label: 'GitHub', value: 'github.com/you', url: 'https://github.com/you', icon: 'github' },
  ],
  skills: [
    // { category: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS'] },
  ],
  experience: [
    // {
    //   company: '公司名稱',
    //   role: '職稱',
    //   period: '2023.01 - 至今',
    //   location: 'Taipei, Taiwan',
    //   highlights: ['做了什麼、帶來什麼影響（盡量量化）'],
    // },
  ],
  education: [
    // { school: '學校名稱', degree: '系所／學位', period: '2018 - 2022' },
  ],
  certifications: [
    // '證照或獲獎名稱',
  ],
}
