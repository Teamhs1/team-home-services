"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

export const Switch = React.forwardRef(
  ({ checked, onCheckedChange, disabled }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? "bg-blue-600" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <SwitchPrimitive.Thumb
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </SwitchPrimitive.Root>
  ),
);

Switch.displayName = "Switch";
