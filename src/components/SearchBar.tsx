import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { combinedSearch } from '../services/api';
import type { CombinedSearchItem } from '../types';
import { getCategoryIcon } from '../utils/icons';

interface Props {
  large?: boolean;
  placeholder?: string;
}

export default function SearchBar({
  large = false,
  placeholder = 'Search for answers…',
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CombinedSearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await combinedSearch(val, 8).catch(() => []);
      setResults(res);
      setShowResults(res.length > 0);
    }, 250);
  };

  const pickResult = (item: CombinedSearchItem) => {
    setQuery('');
    setShowResults(false);
    if (item.type === 'category') {
      navigate(`/category/${item.slug}`);
    } else {
      navigate(`/articles/${item.slug}`);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${large ? 'max-w-2xl mx-auto' : ''}`}>
      <Search
        size={large ? 20 : 16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder={placeholder}
        className={`w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition
          ${large ? 'pl-12 pr-6 py-4 text-base' : 'pl-10 pr-4 py-2.5 text-sm'}`}
      />
      {showResults && (
        <ul className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((item) => {
            const IconComponent = item.type === 'category' ? getCategoryIcon(item.icon || 'Folder') : FileText;
            return (
              <li key={item._id}>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-3"
                  onClick={() => pickResult(item)}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.type === 'category' ? `${item.color}20` : '#f3f4f6' }}
                  >
                    <IconComponent
                      size={16}
                      style={{ color: item.type === 'category' ? item.color : '#6b7280' }}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    {item.type === 'category' && item.description && (
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    )}
                    {item.type === 'article' && item.category && (
                      <div className="text-xs text-gray-500">in {item.category.name}</div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.type === 'category' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.type === 'category' ? 'Category' : 'Article'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
