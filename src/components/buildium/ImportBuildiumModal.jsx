"use client";

import StepIndicator from "@/components/buildium/StepIndicator";
import ImportSummary from "@/components/buildium/ImportSummary";
import ImportProgress from "@/components/buildium/ImportProgress";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, UploadCloud } from "lucide-react";

export default function ImportBuildiumModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
  });

  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  // =========================
  // ESC TO CLOSE
  // =========================
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // =========================
  // PREVIEW DATA
  // =========================
  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/import/buildium/preview", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      setPreview(data);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // =========================
  // IMPORT DATA
  // =========================
  const handleImport = async () => {
    setLoading(true);
    setStep(3);

    try {
      const res = await fetch("/api/import/buildium", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      console.error(err);
      setStep(4);
      setResult({ error: "Import failed" });
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Import from Buildium</h2>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-lg"
          >
            ✕
          </button>
        </div>

        {/* STEP INDICATOR */}
        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {/* STEP 1 - CREDENTIALS */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-3">
                <input
                  placeholder="Client ID"
                  className="w-full border rounded-lg p-2"
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      clientId: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Client Secret"
                  type="password"
                  className="w-full border rounded-lg p-2"
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      clientSecret: e.target.value,
                    })
                  }
                />

                <button
                  onClick={handlePreview}
                  className="w-full bg-black text-white py-2 rounded-lg flex justify-center items-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin w-4 h-4" />}
                  Preview Data
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 - PREVIEW */}
          {step === 2 && preview && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ImportSummary preview={preview} />

              <button
                onClick={handleImport}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg"
              >
                Import Now
              </button>
            </motion.div>
          )}

          {/* STEP 3 - LOADING */}
          {step === 3 && (
            <motion.div key="step3">
              <ImportProgress message="Importing your portfolio..." />
            </motion.div>
          )}

          {/* STEP 4 - RESULT */}
          {step === 4 && (
            <motion.div key="step4" className="text-center space-y-3">
              {result?.error ? (
                <>
                  <AlertCircle className="mx-auto text-red-500" />
                  <p>{result.error}</p>
                </>
              ) : (
                <>
                  <CheckCircle className="mx-auto text-green-500" />
                  <p>Import completed successfully</p>
                  <p className="text-sm text-gray-500">
                    {result?.propertiesImported} properties imported
                  </p>
                </>
              )}

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setPreview(null);
                  }}
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                >
                  Try Again
                </button>

                <button
                  onClick={onClose}
                  className="bg-black text-white px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
