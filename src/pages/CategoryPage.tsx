import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCategoryBySlug, getArticlesByCategory } from '../services/api';
import { getCategoryIcon } from '../utils/icons';
import type { Category, Article } from '../types';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getCategoryBySlug(slug)
      .then((cat) => {
        setCategory(cat);
        return getArticlesByCategory(cat._id);
      })
      .then(setArticles)
      .catch(() => setError('Category not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error || !category) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-sm mb-4">{error || 'Category not found.'}</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Back to Help Center</Link>
      </div>
    );
  }

  const Icon = getCategoryIcon(category.icon);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumb crumbs={[{ label: category.name }]} />

      {/* Category header */}
      <div className="mt-6 mb-8 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${category.color}18` }}
        >
          <Icon size={24} style={{ color: category.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-1 text-sm">{category.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </div>

      {/* Articles list */}
      {articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500">No articles in this category yet.</p>
          <Link to="/" className="text-brand-600 hover:underline text-sm mt-3 inline-block">← Back to Help Center</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <li key={article._id}>
              <Link
                to={`/articles/${article.slug}`}
                className="group flex items-start justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {article.excerpt}
                  </p>
                  {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-1">
                  <Clock size={11} />
                  {article.readTime} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
