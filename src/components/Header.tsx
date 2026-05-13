import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, Menu, X, LogOut, UserCircle, LayoutDashboard, FileText } from 'lucide-react';
import { combinedSearch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon } from '../utils/icons';
import type { CombinedSearchItem } from '../types';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CombinedSearchItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { isAdmin, user, logout } = useAuth();

  // Show search bar on scroll (only on homepage, always show on other pages)
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setShowSearch(true);
      return;
    }

    const handleScroll = () => {
      // Show search after scrolling past hero section (approx 250px)
      setShowSearch(window.scrollY > 250);
    };

    handleScroll(); // Check initial state
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
      const res = await combinedSearch(val, 6).catch(() => []);
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Help Center
            </span>
          </Link>

          {/* Search bar - shown on scroll or on non-home pages */}
          <div
            ref={wrapperRef}
            className={`flex-1 max-w-md relative transition-all duration-300 ${
              showSearch ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Search articles & categories…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
              />
            </div>
            {showResults && showSearch && (
              <ul className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {results.map((item) => {
                  const IconComponent = item.type === 'category' ? getCategoryIcon(item.icon || 'Folder') : FileText;
                  return (
                    <li key={item._id}>
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2"
                        onClick={() => pickResult(item)}
                      >
                        <span
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: item.type === 'category' ? `${item.color}20` : '#f3f4f6' }}
                        >
                          <IconComponent
                            size={12}
                            style={{ color: item.type === 'category' ? item.color : '#6b7280' }}
                          />
                        </span>
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
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

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin && (
              <div className="flex items-center gap-1 border-l border-gray-200 ml-1 pl-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 px-2 py-1.5">
                  <UserCircle size={14} className="text-brand-500" />
                  <span>{user?.name || user?.email}</span>
                </div>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 px-2.5 py-1.5 rounded-md hover:bg-brand-50 transition"
                  title="Admin panel"
                >
                  <LayoutDashboard size={14} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {isAdmin && (
            <>
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 hover:text-brand-600 py-2">Admin Panel</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block text-sm text-red-600 py-2 w-full text-left">Sign out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
