import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Menu, X, LogOut, UserCircle, LayoutDashboard } from 'lucide-react';
import { getSuggestions } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { isAdmin, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const s = await getSuggestions(val).catch(() => []);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    }, 250);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const pickSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(s)}`);
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

          {/* Search bar */}
          <div ref={wrapperRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search articles…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
                />
              </div>
            </form>
            {showSuggestions && (
              <ul className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2"
                      onClick={() => pickSuggestion(s)}
                    >
                      <Search size={13} className="text-gray-400 shrink-0" />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="text-sm text-gray-600 hover:text-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-50 transition">
              Home
            </Link>
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
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 hover:text-brand-600 py-2">Home</Link>
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
