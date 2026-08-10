import type { Drill } from '@/lib/data/types'

export const CATEGORY_LABEL: Record<Drill['category'], string> = {
  footwork: 'Footwork',
  net: 'Net',
  'rear-court': 'Rear court',
  conditioning: 'Conditioning',
  agility: 'Agility',
  plyometric: 'Plyometric',
}

export const LEVEL_LABEL: Record<Drill['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
