import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start note...',
  rows = 4,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || '';
      setInitialized(true);
    }
  }, [initialized, value]);

  // Update format indicators
  const updateFormatIndicators = () => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsBulletList(document.queryCommandState('insertUnorderedList'));
      setIsNumberedList(document.queryCommandState('insertOrderedList'));
    } catch (e) {
      // Silently fail if command state check fails
    }
  };

  const insertBulletList = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    setTimeout(() => {
      try {
        // Get current selection
        const selection = window.getSelection();
        
        // If no selection, place cursor at the end
        if (!selection || selection.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        
        // Execute the list command
        document.execCommand('insertUnorderedList', false);
        
        // Update content
        const html = editorRef.current.innerHTML;
        onChange(html);
        
        // Restore focus and update indicators
        editorRef.current.focus();
        setTimeout(() => updateFormatIndicators(), 0);
      } catch (err) {
        console.error('Bullet list error:', err);
      }
    }, 10);
  };

  const insertOrderedList = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    setTimeout(() => {
      try {
        // Get current selection
        const selection = window.getSelection();
        
        // If no selection, place cursor at the end
        if (!selection || selection.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        
        // Execute the list command
        document.execCommand('insertOrderedList', false);
        
        // Update content
        const html = editorRef.current.innerHTML;
        onChange(html);
        
        // Restore focus and update indicators
        editorRef.current.focus();
        setTimeout(() => updateFormatIndicators(), 0);
      } catch (err) {
        console.error('Numbered list error:', err);
      }
    }, 10);
  };

  const applyFormat = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;
    
    // Ensure editor is focused
    editorRef.current.focus();
    
    // Give the browser a moment to set focus
    setTimeout(() => {
      try {
        document.execCommand(command, false, commandValue);
        
        // Trigger change after formatting
        const html = editorRef.current?.innerHTML || '';
        onChange(html);
        // Update indicators after formatting
        updateFormatIndicators();
      } catch (e) {
        console.error('Format error:', e);
      }
    }, 0);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateFormatIndicators();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            applyFormat('undo');
          }
          break;
        default:
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
      handleInput();
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      updateFormatIndicators();
    }, 0);
  };

  const handleKeyUp = () => {
    updateFormatIndicators();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-t-lg border border-border border-b-0">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('bold');
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isBold
              ? "bg-foreground/20 text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-background"
          )}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('italic');
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isItalic
              ? "bg-foreground/20 text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-background"
          )}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            insertBulletList();
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isBulletList
              ? "bg-foreground/20 text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-background"
          )}
          title="Bullet List (toggle)"
        >
          <List className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            insertOrderedList();
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isNumberedList
              ? "bg-foreground/20 text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-background"
          )}
          title="Numbered List (toggle)"
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('undo');
          }}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            "text-foreground/70 hover:text-foreground"
          )}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('redo');
          }}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            "text-foreground/70 hover:text-foreground"
          )}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        onPaste={handlePaste}
        className={cn(
          "w-full p-3 bg-background border border-border rounded-b-lg",
          "text-foreground text-sm outline-none",
          "focus:border-ring",
          "overflow-auto whitespace-pre-wrap break-words",
          className,
          rows === 4 ? "min-h-24" : "",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        )}
        data-placeholder={placeholder}
        style={{ WebkitUserSelect: 'text' } as React.CSSProperties}
      />
    </div>
  );
}
