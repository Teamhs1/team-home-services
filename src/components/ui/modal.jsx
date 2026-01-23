// components/ui/modal.jsx
"use client";

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
