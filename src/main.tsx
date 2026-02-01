import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "./integrations/supabase/client";

// Keep session alive in PWA mode
if ('serviceWorker' in navigator) {
  // Refresh auth token when app becomes visible (user returns to app)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
      }
    }
  });

  // Also refresh on focus
  window.addEventListener('focus', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.refreshSession();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
