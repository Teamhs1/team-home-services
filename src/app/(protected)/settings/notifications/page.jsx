"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare } from "lucide-react";

export default function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [systemNotifs, setSystemNotifs] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="container-page px-6 pb-8 space-y-8"
    >
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-800">🔔 Notifications</h1>
        <p className="text-gray-500 text-sm">
          Control how you receive notifications about updates and activities.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <Mail className="text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-800">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive updates via email for important events.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
            className="toggle-checkbox accent-blue-600 w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <Bell className="text-yellow-500" />
            <div>
              <h3 className="font-medium text-gray-800">System Alerts</h3>
              <p className="text-sm text-gray-500">
                Show in-app notifications for job updates or new messages.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={systemNotifs}
            onChange={(e) => setSystemNotifs(e.target.checked)}
            className="toggle-checkbox accent-blue-600 w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-green-500" />
            <div>
              <h3 className="font-medium text-gray-800">Message Alerts</h3>
              <p className="text-sm text-gray-500">
                Get notified when clients or team members send you messages.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={messageAlerts}
            onChange={(e) => setMessageAlerts(e.target.checked)}
            className="toggle-checkbox accent-blue-600 w-5 h-5"
          />
        </div>
      </div>
    </motion.div>
  );
}
