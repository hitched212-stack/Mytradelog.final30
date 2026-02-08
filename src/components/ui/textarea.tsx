import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [textareaRef]);

  React.useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    if (props.onInput) {
      props.onInput(e);
    }
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border/50 bg-background/80 dark:bg-card/30 backdrop-blur-sm px-3 py-2 text-[16px] md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-muted/30 hover:border-border overflow-hidden",
        className,
      )}
      ref={textareaRef}
      onInput={handleInput}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
