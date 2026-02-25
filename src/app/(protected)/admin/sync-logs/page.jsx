"use client";
import { Fragment } from "react";
import { useEffect, useState, useMemo } from "react";
import { Download, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function SyncLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);

  /* =========================
     FETCH
  ========================= */
  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-sync-logs");
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  /* =========================
     FILTERED LOGS
  ========================= */
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.user_email
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || log.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, search, statusFilter]);

  /* =========================
     EXPORT CSV
  ========================= */
  function exportCSV() {
    if (!filteredLogs.length) return;

    const csv = [
      ["Email", "Role", "Action", "Status", "Message", "Date"],
      ...filteredLogs.map((l) => [
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

  return (
    <main className="p-6 pt-28">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sync Logs</h1>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-muted hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full md:w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full md:w-48"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="text-muted-foreground">Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-muted-foreground">No logs found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isExpanded = expandedRow === log.id;

                return (
                  <Fragment key={log.id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{log.user_email}</td>
                      <td className="px-4 py-3 capitalize">{log.role}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          log.status === "error"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {log.status}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : log.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50 border-t">
                        <td
                          colSpan="6"
                          className="px-4 py-3 text-sm text-gray-700"
                        >
                          {log.message || "No message"}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
