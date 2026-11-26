"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-[var(--jc-line-strong)] bg-[var(--jc-paper)] transition-colors duration-150 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-[var(--jc-teal)] focus-visible:border-[var(--jc-teal)] focus-visible:ring-3 focus-visible:ring-[var(--jc-gold)]/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--jc-danger)] data-checked:border-[var(--jc-teal)] data-checked:bg-[var(--jc-teal)] data-checked:text-[var(--jc-ivory)] cursor-pointer",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
