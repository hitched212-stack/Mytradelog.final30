import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Underline, Highlighter } from 'lucide-react';
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
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const fontPickerRef = useRef<HTMLDivElement>(null);
  const listDropdownRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [currentFontFamily, setCurrentFontFamily] = useState('sans-serif');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rteSelectedColor') || '#000000';
    }
    return '#000000';
  });
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState('#FFFF00');
  const [customHighlights, setCustomHighlights] = useState<string[]>([]);
  const [showListDropdown, setShowListDropdown] = useState(false);

  const defaultColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#EEEEEE', '#F3F3F3', '#FFFFFF', '#FFFFFF', '#FFFFFF',
    '#C41E3A', '#FF0000', '#FF6B35', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#0070C0', '#9932CC', '#FF1493',
    '#FFD9B3', '#FFE4D6', '#FFF0E0', '#FFFACD', '#E8F5E9', '#D4EAEF', '#E1F5FF', '#F3E5F5', '#FCE4EC', '#FFF0F5',
    '#FFCC99', '#FFD9B3', '#FFDDCC', '#FFFFE0', '#F0F8E8', '#E0F7FA', '#D6F4FF', '#E9D5FF', '#F8D9E8', '#FFE4F2',
    '#C85A54', '#D97766', '#E89B7B', '#D4A574', '#A8C686', '#7EB3D4', '#6B9FCC', '#9B7FC4', '#D4889B', '#E897B8',
    '#8B4513', '#A0522D', '#CD853F', '#B8860B', '#556B2F', '#2F4F4F', '#193D3D', '#305070', '#4B0082', '#800020'
  ];

  const handleAddCustomColor = () => {
    const colorInput = prompt('Enter a hex color code (e.g., #FF5733):');
    if (colorInput && /^#[0-9A-F]{6}$/i.test(colorInput)) {
      if (!customColors.includes(colorInput)) {
        setCustomColors([...customColors, colorInput]);
      }
    } else if (colorInput) {
      alert('Please enter a valid hex color code');
    }
  };

  const handleClearColor = () => {
    applyFormat('foreColor', '#000000');
    setSelectedColor('#000000');
  };

  const handleAddCustomHighlight = () => {
    const colorInput = prompt('Enter a hex color code (e.g., #FFFF00):');
    if (colorInput && /^#[0-9A-F]{6}$/i.test(colorInput)) {
      if (!customHighlights.includes(colorInput)) {
        setCustomHighlights([...customHighlights, colorInput]);
      }
    } else if (colorInput) {
      alert('Please enter a valid hex color code');
    }
  };

  const applyHighlight = (color: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    setTimeout(() => {
      try {
        document.execCommand('backColor', false, color);
        const html = editorRef.current?.innerHTML || '';
        onChange(html);
        updateFormatIndicators();
      } catch (e) {
        console.error('Highlight error:', e);
      }
    }, 0);
  };

  const clearHighlight = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    setTimeout(() => {
      try {
        document.execCommand('backColor', false, 'transparent');
        const html = editorRef.current?.innerHTML || '';
        onChange(html);
        updateFormatIndicators();
      } catch (e) {
        console.error('Clear highlight error:', e);
      }
    }, 0);
  };

  const fontStyles = [
    { name: 'Sans Serif', value: 'sans-serif' },
    { name: 'Serif', value: 'Georgia, serif' },
    { name: 'Monospace', value: '"Courier New", monospace' },
    { name: 'Comic', value: '"Comic Sans MS", cursive' },
    { name: 'Impact', value: 'Impact, fantasy' }
  ];

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(target)) {
        setShowHighlightPicker(false);
      }
      if (fontPickerRef.current && !fontPickerRef.current.contains(target)) {
        setShowFontPicker(false);
      }
      if (listDropdownRef.current && !listDropdownRef.current.contains(target)) {
        setShowListDropdown(false);
      }
    };

    if (showColorPicker || showHighlightPicker || showFontPicker || showListDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showHighlightPicker, showFontPicker, showListDropdown]);

  // Save selected color to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rteSelectedColor', selectedColor);
    }
  }, [selectedColor]);

  // Keep editor content in sync with value
  useEffect(() => {
    if (!editorRef.current) return;
    const nextValue = value || '';
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
  }, [value]);

  // Update format indicators
  const updateFormatIndicators = () => {
    try {
      setIsBold(!!(document.queryCommandState('bold')));
      setIsItalic(!!(document.queryCommandState('italic')));
      setIsUnderline(!!(document.queryCommandState('underline')));
      setIsBulletList(!!(document.queryCommandState('insertUnorderedList')));
      setIsNumberedList(!!(document.queryCommandState('insertOrderedList')));
    } catch (e) {
      // Silently fail if command state check fails
    }
  };

  const insertBulletList = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Get current selection
    const selection = window.getSelection();
    
    // If no selection, select all content
    if (!selection || selection.toString().length === 0) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    try {
      document.execCommand('insertUnorderedList', false);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        onChange(html);
      }
      updateFormatIndicators();
    } catch (err) {
      console.error('Bullet list error:', err);
    }
  };

  const insertOrderedList = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Get current selection
    const selection = window.getSelection();
    
    // If no selection, select all content
    if (!selection || selection.toString().length === 0) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    try {
      document.execCommand('insertOrderedList', false);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        onChange(html);
      }
      updateFormatIndicators();
    } catch (err) {
      console.error('Numbered list error:', err);
    }
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
        case 'u':
          e.preventDefault();
          applyFormat('underline');
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

  const handleBlur = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2 relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-t-lg border border-border border-b-0 flex-wrap z-10">
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

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('underline');
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isUnderline
              ? "bg-foreground/20 text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-background"
          )}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* List Dropdown */}
        <div className="relative z-40" ref={listDropdownRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowListDropdown(!showListDropdown);
              if (!showListDropdown) {
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowFontPicker(false);
              }
            }}
            className="p-1.5 rounded hover:bg-background transition-colors text-foreground/70 hover:text-foreground flex items-center gap-1"
            title="List Options"
          >
            {isBulletList ? (
              <List className="h-4 w-4" strokeWidth={2} />
            ) : isNumberedList ? (
              <ListOrdered className="h-4 w-4" strokeWidth={2} />
            ) : (
              <span className="text-sm">+</span>
            )}
            <span className="text-xs">▼</span>
          </button>

          {showListDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-lg shadow-2xl z-50 w-40">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertBulletList();
                    setShowListDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 whitespace-nowrap",
                    isBulletList
                      ? "bg-foreground/20 text-foreground font-semibold"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                  )}
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Bullet List</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertOrderedList();
                    setShowListDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 whitespace-nowrap",
                    isNumberedList
                      ? "bg-foreground/20 text-foreground font-semibold"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                  )}
                  title="Numbered List"
                >
                  <ListOrdered className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Numbered List</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Highlight Color Picker */}
        <div className="relative z-45" ref={highlightPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowHighlightPicker(!showHighlightPicker);
              if (!showHighlightPicker) {
                setShowColorPicker(false);
                setShowFontPicker(false);
              }
            }}
            className="p-1.5 rounded hover:bg-background transition-colors text-foreground/70 hover:text-foreground"
            title="Highlight Color"
          >
            <Highlighter className="h-4 w-4" strokeWidth={2} />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-lg shadow-2xl z-50 w-80 max-h-96 overflow-y-auto">
              {/* Custom Highlights Section */}
              {customHighlights.length > 0 && (
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground/80">Custom Highlights</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {customHighlights.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedHighlight(color);
                          applyHighlight(color);
                          setShowHighlightPicker(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-border hover:border-foreground transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddCustomHighlight();
                      }}
                      className="w-8 h-8 rounded-full border-2 border-border/50 hover:border-foreground transition-colors cursor-pointer flex items-center justify-center text-foreground/50 hover:text-foreground"
                      title="Add Custom Highlight"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Default Highlights Section */}
              <div className="p-4">
                <span className="text-xs font-semibold text-foreground/80 block mb-3">Default Highlights</span>
                <div className="grid grid-cols-10 gap-2">
                  {['#FFFF00', '#FFE135', '#FFC700', '#FFAA00', '#FF6600', '#FF0000', '#FF69B4', '#FF1493', '#00FF00', '#00FFFF', '#0000FF', '#9370DB', '#FFB6C1', '#FFDAB9', '#FFE4B5', '#FFFACD', '#E0FFFF', '#E6E6FA', '#F0FFF0', '#FFFAF0'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedHighlight(color);
                        applyHighlight(color);
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-border/30 hover:border-foreground transition-colors cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Add Highlight + Clear Button */}
              <div className="p-4 border-t border-border/50 space-y-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddCustomHighlight();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-foreground/70 hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>+ Add Highlight</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearHighlight();
                    setShowHighlightPicker(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-foreground/70 hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Remove Highlight</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Text Color Picker */}
        <div className="relative z-50" ref={colorPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
              if (!showColorPicker) {
                setShowHighlightPicker(false);
                setShowFontPicker(false);
              }
            }}
            className="p-1.5 rounded hover:bg-background transition-colors flex items-center gap-1"
            title="Text Color"
          >
            <span className="text-sm font-bold" style={{ color: selectedColor }}>A</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-lg shadow-2xl z-50 w-80 max-h-96 overflow-y-auto">
              {/* Custom Colors Section */}
              {customColors.length > 0 && (
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground/80">Custom Colors</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {customColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedColor(color);
                          applyFormat('foreColor', color);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-border hover:border-foreground transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddCustomColor();
                      }}
                      className="w-8 h-8 rounded-full border-2 border-border/50 hover:border-foreground transition-colors cursor-pointer flex items-center justify-center text-foreground/50 hover:text-foreground"
                      title="Add Custom Color"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Default Colors Section */}
              <div className="p-4">
                <span className="text-xs font-semibold text-foreground/80 block mb-3">Default Colors</span>
                <div className="grid grid-cols-10 gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedColor(color);
                        applyFormat('foreColor', color);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-border/30 hover:border-foreground transition-colors cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Add Custom Color + Clear Button */}
              <div className="p-4 border-t border-border/50 space-y-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddCustomColor();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-foreground/70 hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>+ Add Color</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleClearColor();
                    setShowColorPicker(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-foreground/70 hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Font Style Dropdown */}
        <div className="relative z-40" ref={fontPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowFontPicker(!showFontPicker);
              if (!showFontPicker) {
                setShowColorPicker(false);
                setShowHighlightPicker(false);
              }
            }}
            className="p-1.5 px-2.5 rounded text-xs bg-background border border-border transition-colors text-foreground/70 hover:text-foreground cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            title="Font Style"
          >
            <span style={{ fontFamily: currentFontFamily }}>Aa</span>
            <span className="text-foreground/50">▼</span>
          </button>

          {showFontPicker && (
            <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-lg shadow-2xl z-50 w-48">
              <div className="p-2">
                {fontStyles.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFormat('fontName', font.value);
                      setCurrentFontFamily(font.value);
                      setShowFontPicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors mb-1 whitespace-nowrap",
                      currentFontFamily === font.value
                        ? "bg-foreground/20 text-foreground font-semibold"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
        onBlur={handleBlur}
        className={cn(
          "rich-text-content",
          "w-full p-3 bg-muted/30 border border-border rounded-b-lg",
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
