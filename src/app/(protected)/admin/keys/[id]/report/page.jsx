"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportKeyPage(props) {
  const router = useRouter();

  // 🔥 Next.js 15 — params es una PROMESA
  const { id: tag } = use(props.params);

  const [note, setNote] = useState("");

  async function submitReport() {
    await fetch("/api/keys/report", {
      method: "POST",
      body: JSON.stringify({ tag, note }),
    });

    router.push("/admin/keys/reported");
  }

  return (
    <div className="p-8 pt-[130px] max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Report Issue for Key: {tag}</h1>

      <textarea
        className="w-full border p-3 rounded-lg"
        placeholder="Describe the issue (missing, broken, etc.)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        onClick={submitReport}
        className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg"
      >
        Submit Report
      </button>
    </div>
  );
}
