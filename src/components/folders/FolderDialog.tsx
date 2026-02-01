import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/hooks/usePreferences';
import { Bookmark, X, Folder, Lightbulb, Plus } from 'lucide-react';
import type { Folder as FolderType } from '@/hooks/useFolders';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#f43f5e', // rose
];

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: FolderType | null;
  onSave: (name: string, description: string, color: string) => void;
  isLoading?: boolean;
  type?: 'backtest' | 'playbook';
}

export function FolderDialog({ open, onOpenChange, folder, onSave, isLoading, type = 'backtest' }: FolderDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[6]); // Default green
  const [customColor, setCustomColor] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { preferences, addFolderColorPreset, removeFolderColorPreset } = usePreferences();
  
  // Get saved folder color presets from preferences
  const savedPresets: string[] = preferences.folderColorPresets || [];

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      const folderColor = folder.color || PRESET_COLORS[6];
      setColor(folderColor);
      setCustomColor(folderColor);
    } else {
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[6]);
      setCustomColor(PRESET_COLORS[6]);
    }
    setShowCustomPicker(false);
  }, [folder, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), color);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setCustomColor(newColor);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setColor(newColor);
  };

  const handleSavePreset = () => {
    if (!color || savedPresets.includes(color) || PRESET_COLORS.includes(color)) return;
    addFolderColorPreset(color);
  };

  const handleRemovePreset = (presetColor: string) => {
    removeFolderColorPreset(presetColor);
  };

  const isCustomColor = !PRESET_COLORS.includes(color) && !savedPresets.includes(color);

  const tipText = type === 'playbook' 
    ? 'Folders help you organize your trading setups and strategies in one place.'
    : 'Folders help you organize your backtests and research in one place.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden" fullScreenOnMobile hideCloseButton>
        <div className="flex flex-col h-full sm:block sm:h-auto">
          {/* Header */}
          <div className="flex-shrink-0 p-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-foreground">
                {folder ? 'Edit Folder' : 'Create Folder'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {folder ? 'Update your folder details.' : `Create a new folder to organize your ${type === 'playbook' ? 'setups' : 'backtests'}.`}
              </p>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">
            {/* Folder Name Input with Icon */}
            <div className="relative">
              <div 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                style={{ color: color }}
              >
                <Folder className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <Input
                placeholder="Folder name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 pl-12 pr-4 rounded-xl bg-muted/40 border-border/50 text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
                autoFocus
              />
            </div>
            
            {/* Color Selection as chips */}
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all duration-200",
                    "hover:scale-110 focus:outline-none",
                    color === c && "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              {/* Saved Presets inline */}
              {savedPresets.map((c) => (
                <div key={c} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-200",
                      "hover:scale-110 focus:outline-none",
                      color === c && "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePreset(c);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {/* Add Custom Color Button */}
              <button
                type="button"
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={cn(
                  "w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center",
                  "bg-muted/60 hover:bg-muted hover:scale-110",
                  showCustomPicker && "bg-foreground/10 ring-2 ring-foreground/20"
                )}
                title="Add custom color"
              >
                <Plus className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              </button>
            </div>
            
            {/* Custom Color Picker - toggled via + button */}
            {showCustomPicker && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in-0 duration-200">
                <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer border-0 p-0 bg-transparent"
                  />
                </div>
                <Input
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1 h-10 text-sm font-mono min-w-0"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 flex-shrink-0"
                  onClick={handleSavePreset}
                  disabled={!isCustomColor}
                  title="Save to presets"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Tip Box */}
            <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
              <Lightbulb className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tipText}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 p-5 pt-3 flex gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-border/30">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl flex-1 h-12"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || isLoading}
              className="rounded-xl flex-1 h-12"
            >
              {folder ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}