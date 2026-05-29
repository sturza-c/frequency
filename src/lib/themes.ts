export interface Mood {
  id: string
  name: string
  accent: string
}

export const MOODS: Mood[] = [
  { id: 'amber', name: 'Amber', accent: '#D8B68A' },
  { id: 'rust', name: 'Rust', accent: '#C28F6A' },
  { id: 'rose', name: 'Rose', accent: '#CE9197' },
  { id: 'sage', name: 'Sage', accent: '#9DB0A6' },
  { id: 'azure', name: 'Azure', accent: '#8FA6BC' },
  { id: 'violet', name: 'Violet', accent: '#A99CC4' },
]

export type SceneId = 'minimal' | 'glow' | 'aurora'

export const SCENES: { id: SceneId; name: string; blurb: string }[] = [
  { id: 'minimal', name: 'Minimal', blurb: 'Clean and quiet' },
  { id: 'glow', name: 'Glow', blurb: 'Soft ambient halo' },
  { id: 'aurora', name: 'Aurora', blurb: 'Drifting light' },
]
