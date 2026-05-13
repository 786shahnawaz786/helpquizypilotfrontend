import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Edit3, Eye, Save, X, BookOpen, FolderOpen, Clock, Loader2,
  KeyRound, CheckCircle, AlertCircle, Settings2, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  getArticles, getCategories, getArticleBySlug, createArticle, updateArticle,
  deleteArticle, createCategory, deleteCategory, changePassword,
} from '../services/api';
import type { ArticleListItem, Category, CreateArticlePayload, CreateCategoryPayload } from '../types';
import { getCategoryIcon } from '../utils/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageUploader from '../components/ImageUploader';
import MarkdownEditor from '../components/MarkdownEditor';
import DeleteModal from '../components/DeleteModal';
import { ToastContainer, useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

type Tab = 'articles' | 'categories' | 'settings';

const ICONS = ['BookOpen', 'Rocket', 'PenTool', 'ShoppingBag', 'Users', 'Plug', 'BarChart2', 'Globe', 'CreditCard'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#64748b'];

const emptyArticle: CreateArticlePayload = {
  title: '', excerpt: '', content: '', category: '', tags: [], status: 'published', readTime: 3,
};
const emptyCategory: CreateCategoryPayload = {
  name: '', description: '', icon: 'BookOpen', color: '#6366f1', order: 0,
};

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings / change-password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Article form
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleListItem | null>(null);
  const [articleForm, setArticleForm] = useState<CreateArticlePayload>(emptyArticle);
  // Separate raw string state so the user can freely type commas without losing cursor position
  const [tagsRaw, setTagsRaw] = useState('');
  const [articleSaving, setArticleSaving] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState<CreateCategoryPayload>(emptyCategory);
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');

  // Article list search / filter / pagination
  const [articleSearch, setArticleSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'article' | 'category';
    id: string;
    name: string;
    loading: boolean;
  }>({ open: false, type: 'article', id: '', name: '', loading: false });

  const loadData = async () => {
    setLoading(true);
    const [a, c] = await Promise.all([
      getArticles({ limit: 100, status: 'all' as any }).catch(() => ({ data: [], total: 0 })),
      getCategories().catch(() => []),
    ]);
    setArticles(a.data);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Articles ──────────────────────────────────────────────────────

  const openNewArticle = () => {
    setEditingArticle(null);
    setArticleForm({ ...emptyArticle, category: categories[0]?._id ?? '' });
    setTagsRaw('');
    setShowArticleForm(true);
  };

  const openEditArticle = async (a: ArticleListItem) => {
    setEditingArticle(a);
    // Reset form with list-level data first so UI opens instantly
    setArticleForm({
      title: a.title,
      excerpt: a.excerpt,
      content: '',
      category: a.category?._id ?? '',
      tags: a.tags ?? [],
      status: (a as any).status ?? 'published',
      readTime: a.readTime,
    });
    setTagsRaw((a.tags ?? []).join(', '));
    setShowArticleForm(true);

    // Then fetch full content in background
    setFormLoading(true);
    try {
      const full = await getArticleBySlug(a.slug);
      setArticleForm((prev) => ({
        ...prev,
        content: full.content ?? '',
        status: full.status ?? 'published',
        tags: full.tags ?? [],
      }));
      setTagsRaw((full.tags ?? []).join(', '));
    } finally {
      setFormLoading(false);
    }
  };

  // Parse tagsRaw → array when saving
  const parsedTags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const saveArticle = async () => {
    setArticleError('');
    // Client-side required field check
    if (!articleForm.title.trim()) { setArticleError('Title is required.'); return; }
    if (!articleForm.category) { setArticleError('Please select a category.'); return; }
    if (!articleForm.excerpt.trim()) { setArticleError('Excerpt is required.'); return; }
    if (!articleForm.content.trim()) { setArticleError('Content cannot be empty.'); return; }

    setArticleSaving(true);
    try {
      const payload = { ...articleForm, tags: parsedTags };
      if (editingArticle) {
        await updateArticle(editingArticle._id, payload);
        toast.success('Article updated successfully.');
      } else {
        await createArticle(payload);
        toast.success('Article created successfully.');
      }
      setShowArticleForm(false);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errMsg = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to save article. Please try again.');
      setArticleError(errMsg);
      toast.error(errMsg);
    } finally {
      setArticleSaving(false);
    }
  };

  const closeArticleForm = () => {
    setShowArticleForm(false);
    setEditingArticle(null);
    setArticleForm(emptyArticle);
    setTagsRaw('');
    setArticleError('');
  };

  const handleDeleteArticle = (id: string) => {
    const a = articles.find((x) => x._id === id);
    setDeleteModal({ open: true, type: 'article', id, name: a?.title ?? 'this article', loading: false });
  };

  // ── Categories ────────────────────────────────────────────────────

  const saveCategory = async () => {
    setCatError('');
    if (!catForm.name.trim()) { setCatError('Category name is required.'); return; }
    setCatSaving(true);
    try {
      await createCategory(catForm);
      toast.success('Category created successfully.');
      setShowCatForm(false);
      setCatForm(emptyCategory);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errMsg = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to save category.');
      setCatError(errMsg);
      toast.error(errMsg);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    const c = categories.find((x) => x._id === id);
    setDeleteModal({ open: true, type: 'category', id, name: c?.name ?? 'this category', loading: false });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      if (deleteModal.type === 'article') {
        await deleteArticle(deleteModal.id);
        toast.success('Article deleted successfully.');
      } else {
        await deleteCategory(deleteModal.id);
        toast.success('Category deleted successfully.');
      }
      await loadData();
      setDeleteModal((prev) => ({ ...prev, open: false, loading: false }));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Delete failed. Please try again.'));
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage articles and categories</p>
        </div>
        <Link to="/" className="text-sm text-brand-600 hover:text-brand-800 font-medium">
          ← View Help Center
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Articles', value: articles.length, icon: BookOpen },
          { label: 'Categories', value: categories.length, icon: FolderOpen },
          { label: 'Published', value: articles.filter((a: any) => (a.status ?? 'published') === 'published').length, icon: Eye },
          { label: 'Drafts', value: articles.filter((a: any) => a.status === 'draft').length, icon: Edit3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Icon size={14} />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['articles', 'categories', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition -mb-px ${
              tab === t
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'settings' && <Settings2 size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* ── Articles tab ──────────────────────────────────────────── */}
      {tab === 'articles' && (
        <div>
          {/* Toolbar: search + filters + new button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => { setArticleSearch(e.target.value); setPage(1); }}
                placeholder="Search articles…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={openNewArticle}
              className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition shrink-0"
            >
              <Plus size={15} /> New Article
            </button>
          </div>

          {/* Article form */}
          {showArticleForm && (
            <div className="bg-white border border-brand-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {editingArticle ? 'Edit Article' : 'New Article'}
                  {formLoading && <Loader2 size={14} className="animate-spin text-brand-500" />}
                </h3>
                <button onClick={closeArticleForm} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                    <input
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    >
                      <option value="">Select category…</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Excerpt *</label>
                  <textarea
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                    rows={2}
                    value={articleForm.excerpt}
                    onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                    placeholder="Short description shown in lists"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-1">
                    Content (Markdown) *
                    {formLoading && <span className="text-brand-500 font-normal">Loading…</span>}
                  </label>
                  <MarkdownEditor
                    value={articleForm.content}
                    onChange={(content) => setArticleForm({ ...articleForm, content })}
                    placeholder={'# Your article heading\n\nWrite in Markdown…'}
                    rows={12}
                    disabled={formLoading}
                    renderToolbarExtra={(insertAtCursor) => (
                      <ImageUploader onInsert={insertAtCursor} />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tags
                      <span className="font-normal text-gray-400 ml-1">(comma-separated)</span>
                    </label>
                    {/* Use tagsRaw so commas can be typed freely; parsed only at save time */}
                    <input
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={tagsRaw}
                      onChange={(e) => setTagsRaw(e.target.value)}
                      placeholder="quiz, getting-started, shopify"
                    />
                    {/* Live preview of parsed tags */}
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {parsedTags.map((tag) => (
                          <span key={tag} className="text-xs bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Read time (min)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={articleForm.readTime}
                      onChange={(e) => setArticleForm({ ...articleForm, readTime: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={articleForm.status}
                      onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value as any })}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                {articleError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {articleError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={closeArticleForm}
                    className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveArticle}
                    disabled={articleSaving || formLoading}
                    className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg transition"
                  >
                    {articleSaving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><Save size={14} /> {editingArticle ? 'Update Article' : 'Save Article'}</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Articles table */}
          {(() => {
            const q = articleSearch.toLowerCase();
            const filtered = articles.filter((a) => {
              const matchSearch = !q ||
                a.title.toLowerCase().includes(q) ||
                (a.tags ?? []).some((t) => t.toLowerCase().includes(q));
              const matchCat = !filterCategory || a.category?._id === filterCategory;
              const matchStatus = !filterStatus || ((a as any).status ?? 'published') === filterStatus;
              return matchSearch && matchCat && matchStatus;
            });
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            const safePage = Math.min(page, totalPages);
            const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

            return (
              <>
                <div className="text-xs text-gray-400 mb-2">
                  {filtered.length} of {articles.length} articles
                  {(articleSearch || filterCategory || filterStatus) && (
                    <button
                      onClick={() => { setArticleSearch(''); setFilterCategory(''); setFilterStatus(''); setPage(1); }}
                      className="ml-2 text-brand-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Views</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pageItems.map((a) => (
                        <tr key={a._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{a.title}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Clock size={10} /> {a.readTime} min
                              {a.tags?.length > 0 && (
                                <span className="ml-1 text-gray-300">· {a.tags.slice(0, 2).join(', ')}{a.tags.length > 2 ? '…' : ''}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-gray-600">{a.category?.name}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              (a as any).status === 'draft'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {(a as any).status ?? 'published'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                            {(a as any).views?.toLocaleString() ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/articles/${a.slug}`}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                                title="View article"
                                target="_blank"
                              >
                                <Eye size={14} />
                              </Link>
                              <button
                                onClick={() => openEditArticle(a)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                                title="Edit article"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(a._id)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Delete article"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pageItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                            {articles.length === 0 ? 'No articles yet. Create your first one above.' : 'No articles match your search.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-500">
                      Page {safePage} of {totalPages} · {filtered.length} results
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 text-xs rounded-md transition ${
                            p === safePage
                              ? 'bg-brand-600 text-white font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Categories tab ───────────────────────────────────────── */}
      {tab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">{categories.length} categories</p>
            <button
              onClick={() => setShowCatForm(true)}
              className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus size={15} /> New Category
            </button>
          </div>

          {/* Category form */}
          {showCatForm && (
            <div className="bg-white border border-brand-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">New Category</h3>
                <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="e.g. Troubleshooting"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                    <input
                      type="number"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={catForm.order}
                      onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                    rows={2}
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="What articles does this category cover?"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      value={catForm.icon}
                      onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                    >
                      {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCatForm({ ...catForm, color: c })}
                          className={`w-6 h-6 rounded-full border-2 transition ${catForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {catError && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {catError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => { setShowCatForm(false); setCatError(''); }}
                    className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCategory}
                    disabled={catSaving}
                    className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg transition"
                  >
                    {catSaving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><Save size={14} /> Save Category</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div key={cat._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}18` }}
                    >
                      <Icon size={17} style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.articleCount} article{cat.articleCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Settings tab ─────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="max-w-lg">
          {/* Account info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm select-none">
                {(user?.name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email ?? ''}</p>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <KeyRound size={15} className="text-brand-500" /> Change Password
            </h3>

            {pwdSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 mb-4">
                <CheckCircle size={15} className="shrink-0" />
                Password updated successfully.
              </div>
            )}
            {pwdError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {pwdError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-1">
                <button
                  disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                  onClick={async () => {
                    setPwdError('');
                    setPwdSuccess(false);
                    if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
                    if (newPwd !== confirmPwd) { setPwdError('New passwords do not match.'); return; }
                    setPwdSaving(true);
                    try {
                      await changePassword(currentPwd, newPwd);
                      setPwdSuccess(true);
                      toast.success('Password updated successfully.');
                      setCurrentPwd('');
                      setNewPwd('');
                      setConfirmPwd('');
                    } catch (err: any) {
                      const msg = err?.response?.data?.message;
                      const errMsg = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to update password.');
                      setPwdError(errMsg);
                      toast.error(errMsg);
                    } finally {
                      setPwdSaving(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg transition"
                >
                  {pwdSaving
                    ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                    : <><KeyRound size={14} /> Update Password</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />

      {/* Delete confirmation modal */}
      <DeleteModal
        open={deleteModal.open}
        title={`Delete ${deleteModal.type === 'article' ? 'Article' : 'Category'}`}
        description={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
        loading={deleteModal.loading}
      />
    </div>
  );
}
