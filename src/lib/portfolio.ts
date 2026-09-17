import { siteConfig } from '@/site.config'

export interface PortfolioItem {
  title: string
  description: string
  url: string
  repoUrl: string
  image: string
  tags: string[]
  period: string
}

export function getPortfolioItems(): PortfolioItem[] {
  return siteConfig.portfolio.map((p) => ({
    title: p.title,
    description: p.description,
    url: (p.url || '').trim(),
    repoUrl: (p.repoUrl || '').trim(),
    image: (p.image || '').trim(),
    tags: p.tags ?? [],
    period: (p.period || '').trim(),
  }))
}
