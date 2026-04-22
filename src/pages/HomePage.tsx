import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCategories, getPopularArticles } from '../services/api';
import type { Category, Article } from '../types';

const POPULAR_SEARCHES = [
  'create a quiz',
  'Shopify integration',
  'embed quiz',
  'Klaviyo sync',
  'recommendation logic',
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getPopularArticles(6)])
      .then(([cats, arts]) => {
        setCategories(cats);
        setPopular(arts);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading help center…" />;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            How can we help you?
          </h1>
          <p className="text-brand-200 mb-8 text-base">
            Find answers, guides, and step-by-step tutorials for QuizCommerce.
          </p>
          <SearchBar large placeholder="Search articles, guides, and tutorials…" />
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <span className="text-xs text-brand-300 mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((s) => (
              <Link
                key={s}
                to={`/search?q=${encodeURIComponent(s)}`}
                className="text-xs bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1 transition"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories grid */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Browse by Topic</h2>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat._id} category={cat} />
              ))}
            </div>
          )}
        </section>

        {/* Popular articles */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" />
                Popular Articles
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {popular.map((a) => (
                <ArticleCard key={a._id} article={a as any} showCategory />
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="mt-16 bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            Our support team is here to help. Reach out and we'll get back to you within one business day.
          </p>
          <a
            href="mailto:support@quizcommerce.io"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
          >
            Contact Support <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
