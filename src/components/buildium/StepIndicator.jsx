"use client";

export default function StepIndicator({ step }) {
  const steps = ["Connect", "Preview", "Import", "Done"];

  return (
    <div className="flex justify-between text-xs text-gray-400">
      {steps.map((label, i) => {
        const active = step === i + 1;

        return (
          <div key={i} className="flex-1 text-center">
            <div
              className={`mx-auto mb-1 w-6 h-6 rounded-full flex items-center justify-center text-xs
              ${active ? "bg-black text-white" : "bg-gray-200"}`}
            >
              {i + 1}
            </div>
            <span className={active ? "text-black font-medium" : ""}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
