"use client";

import { useUser, useClerk, UserButton, UserProfile } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

export default function SettingsAccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="container-page px-6 pb-6 space-y-6 overflow-hidden">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-800">
          ⚙️ Account Settings
        </h1>
        <p className="text-gray-500 text-sm">
          View and manage your account details and profile settings.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-16 h-16 border rounded-full",
              },
            }}
          />
          <div>
            <h2 className="text-lg font-semibold text-brand">
              {user.fullName}
            </h2>
            <p className="text-sm text-gray-500">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="btn-brand-outline flex items-center gap-2 text-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="card p-5"
      >
        <h2 className="text-lg font-semibold text-brand mb-3">
          Manage Account
        </h2>
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              card: "bg-white dark:bg-gray-900 shadow-none",
              formButtonPrimary:
                "btn-brand w-full mt-4 hover:opacity-90 transition",
            },
          }}
        />
      </motion.section>
    </div>
  );
}
