import axios from 'axios';

import type {
  Article,
  ArticlesResponse,
  Category,
  SearchResponse,
  FeedbackStats,
  CreateArticlePayload,
  CreateCategoryPayload,
} from '../types';

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT token to every request made through `http`
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('hs_admin_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Categories ────────────────────────────────────────────────────

export const getCategories = (): Promise<Category[]> =>
  http.get<Category[]>('/categories').then((r) => r.data);

export const getCategoryBySlug = (slug: string): Promise<Category> =>
  http.get<Category>(`/categories/${slug}`).then((r) => r.data);

export const createCategory = (payload: CreateCategoryPayload): Promise<Category> =>
  http.post<Category>('/categories', payload).then((r) => r.data);

export const updateCategory = (id: string, payload: Partial<CreateCategoryPayload>): Promise<Category> =>
  http.put<Category>(`/categories/${id}`, payload).then((r) => r.data);

export const deleteCategory = (id: string): Promise<void> =>
  http.delete(`/categories/${id}`).then(() => undefined);

// ─── Articles ─────────────────────────────────────────────────────

export const getArticles = (params?: {
  category?: string;
  tag?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ArticlesResponse> =>
  http.get<ArticlesResponse>('/articles', { params }).then((r) => r.data);

export const getArticleBySlug = (slug: string): Promise<Article> =>
  http.get<Article>(`/articles/${slug}`).then((r) => r.data);

export const getArticlesByCategory = (categoryId: string): Promise<Article[]> =>
  http.get<Article[]>(`/articles/by-category/${categoryId}`).then((r) => r.data);

export const getPopularArticles = (limit = 5): Promise<Article[]> =>
  http.get<Article[]>('/articles/popular', { params: { limit } }).then((r) => r.data);

export const createArticle = (payload: CreateArticlePayload): Promise<Article> =>
  http.post<Article>('/articles', payload).then((r) => r.data);

export const updateArticle = (id: string, payload: Partial<CreateArticlePayload>): Promise<Article> =>
  http.put<Article>(`/articles/${id}`, payload).then((r) => r.data);

export const deleteArticle = (id: string): Promise<void> =>
  http.delete(`/articles/${id}`).then(() => undefined);

// ─── Search ───────────────────────────────────────────────────────

export const searchArticles = (q: string, limit = 10): Promise<SearchResponse> =>
  http.get<SearchResponse>('/search', { params: { q, limit } }).then((r) => r.data);

export const getSuggestions = (q: string): Promise<string[]> =>
  http.get<string[]>('/search/suggest', { params: { q } }).then((r) => r.data);

// ─── Auth ─────────────────────────────────────────────────────────

export const changePassword = (currentPassword: string, newPassword: string) =>
  http.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);

// ─── Uploads ──────────────────────────────────────────────────────

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  markdown: string;
  uploadedAt?: string;
}

export const uploadImage = (file: File): Promise<UploadedFile> => {
  const form = new FormData();
  form.append('file', file);
  return http.post<UploadedFile>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const listUploads = (): Promise<UploadedFile[]> =>
  http.get<UploadedFile[]>('/uploads').then((r) => r.data);

export const deleteUpload = (filename: string): Promise<void> =>
  http.delete(`/uploads/${filename}`).then(() => undefined);

// ─── Feedback ─────────────────────────────────────────────────────

export const submitFeedback = (
  articleId: string,
  helpful: boolean,
  comment = '',
  email = '',
) =>
  http
    .post('/feedback', { articleId, helpful, comment, email })
    .then((r) => r.data);

export const getFeedbackStats = (articleId: string): Promise<FeedbackStats> =>
  http.get<FeedbackStats>(`/feedback/article/${articleId}/stats`).then((r) => r.data);
