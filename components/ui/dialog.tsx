import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative bg-background p-6 shadow-lg rounded-lg border max-w-lg w-full mx-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
    {children}
  </div>
);

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h3>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle };