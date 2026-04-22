import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface Props {
  large?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  large = false,
  placeholder = 'Search for answers…',
  initialValue = '',
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative ${large ? 'max-w-2xl mx-auto' : ''}`}>
        <Search
          size={large ? 20 : 16}
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition
            ${large ? 'pl-12 pr-32 py-4 text-base' : 'pl-10 pr-24 py-2.5 text-sm'}`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition
            ${large ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'}`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
