export type Role = 'user' | 'admin' | 'owner'

export type Profile = {
  id: string
  name: string
  email: string
  role: Role
  avatar_url?: string | null
}

export type Level = {
  id: string
  name: string
  difficulty_label: string
  description: string
  sort_order: number
  max_cards: number
  is_active: boolean
  card_count?: number
}

export type LearningCard = {
  id: string
  level_id: string
  phrase: string
  translation: string
  explanation: string
  topic: string
  image_path?: string | null
  correct_answer: string
  options: string[]
}

export type Tutorial = {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url?: string | null
  category: string
  duration_seconds?: number | null
  is_published: boolean
}

export type StoreItem = {
  id: string
  name: string
  description: string
  item_type: 'banner' | 'badge' | 'frame'
  price_points: number
  asset_url: string
  preview_url?: string | null
  rarity: string
  stock?: number | null
  is_published: boolean
}

export type OwnedItem = StoreItem & {
  item_id: string
  quantity: number
}

export type UserProgress = {
  points: number
  current_streak: number
}
