-- Add columns to profiles table for syncing preferences across devices
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS color_preset_id TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT '{"primary": "#22c55e", "background": "#0a0a0a", "winColor": "#22c55e", "lossColor": "#ef4444", "backgroundTint": "#22c55e"}'::jsonb,
ADD COLUMN IF NOT EXISTS saved_presets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS liquid_glass_enabled BOOLEAN DEFAULT true;