import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "./integrations/supabase/client";

// Keep session alive in PWA mode - wrapped in error handling
if ('serviceWorker' in navigator) {
  // Refresh auth token when app becomes visible (user returns to app)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.refreshSession();
        }
      } catch (error) {
        // Silently handle errors - user will be prompted to log in if needed
        console.debug('Session refresh failed:', error);
      }
    }
  });

  // Also refresh on focus
  window.addEventListener('focus', async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
      }
    } catch (error) {
      // Silently handle errors - user will be prompted to log in if needed
      console.debug('Session refresh on focus failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
