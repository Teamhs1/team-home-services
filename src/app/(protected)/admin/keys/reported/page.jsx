"use client";

import { useEffect, useState } from "react";
import { KeyRound, MapPin, Home, Tag, AlertTriangle } from "lucide-react";

export default function ReportedKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReportedKeys() {
    const res = await fetch("/api/keys/reported", { cache: "no-store" });
    const json = await res.json();
    setKeys(json.keys || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReportedKeys();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 pt-[130px]">
        Loading reported keys…
      </div>
    );
  }

  return (
    <div className="p-8 pt-[130px]">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <AlertTriangle className="text-red-500" /> Reported Keys
      </h1>

      {keys.length === 0 && (
        <div className="mt-10 text-gray-500 text-lg">
          No reported keys at the moment.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {keys.map((key) => (
          <div
            key={key.id}
            onClick={() =>
              (window.location.href = `/admin/keys/${key.tag_code}`)
            }
            className="cursor-pointer border border-red-300 rounded-xl bg-red-50 p-5 shadow hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="text-red-600" size={20} />
                {key.tag_code}
              </div>

              <span className="px-3 py-1 rounded-full bg-red-200 text-red-800 text-xs font-semibold">
                Reported
              </span>
            </div>

            <p className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} /> {key.property_address}
            </p>

            {key.report_note && (
              <p className="mt-3 text-sm text-red-700 italic">
                “{key.report_note}”
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
