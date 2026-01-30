import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border/50 bg-background/80 dark:bg-card/30 backdrop-blur-sm px-3 py-2 text-[16px] md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-muted/30 hover:border-border",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
