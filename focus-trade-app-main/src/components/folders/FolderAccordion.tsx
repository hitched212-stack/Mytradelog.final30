import { ChevronUp, GripVertical, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Folder } from '@/hooks/useFolders';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Thin stroke folder icon matching navigation style
const FolderIcon = ({
  className,
  color = '#8b5cf6'
}: {
  className?: string;
  color?: string;
}) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>;
interface FolderAccordionProps {
  folder: Folder;
  itemCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  children: React.ReactNode;
  winRate?: number;
  showWinRate?: boolean;
}
export function FolderAccordion({
  folder,
  itemCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  children,
  winRate,
  showWinRate = false
}: FolderAccordionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: folder.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return <div ref={setNodeRef} style={style} className={cn("w-full", isDragging && "opacity-50 z-50")}>
      {/* Folder Header */}
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button {...attributes} {...listeners} className="p-1.5 -ml-1.5 touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="h-4 w-4" />
        </button>

        <button onClick={onToggle} className={cn("flex-1 flex items-center gap-3 py-3.5 transition-colors", "hover:opacity-80 cursor-pointer text-left")}>
          <FolderIcon className="h-5 w-5 flex-shrink-0" color={folder.color || '#8b5cf6'} />
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium text-foreground">{folder.name}</span>
            <span className="text-muted-foreground text-sm">({itemCount})</span>
            {showWinRate && winRate !== undefined && itemCount > 0}
          </div>
          
          <motion.div animate={{
          rotate: isExpanded ? 0 : 180
        }} transition={{
          duration: 0.2,
          ease: 'easeOut'
        }}>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>

        {/* 3-Dots Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={e => e.stopPropagation()} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {onDuplicate && <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>}
            {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }} className="overflow-hidden">
            <div className="pt-2 pb-6 pl-8">
              {children}
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
}