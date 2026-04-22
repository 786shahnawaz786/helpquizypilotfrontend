import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, Eye, Calendar, Tag, ChevronLeft } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import FeedbackWidget from '../components/FeedbackWidget';
import RelatedArticles from '../components/RelatedArticles';
import LoadingSpinner from '../components/LoadingSpinner';
import { getArticleBySlug } from '../services/api';
import type { Article } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setError('Article not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-sm mb-4">{error || 'Article not found.'}</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Back to Help Center</Link>
      </div>
    );
  }

  const category = article.category;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Breadcrumb
            crumbs={[
              { label: category?.name ?? 'Articles', href: category ? `/category/${category.slug}` : '/' },
              { label: article.title },
            ]}
          />

          {/* Back link */}
          {category && (
            <Link
              to={`/category/${category.slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 mt-4 mb-6 transition"
            >
              <ChevronLeft size={13} /> Back to {category.name}
            </Link>
          )}

          {/* Article header */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-6 pb-6 border-b border-gray-200">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {article.readTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Updated {formatDate(article.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {article.views.toLocaleString()} views
            </span>
          </div>

          {/* Markdown content */}
          <div className="prose-help">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Render images as actual <img> tags with optional size from title
                // Supported title formats: "800x400", "800", "x400"
                img({ src, alt, title }) {
                  let width: string | undefined;
                  let height: string | undefined;
                  if (title) {
                    const m = title.match(/^(\d+)?x(\d+)?$/);
                    if (m) {
                      if (m[1]) width = `${m[1]}px`;
                      if (m[2]) height = `${m[2]}px`;
                    } else if (/^\d+$/.test(title)) {
                      width = `${title}px`;
                    }
                  }
                  return (
                    <img
                      src={src}
                      alt={alt ?? ''}
                      loading="lazy"
                      style={{
                        width: width ?? '100%',
                        height: height ?? 'auto',
                        maxWidth: '100%',
                      }}
                      className="rounded-lg border border-gray-100 my-4 block"
                    />
                  );
                },
                // Open links in new tab
                a({ href, children }) {
                  const isExternal = href?.startsWith('http');
                  return (
                    <a
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Tag size={13} className="text-gray-400" />
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-xs bg-gray-100 hover:bg-brand-100 text-gray-600 hover:text-brand-700 rounded-full px-2.5 py-1 transition"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Last updated note */}
          {article.lastUpdatedNote && (
            <div className="mt-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <strong>Update note:</strong> {article.lastUpdatedNote}
            </div>
          )}

          {/* Feedback */}
          <div className="mt-10">
            <FeedbackWidget articleId={article._id} />
          </div>

          {/* Related articles */}
          {article.relatedArticles?.length > 0 && (
            <RelatedArticles articles={article.relatedArticles} />
          )}
        </main>

        {/* Sidebar: on-page navigation */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            {category && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  In this section
                </p>
                <Link
                  to={`/category/${category.slug}`}
                  className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                >
                  {category.name}
                </Link>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Article info
              </p>
              <ul className="text-xs text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <Clock size={11} /> {article.readTime} min read
                </li>
                <li className="flex items-center gap-2">
                  <Eye size={11} /> {article.views.toLocaleString()} views
                </li>
                <li className="flex items-center gap-2">
                  <Calendar size={11} /> {formatDate(article.updatedAt)}
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
