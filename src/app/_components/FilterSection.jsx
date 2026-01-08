"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bath, BedDouble, CalendarCheck, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function FilterSection({
  bedCount,
  bathCount,
  homeType,
  availability,
  sortBy,
  setBathCount,
  setBedCount,
  setHomeType,
  setAvailability,
  setSortBy,
  onClearAll,
  compact = false,
}) {
  return (
    <div className="grid w-full grid-cols-2 items-end gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {/* Bedroom */}
      <div className="h-[42px] w-full">
        <Select
          value={bedCount || "All"}
          onValueChange={(value) =>
            setBedCount(value === "All" ? undefined : value)
          }
        >
          <SelectTrigger className="h-[42px] w-full">
            <SelectValue placeholder="Bed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">
              <h2 className="flex gap-2">
                <BedDouble className="h-6 w-6 text-primary" /> Bed
              </h2>
            </SelectItem>
            {[2, 3, 4, 5].map((num) => (
              <SelectItem
                key={num}
                value={String(num)}
                className={`${
                  bedCount === String(num) ? "bg-primary text-white" : ""
                }`}
              >
                <h2 className="flex gap-2">
                  <BedDouble className="h-6 w-6 text-primary" /> {num}+
                </h2>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bath */}
      <div className="h-[42px] w-full">
        <Select
          value={bathCount || "All"}
          onValueChange={(value) =>
            setBathCount(value === "All" ? undefined : value)
          }
        >
          <SelectTrigger className="h-[42px] w-full">
            <SelectValue placeholder="Bath" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">
              <h2 className="flex gap-2">
                <Bath className="h-6 w-6 text-primary" /> Bath
              </h2>
            </SelectItem>
            {[2, 3, 4, 5].map((num) => (
              <SelectItem
                key={num}
                value={String(num)}
                className={`${
                  bathCount === String(num) ? "bg-primary text-white" : ""
                }`}
              >
                <h2 className="flex gap-2">
                  <Bath className="h-6 w-6 text-primary" /> {num}+
                </h2>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Home Type */}
      <div className="h-[42px] w-full">
        <Select
          value={homeType || "All"}
          onValueChange={(value) =>
            value === "All" ? setHomeType(undefined) : setHomeType(value)
          }
        >
          <SelectTrigger className="h-[42px] w-full">
            <SelectValue placeholder="Home Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Single Family Home">
              Single Family Home
            </SelectItem>
            <SelectItem value="Town House">Town House</SelectItem>
            <SelectItem value="Condo">Condo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Availability */}
      <div className="flex h-[42px] w-full items-center gap-2 rounded-md border border-input px-3">
        <CalendarCheck className="h-6 w-6 text-primary" />
        <Input
          type="date"
          className="h-[40px] border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        />
      </div>

      {/* Sort By */}
      <div className="h-[42px] w-full">
        <Select
          value={sortBy || "All"}
          onValueChange={(value) =>
            setSortBy(value === "All" ? undefined : value)
          }
        >
          <SelectTrigger className="h-[42px] w-full">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">
              <h2 className="flex gap-2">
                <ArrowDownUp className="h-6 w-6 text-primary" /> Sort
              </h2>
            </SelectItem>
            <SelectItem value="price-asc">
              <h2 className="flex gap-2">
                <ArrowDownUp className="h-6 w-6 text-primary" /> Price: Low to
                High
              </h2>
            </SelectItem>
            <SelectItem value="price-desc">
              <h2 className="flex gap-2">
                <ArrowDownUp className="h-6 w-6 text-primary" /> Price: High to
                Low
              </h2>
            </SelectItem>
            <SelectItem value="date-desc">
              <h2 className="flex gap-2">
                <ArrowDownUp className="h-6 w-6 text-primary" /> Newest
              </h2>
            </SelectItem>
            <SelectItem value="date-asc">
              <h2 className="flex gap-2">
                <ArrowDownUp className="h-6 w-6 text-primary" /> Oldest
              </h2>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear All */}
      <div className="h-[42px] w-full">
        <Button
          onClick={onClearAll}
          variant="outline"
          size="default"
          className="h-[42px] w-full whitespace-nowrap bg-red-500 text-white hover:bg-red-600"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}

export default FilterSection;
