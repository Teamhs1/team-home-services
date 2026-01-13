"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export default function ViewToggleButton({ viewMode, setViewMode }) {
  const isGrid = viewMode === "grid";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setViewMode(isGrid ? "list" : "grid")}
      className="h-9 w-9"
      aria-label={isGrid ? "Switch to list view" : "Switch to grid view"}
    >
      {isGrid ? (
        <List className="w-4 h-4" />
      ) : (
        <LayoutGrid className="w-4 h-4" />
      )}
    </Button>
  );
}
