import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Clock, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { searchArticles } from '../services/api';
import { getCategoryIcon } from '../utils/icons';
import type { SearchResult } from '../types';

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : part,
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    searchArticles(query, 20)
      .then((r) => {
        setResults(r.results);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Query label */}
      {query && (
        <p className="text-sm text-gray-500 mb-6">
          {loading ? 'Searching…' : (
            <>
              {total > 0
                ? <><strong className="text-gray-900">{total}</strong> result{total !== 1 ? 's' : ''} for </>
                : 'No results for '}
              <strong className="text-gray-900">"{query}"</strong>
            </>
          )}
        </p>
      )}

      {loading && <LoadingSpinner text="Searching…" />}

      {!loading && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => {
            const Icon = getCategoryIcon(r.category?.icon ?? 'BookOpen');
            return (
              <li key={r._id}>
                <Link
                  to={`/articles/${r.slug}`}
                  className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${r.category?.color ?? '#6366f1'}18` }}
                  >
                    <Icon size={17} style={{ color: r.category?.color ?? '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                      {highlightMatch(r.title, query)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {highlightMatch(r.excerpt, query)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{r.category?.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {r.readTime} min
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-400 transition-colors shrink-0 mt-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={22} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500 mb-6">
            We couldn't find any articles matching "{query}". Try different keywords.
          </p>
          <Link to="/" className="text-brand-600 hover:text-brand-800 text-sm font-medium">
            ← Browse all topics
          </Link>
        </div>
      )}

      {!query && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">Enter a search query above to find articles.</p>
          <Link to="/" className="text-brand-600 hover:underline text-sm mt-3 inline-block">
            Browse all topics →
          </Link>
        </div>
      )}
    </div>
  );
}
