import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Category } from '../types';
import { getCategoryIcon } from '../utils/icons';

interface Props {
  category: Category;
}

export default function CategoryCard({ category }: Props) {
  const Icon = getCategoryIcon(category.icon);
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-brand-300 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${category.color}18` }}
        >
          <Icon size={20} style={{ color: category.color }} />
        </div>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-brand-700 transition-colors">
        {category.name}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-3">
        {category.description}
      </p>
      <span className="text-xs text-gray-400 font-medium">
        {category.articleCount} {category.articleCount === 1 ? 'article' : 'articles'}
      </span>
    </Link>
  );
}
