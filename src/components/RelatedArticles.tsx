import { Link } from 'react-router-dom';
import { Clock, BookOpen } from 'lucide-react';
import type { Article } from '../types';

interface Props {
  articles: Article[];
}

export default function RelatedArticles({ articles }: Props) {
  if (!articles.length) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen size={16} className="text-brand-500" />
        Related Articles
      </h2>
      <ul className="space-y-2">
        {articles.map((a) => (
          <li key={a._id}>
            <Link
              to={`/articles/${a.slug}`}
              className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-brand-50 group transition"
            >
              <span className="text-sm text-gray-800 group-hover:text-brand-700 transition-colors font-medium">
                {a.title}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-0.5">
                <Clock size={11} />
                {a.readTime} min
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
