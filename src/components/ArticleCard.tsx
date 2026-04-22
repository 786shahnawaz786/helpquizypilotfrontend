import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import type { ArticleListItem } from '../types';
import { getCategoryIcon } from '../utils/icons';

interface Props {
  article: ArticleListItem;
  showCategory?: boolean;
}

export default function ArticleCard({ article, showCategory = true }: Props) {
  const Icon = getCategoryIcon(article.category?.icon ?? 'BookOpen');

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm hover:border-brand-300 transition-all"
    >
      {showCategory && (
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${article.category?.color ?? '#6366f1'}18` }}
        >
          <Icon size={15} style={{ color: article.category?.color ?? '#6366f1' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
          {article.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            {article.readTime} min read
          </span>
          {showCategory && article.category && (
            <span className="text-xs text-gray-400">{article.category.name}</span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-400 transition-colors shrink-0 mt-1" />
    </Link>
  );
}
