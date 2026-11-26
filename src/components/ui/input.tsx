import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[12px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] px-4 py-2 text-[15px] text-[var(--jc-ink)] transition-[border-color,background-color] duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--jc-ink)] placeholder:text-[var(--jc-muted)]/65 hover:border-[var(--jc-muted)] focus-visible:border-[var(--jc-teal)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--jc-danger)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
