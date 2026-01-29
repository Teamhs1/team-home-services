"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const { user } = useUser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Update Clerk
      const [firstName, ...rest] = name.trim().split(" ");
      await user.update({
        firstName,
        lastName: rest.join(" "),
      });

      // 2️⃣ Create profile in Supabase
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      toast.success("Profile completed 🎉");

      // 3️⃣ Go to dashboard
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Error completing profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Complete your profile</h1>
        <p className="text-gray-500 mb-6">
          We just need a bit more info to get you started.
        </p>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={16} />}
          Continue
        </button>
      </div>
    </div>
  );
}
