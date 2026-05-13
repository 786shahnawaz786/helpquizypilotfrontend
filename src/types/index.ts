export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  articleCount: number;
  parentCategory: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: Category;
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles: Article[];
  readTime: number;
  isActive: boolean;
  lastUpdatedNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: Pick<Category, '_id' | 'name' | 'slug' | 'icon' | 'color'>;
  tags: string[];
  readTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesResponse {
  data: ArticleListItem[];
  total: number;
}

export interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  readTime: number;
  category: Pick<Category, 'name' | 'slug' | 'icon' | 'color'>;
  tags: string[];
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface CombinedSearchItem {
  _id: string;
  type: 'article' | 'category';
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: { name: string; slug: string };
}

export interface FeedbackStats {
  helpful: number;
  notHelpful: number;
  total: number;
}

export interface FeedbackOverallStats {
  total: number;
  unread: number;
  helpful: number;
  notHelpful: number;
}

export type FeedbackStatus = 'unread' | 'read' | 'resolved';

export interface Feedback {
  _id: string;
  articleId: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  helpful: boolean;
  comment: string;
  email: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponse {
  data: Feedback[];
  total: number;
}

export interface CreateArticlePayload {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  readTime: number;
}

export interface CreateCategoryPayload {
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}
