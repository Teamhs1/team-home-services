"use client";

export default function RentalsFilters({ filters, setFilters }) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <label className="text-sm text-gray-500">Max price</label>
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters((f) => ({ ...f, maxPrice: e.target.value }))
          }
          className="w-28 rounded-md border px-2 py-1"
        />
      </div>

      <div>
        <label className="text-sm text-gray-500">Bedrooms</label>
        <select
          value={filters.beds}
          onChange={(e) => setFilters((f) => ({ ...f, beds: e.target.value }))}
          className="rounded-md border px-2 py-1"
        >
          <option value="any">Any</option>
          <option value="0">Bachelor</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.parking}
          onChange={(e) =>
            setFilters((f) => ({ ...f, parking: e.target.checked }))
          }
        />
        Parking
      </label>
    </div>
  );
}
