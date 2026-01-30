import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      duration={3000}
      style={isMobile ? { 
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        pointerEvents: 'none',
      } : undefined}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:pointer-events-auto dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800",
          error: "group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800",
          warning: "group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800",
          info: "group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
