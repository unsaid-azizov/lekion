export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  profession?: string;
  bio?: string;
  photo_path?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  status: "incomplete" | "pending" | "approved" | "rejected" | "banned";
  role: "user" | "admin";
  referral_code: string;
  is_visible_on_map: boolean;
  projects: Project[];
  links: UserLink[];
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ru: string;
  icon?: string;
}

export interface Photo {
  id: string;
  photo_path: string;
  sort_order: number;
}

export interface BusinessMember {
  id: string;
  user_id: string;
  role: "owner" | "editor";
  first_name: string;
  last_name: string;
  photo_path?: string;
  profession?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category?: Category;
  tags: string[];
  address: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  working_hours?: Record<string, { open: string; close: string }>;
  is_active: boolean;
  average_rating: number;
  review_count: number;
  photos: Photo[];
  members: BusinessMember[];
  created_at: string;
}

export interface ReviewAuthor {
  id: string;
  first_name: string;
  last_name: string;
  photo_path?: string;
}

export interface Review {
  id: string;
  business_id: string;
  author: ReviewAuthor;
  rating: number;
  comment?: string;
  owner_reply?: string;
  owner_reply_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  profession?: string;
  photo_path?: string;
}

export interface BusinessPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category_slug?: string;
  average_rating: number;
}

export interface MapPins {
  people: PersonPin[];
  businesses: BusinessPin[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  url?: string;
  sort_order: number;
  created_at: string;
}

export interface UserLink {
  id: string;
  title: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ReferralInfo {
  referral_code: string;
  invites_used_this_week: number;
  invites_remaining: number;
}
