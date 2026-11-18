import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white shadow-xs",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive:
          "border-transparent bg-rose-500/10 text-rose-600 border-rose-200",
        outline: "text-slate-700 border-slate-300",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 font-semibold",
        info:
          "border-sky-200 bg-sky-50 text-sky-700 font-semibold",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
