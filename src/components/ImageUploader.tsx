import { useRef, useState, useEffect } from 'react';
import { Image, Upload, X, Trash2, Copy, Check, Loader2, Library, Link as LinkIcon } from 'lucide-react';
import { uploadImage, listUploads, deleteUpload, type UploadedFile } from '../services/api';

interface Props {
  onInsert: (markdown: string) => void;
}

type Tab = 'upload' | 'url' | 'library';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUploader({ onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('upload');

  // Upload tab
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // URL tab
  const [externalUrl, setExternalUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [imgWidth, setImgWidth] = useState('');
  const [imgHeight, setImgHeight] = useState('');
  const [urlError, setUrlError] = useState('');

  // Library tab
  const [library, setLibrary] = useState<UploadedFile[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [copiedFile, setCopiedFile] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const loadLibrary = async () => {
    setLibLoading(true);
    try { setLibrary(await listUploads()); } finally { setLibLoading(false); }
  };

  const handleOpen = () => {
    setOpen(true);
    setUploadError('');
    setUrlError('');
    setImgWidth('');
    setImgHeight('');
    if (tab === 'library') loadLibrary();
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === 'library') loadLibrary();
  };

  // ── Upload ────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPEG, PNG, GIF, WebP, and SVG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadImage(file);
      onInsert(result.markdown);
      setOpen(false);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── External URL ──────────────────────────────────────────────────
  const handleInsertUrl = () => {
    const url = externalUrl.trim();
    if (!url) { setUrlError('Please enter an image URL.'); return; }
    try { new URL(url); } catch {
      setUrlError('Please enter a valid URL (must start with https://).');
      return;
    }
    const alt = altText.trim() || 'image';
    const w = imgWidth.trim();
    const h = imgHeight.trim();
    // Encode dimensions into the title param so the renderer can apply them
    // Format: "WxH", "Wx", "xH" — omitted when both are blank
    let sizePart = '';
    if (w || h) sizePart = ` "${w}x${h}"`;
    onInsert(`![${alt}](${url}${sizePart})`);
    setExternalUrl('');
    setAltText('');
    setImgWidth('');
    setImgHeight('');
    setUrlError('');
    setOpen(false);
  };

  // ── Library ───────────────────────────────────────────────────────
  const handleInsertFromLibrary = (file: UploadedFile) => {
    onInsert(file.markdown);
    setOpen(false);
  };

  const handleCopyMarkdown = (file: UploadedFile) => {
    navigator.clipboard.writeText(file.markdown);
    setCopiedFile(file.filename);
    setTimeout(() => setCopiedFile(''), 2000);
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`Delete "${file.filename}"? This cannot be undone.`)) return;
    await deleteUpload(file.filename).catch(() => null);
    setLibrary((prev) => prev.filter((f) => f.filename !== file.filename));
  };

  const TABS: { key: Tab; label: string; icon: typeof Upload }[] = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'url', label: 'External URL', icon: LinkIcon },
    { key: 'library', label: `Library${library.length ? ` (${library.length})` : ''}`, icon: Library },
  ];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleOpen}
        title="Insert image or screenshot"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition"
      >
        <Image size={13} />
        Insert Image
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Image size={16} className="text-brand-500" />
                Insert Image
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition border-b-2 -mb-px ${
                    tab === key
                      ? 'border-brand-500 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* ── Upload tab ── */}
              {tab === 'upload' && (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                      dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-brand-600">
                        <Loader2 size={28} className="animate-spin" />
                        <p className="text-sm font-medium">Uploading…</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          Drop a screenshot here, or <span className="text-brand-600">click to browse</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP, SVG — max 5 MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                  {uploadError && (
                    <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
                  )}
                  <p className="mt-3 text-xs text-gray-400 text-center">
                    The image will be inserted as Markdown at your cursor position.
                  </p>
                </div>
              )}

              {/* ── External URL tab ── */}
              {tab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Image URL <span className="text-gray-400 font-normal">(must be a direct image link)</span>
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => { setExternalUrl(e.target.value); setUrlError(''); }}
                      placeholder="https://example.com/screenshot.png"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleInsertUrl()}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Alt text <span className="text-gray-400 font-normal">(optional description)</span>
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="e.g. Dashboard screenshot"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleInsertUrl()}
                    />
                  </div>

                  {/* Size (optional) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Size <span className="text-gray-400 font-normal">(optional — leave blank for full width)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={imgWidth}
                        onChange={(e) => setImgWidth(e.target.value)}
                        placeholder="Width px"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                      <span className="text-gray-400 text-sm shrink-0">×</span>
                      <input
                        type="number"
                        min={1}
                        value={imgHeight}
                        onChange={(e) => setImgHeight(e.target.value)}
                        placeholder="Height px"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      e.g. Width&nbsp;800 — image scales down on small screens automatically
                    </p>
                  </div>

                  {/* Live preview */}
                  {externalUrl && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 mb-2">Preview</p>
                      <img
                        src={externalUrl}
                        alt={altText || 'preview'}
                        style={{
                          width: imgWidth ? `${imgWidth}px` : '100%',
                          height: imgHeight ? `${imgHeight}px` : 'auto',
                          maxWidth: '100%',
                          maxHeight: '160px',
                          objectFit: 'contain',
                        }}
                        className="rounded border border-gray-200 mx-auto block"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        onLoad={(e) => (e.currentTarget.style.display = 'block')}
                      />
                      <p className="text-xs font-mono text-gray-500 mt-2 break-all">
                        {`![${altText || 'image'}](${externalUrl}${(imgWidth || imgHeight) ? ` "${imgWidth}x${imgHeight}"` : ''})`}
                      </p>
                    </div>
                  )}

                  {urlError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{urlError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setOpen(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertUrl}
                      disabled={!externalUrl.trim()}
                      className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition"
                    >
                      <LinkIcon size={13} /> Insert
                    </button>
                  </div>
                </div>
              )}

              {/* ── Library tab ── */}
              {tab === 'library' && (
                <div>
                  {libLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
                    </div>
                  ) : library.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Image size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No images uploaded yet.</p>
                      <button className="mt-3 text-xs text-brand-600 hover:underline" onClick={() => handleTabChange('upload')}>
                        Upload your first image →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                      {library.map((file) => (
                        <div
                          key={file.filename}
                          className="group relative rounded-lg border border-gray-200 overflow-hidden hover:border-brand-300 transition cursor-pointer bg-gray-50"
                          onClick={() => handleInsertFromLibrary(file)}
                          title={`Click to insert · ${formatBytes(file.size)}`}
                        >
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-20 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f1f5f9"/><text x="40" y="44" text-anchor="middle" fill="%2394a3b8" font-size="10">IMG</text></svg>';
                            }}
                          />
                          <div className="absolute inset-0 bg-brand-600/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Insert</span>
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopyMarkdown(file); }}
                              className="w-5 h-5 bg-white/90 rounded flex items-center justify-center hover:bg-white"
                              title="Copy markdown"
                            >
                              {copiedFile === file.filename ? <Check size={10} className="text-green-600" /> : <Copy size={10} className="text-gray-600" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                              className="w-5 h-5 bg-white/90 rounded flex items-center justify-center hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={10} className="text-red-500" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 truncate px-1.5 py-1 bg-white border-t border-gray-100">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
