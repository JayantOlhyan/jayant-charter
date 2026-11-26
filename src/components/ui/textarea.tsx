import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[12px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-4 py-3 text-[15px] text-[var(--jc-ink)] transition-[border-color,background-color] duration-150 outline-none placeholder:text-[var(--jc-muted)]/65 hover:border-[var(--jc-muted)] focus-visible:border-[var(--jc-teal)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--jc-danger)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
