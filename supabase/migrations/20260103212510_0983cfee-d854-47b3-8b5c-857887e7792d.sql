-- Add sort_order column to folders table
ALTER TABLE public.folders ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing folders with sequential sort order
UPDATE public.folders 
SET sort_order = sub.rn 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, type ORDER BY created_at ASC) - 1 as rn 
  FROM public.folders
) sub 
WHERE public.folders.id = sub.id;