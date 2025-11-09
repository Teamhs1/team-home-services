"use client";
import { useState } from "react";

export default function TestSupabaseButton() {
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    try {
      const res = await fetch("/api/test-supabase");
      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error("❌ Error:", err);
      setResult({ error: err.message });
    }
  };

  return (
    <div className="p-4 border rounded-md mt-4">
      <button
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test /api/test-supabase
      </button>

      {result && (
        <pre className="mt-3 text-sm bg-gray-900 text-white p-2 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
