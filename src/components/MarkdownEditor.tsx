import { useRef, useCallback, useState, useImperativeHandle, forwardRef, ReactNode, ElementType } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Minus,
  Eye,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

export interface MarkdownEditorRef {
  insertAtCursor: (markdown: string) => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Render extra toolbar elements (e.g., ImageUploader). Receives insertAtCursor function. */
  renderToolbarExtra?: (insertAtCursor: (markdown: string) => void) => ReactNode;
}

interface ToolbarButton {
  icon: ElementType;
  label: string;
  action: 'wrap' | 'prefix' | 'insert';
  before?: string;
  after?: string;
  prefix?: string;
  insert?: string;
}

const toolbarButtons: ToolbarButton[] = [
  { icon: Bold, label: 'Bold', action: 'wrap', before: '**', after: '**' },
  { icon: Italic, label: 'Italic', action: 'wrap', before: '_', after: '_' },
  { icon: Heading1, label: 'Heading 1', action: 'prefix', prefix: '# ' },
  { icon: Heading2, label: 'Heading 2', action: 'prefix', prefix: '## ' },
  { icon: Heading3, label: 'Heading 3', action: 'prefix', prefix: '### ' },
  { icon: List, label: 'Bullet List', action: 'prefix', prefix: '- ' },
  { icon: ListOrdered, label: 'Numbered List', action: 'prefix', prefix: '1. ' },
  { icon: Quote, label: 'Blockquote', action: 'prefix', prefix: '> ' },
  { icon: Code, label: 'Inline Code', action: 'wrap', before: '`', after: '`' },
  { icon: Link, label: 'Link', action: 'insert', insert: '[link text](https://url.com)' },
  { icon: Minus, label: 'Horizontal Rule', action: 'insert', insert: '\n---\n' },
];

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(function MarkdownEditor({
  value,
  onChange,
  placeholder = '# Your article heading\n\nWrite in Markdown…',
  rows = 12,
  disabled = false,
  renderToolbarExtra,
}, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleToolbarAction = useCallback(
    (button: ToolbarButton) => {
      const el = textareaRef.current;
      if (!el) return;

      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selectedText = value.slice(start, end);
      const beforeText = value.slice(0, start);
      const afterText = value.slice(end);

      let newContent = value;
      let newCursorPos = start;

      if (button.action === 'wrap') {
        // Wrap selected text or insert placeholder
        const textToWrap = selectedText || 'text';
        newContent = beforeText + button.before + textToWrap + button.after + afterText;
        if (selectedText) {
          // Keep selection around wrapped text
          newCursorPos = start + (button.before?.length ?? 0) + textToWrap.length + (button.after?.length ?? 0);
        } else {
          // Place cursor inside to allow typing
          newCursorPos = start + (button.before?.length ?? 0);
        }
      } else if (button.action === 'prefix') {
        // Add prefix at the beginning of the current line
        const lineStart = beforeText.lastIndexOf('\n') + 1;
        
        // Check if line already has this prefix
        const currentLineStart = beforeText.slice(lineStart);
        if (currentLineStart.startsWith(button.prefix ?? '')) {
          // Remove prefix if already present (toggle)
          const prefixLength = button.prefix?.length ?? 0;
          newContent = value.slice(0, lineStart) + value.slice(lineStart + prefixLength);
          newCursorPos = start - prefixLength;
        } else {
          // Add prefix
          newContent = value.slice(0, lineStart) + button.prefix + value.slice(lineStart);
          newCursorPos = start + (button.prefix?.length ?? 0);
        }
      } else if (button.action === 'insert') {
        // Insert text at cursor
        newContent = beforeText + button.insert + afterText;
        newCursorPos = start + (button.insert?.length ?? 0);
      }

      onChange(newContent);

      // Restore focus and cursor position
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [value, onChange]
  );

  // Expose ref for external image insertion
  const insertAtCursor = useCallback(
    (markdown: string) => {
      const el = textareaRef.current;
      if (!el) {
        onChange(value + '\n' + markdown + '\n');
        return;
      }
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
      const newContent = before + prefix + markdown + suffix + after;
      onChange(newContent);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + prefix.length + markdown.length + suffix.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [value, onChange]
  );

  // Expose insertAtCursor via ref
  useImperativeHandle(ref, () => ({
    insertAtCursor,
  }), [insertAtCursor]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {toolbarButtons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.label}
              type="button"
              onClick={() => handleToolbarAction(button)}
              disabled={disabled}
              title={button.label}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon size={16} />
            </button>
          );
        })}
        
        {/* Extra toolbar items (e.g., ImageUploader) */}
        {renderToolbarExtra && (
          <>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            {renderToolbarExtra(insertAtCursor)}
          </>
        )}
        
        {/* Separator */}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        
        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? 'Edit' : 'Preview'}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
            showPreview
              ? 'bg-brand-100 text-brand-700'
              : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          )}
        >
          <Eye size={14} />
          {showPreview ? 'Editing' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="p-4 min-h-[200px] max-h-[500px] overflow-y-auto bg-white">
          <article className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || '*No content yet*'}</ReactMarkdown>
          </article>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full text-sm px-3 py-2 focus:outline-none resize-y font-mono border-0"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      {/* Help text */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Supports Markdown: **bold**, _italic_, # headings, - lists, [links](url), `code`
        </p>
      </div>
    </div>
  );
});

export default MarkdownEditor;
