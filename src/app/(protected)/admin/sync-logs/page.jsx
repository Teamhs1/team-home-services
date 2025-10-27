"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SyncLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data);
    } catch (err) {
      toast.error("Error loading logs: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!logs.length) return;
    const csv = [
      ["Email", "Role", "Action", "Status", "Message", "Date"],
      ...logs.map((l) => [
        l.user_email,
        l.role,
        l.action,
        l.status,
        `"${l.message?.replace(/"/g, "'")}"`,
        new Date(l.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          🔄 Sync Logs
        </h1>
        <div className="flex gap-3">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2"
          >
            <RefreshCcw size={18} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No logs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`border-t ${
                    log.status === "error"
                      ? "bg-red-50 text-red-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2">{log.user_email}</td>
                  <td className="px-4 py-2 capitalize">{log.role}</td>
                  <td className="px-4 py-2">{log.action}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      log.status === "error" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {log.status}
                  </td>
                  <td className="px-4 py-2">{log.message}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
