"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";

export default function MessagesTable({ messages = [], onSelect }) {
  if (!messages.length) {
    return (
      <div className="text-center text-gray-500 py-10 italic text-sm">
        No messages found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800 border rounded-lg overflow-hidden">
      {messages.map((msg, idx) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          onClick={() => onSelect?.(msg)}
          className="
            flex items-center justify-between 
            hover:bg-gray-50 dark:hover:bg-gray-800/50
            transition cursor-pointer px-4 py-3 group
          "
        >
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Gmail-style circle icon */}
            <div
              className="
                bg-blue-100 dark:bg-blue-900/30 
                text-blue-600 dark:text-blue-300 
                w-9 h-9 flex items-center justify-center rounded-full
                shrink-0
              "
            >
              <Mail size={18} />
            </div>

            {/* Text block */}
            <div className="min-w-0">
              {/* Top line: Name + Email */}
              <div className="flex gap-2 text-sm text-gray-900 dark:text-gray-100 font-semibold truncate">
                <span className="truncate">{msg.name}</span>
                <span className="text-gray-500 dark:text-gray-400 truncate">
                  • {msg.email}
                </span>
              </div>

              {/* Message snippet (one line only) */}
              <p
                className="
                  text-xs text-gray-600 dark:text-gray-300 
                  truncate max-w-[85%]
                "
              >
                {msg.message}
              </p>
            </div>
          </div>

          {/* DATE + ARROW */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {new Date(msg.created_at).toLocaleDateString()}
            </span>

            <ArrowRight
              size={18}
              className="
                text-gray-400 group-hover:text-gray-600 
                dark:group-hover:text-gray-300 transition
              "
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
