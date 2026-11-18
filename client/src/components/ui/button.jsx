import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-xs",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-700 shadow-none",
        link:
          "text-blue-600 underline-offset-4 hover:underline shadow-none",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20",
        subtle:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base font-bold",
        icon: "h-9 w-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
