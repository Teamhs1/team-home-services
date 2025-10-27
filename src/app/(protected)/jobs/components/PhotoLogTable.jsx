"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PhotoLogTable({ jobId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false); // 👈 Nuevo toggle

  useEffect(() => {
    if (!jobId || !showLogs) return; // 👈 solo carga si el admin abre el log

    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("photo_logs")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (!error) setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();

    // 🔁 Suscripción realtime (solo si está visible)
    const channel = supabase
      .channel("realtime:photo_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photo_logs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLogs((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [jobId, showLogs]);

  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          📸 Photo Activity
        </CardTitle>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLogs((prev) => !prev)}
          className="flex items-center gap-1"
        >
          {showLogs ? (
            <>
              <EyeOff className="w-4 h-4" /> Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> View
            </>
          )}
        </Button>
      </CardHeader>

      {/* 👇 Contenido del log solo visible si el admin lo abre */}
      {showLogs && (
        <CardContent className="overflow-x-auto transition-all duration-300 ease-in-out">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No photo activity recorded for this job yet.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 px-3">Preview</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/30 hover:bg-muted/10"
                  >
                    <td className="py-2 px-3">
                      {log.image_url ? (
                        <img
                          src={log.image_url}
                          alt="photo"
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={
                          log.action === "uploaded" ? "default" : "destructive"
                        }
                        className="capitalize"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {log.performed_by}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {log.performed_role || "-"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      )}
    </Card>
  );
}
