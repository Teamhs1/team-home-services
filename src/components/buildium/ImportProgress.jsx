"use client";

import { Loader2 } from "lucide-react";

export default function ImportProgress({ message }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Loader2 className="animate-spin w-6 h-6" />
      <p className="text-sm text-gray-600">{message || "Processing..."}</p>
    </div>
  );
}
