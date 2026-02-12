"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Headphones, X, Minus, Volume2, Zap } from "lucide-react";

export default function WorkFocusPlayer() {
  /* =========================
     MUSIC STYLES (EXPANDED)
  ========================= */
  const STYLES = [
    {
      key: "focus",
      label: "Focus Lo-Fi",
      url: "https://stream-uk1.radioparadise.com/mp3-192",
      color: "rgba(99,102,241,0.25)", // indigo
    },
    {
      key: "salsa",
      label: "Salsa",
      url: "https://stream.laut.fm/salsa",
      color: "rgba(239,68,68,0.25)", // red
    },
    {
      key: "reggaeton",
      label: "Reggaeton",
      url: "https://stream.laut.fm/reggaeton",
      color: "rgba(234,179,8,0.25)", // yellow
    },
    {
      key: "pop",
      label: "Pop Hits",
      url: "https://stream.laut.fm/pop",
      color: "rgba(168,85,247,0.25)", // purple
    },
    {
      key: "rock",
      label: "Rock",
      url: "https://stream.laut.fm/rock",
      color: "rgba(107,114,128,0.25)", // gray
    },
    {
      key: "jazz",
      label: "Jazz",
      url: "https://stream.laut.fm/jazz",
      color: "rgba(16,185,129,0.25)", // green
    },
    {
      key: "chill",
      label: "Chillout",
      url: "https://stream.laut.fm/chillout",
      color: "rgba(59,130,246,0.25)", // blue
    },
    {
      key: "energy",
      label: "Energy Boost ⚡",
      url: "https://stream.laut.fm/dance",
      color: "rgba(244,63,94,0.30)", // strong pink
    },
  ];

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [blurActive, setBlurActive] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [volume, setVolume] = useState(0.7);

  const audioRef = useRef(null);

  /* =========================
     LOAD SAVED SETTINGS
  ========================= */
  useEffect(() => {
    const savedStyle = localStorage.getItem("focus-style");
    const savedVolume = localStorage.getItem("focus-volume");

    if (savedStyle) {
      const found = STYLES.find((s) => s.key === savedStyle);
      if (found) setSelectedStyle(found);
    }

    if (savedVolume) {
      setVolume(Number(savedVolume));
    }
  }, []);

  /* =========================
     UPDATE AUDIO SOURCE
  ========================= */
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.src = selectedStyle.url;
    localStorage.setItem("focus-style", selectedStyle.key);

    if (playing) {
      audio.play().catch(() => {});
    }
  }, [selectedStyle]);

  /* =========================
     UPDATE VOLUME
  ========================= */
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("focus-volume", volume);
  }, [volume]);

  /* =========================
     PLAY / PAUSE
  ========================= */
  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
        setBlurActive(false);
      } else {
        await audioRef.current.play();
        setPlaying(true);
        setBlurActive(true);
      }
    } catch (err) {
      console.error("Playback failed:", err);
    }
  };

  const changeStyle = (style) => {
    setSelectedStyle(style);
  };

  const closePanel = () => {
    if (audioRef.current) {
      audioRef.current.pause(); // ⛔ detener música
      audioRef.current.currentTime = 0; // 🔄 reset stream
    }

    setPlaying(false); // estado de reproducción
    setBlurActive(false); // quitar blur
    setOpen(false); // cerrar panel
    setMinimized(false); // quitar mini player
  };

  const minimizePanel = () => {
    setMinimized(true);
    setOpen(false);
  };
  /* =========================
   RESTORE BLUR IF PANEL OPENS
========================= */
  useEffect(() => {
    if (playing && open) {
      setBlurActive(true);
    }
  }, [open, playing]);

  /* =========================
   SMART BLUR + AUTO MINIMIZE ON SCROLL
========================= */
  useEffect(() => {
    if (!playing) return;

    let timeout;

    const handleScroll = () => {
      // 1️⃣ Quitar blur inmediatamente
      setBlurActive(false);

      // 2️⃣ Minimizar si está abierto
      if (open) {
        setMinimized(true);
        setOpen(false);
      }

      // 3️⃣ Reiniciar temporizador
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        // Solo restaurar blur si:
        // - Sigue sonando
        // - NO está minimizado
        if (playing && !minimized) {
          setBlurActive(true);
        }
      }, 1200); // ⏱ 1.2 segundos sin scroll
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, [playing, open, minimized]);

  return (
    <div className="relative">
      <audio ref={audioRef} loop />

      {/* DYNAMIC BLUR COLOR */}
      <AnimatePresence>
        {blurActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998]"
            style={{
              backdropFilter: "blur(12px)",
              backgroundColor: selectedStyle.color,
            }}
          />
        )}
      </AnimatePresence>

      {!playing && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition"
        >
          <Headphones size={14} />
          Focus
        </button>
      )}

      {/* FULL PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed inset-x-0 top-24 mx-auto w-[90vw] max-w-xs md:absolute md:top-12 md:right-0 md:left-auto md:mx-0 md:w-72 bg-white dark:bg-gray-900 shadow-2xl border rounded-xl p-4 z-[9999]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-1">
                {selectedStyle.label}
                {selectedStyle.key === "energy" && (
                  <Zap size={14} className="text-red-500" />
                )}
              </span>

              <div className="flex items-center gap-2">
                <button onClick={minimizePanel}>
                  <Minus size={16} />
                </button>
                <button onClick={closePanel}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* PLAY */}
            <div className="flex justify-center mb-4">
              <button
                onClick={togglePlay}
                className={`p-3 rounded-full transition ${
                  playing
                    ? "bg-purple-600 text-white animate-pulse shadow-lg"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>

            {/* VOLUME */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 size={14} />
                <span className="text-xs">Volume</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* STYLES */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Music Style</p>

              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.key}
                    onClick={() => changeStyle(style)}
                    className={`text-xs px-2 py-1 rounded-lg border transition ${
                      selectedStyle.key === style.key
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MINI PLAYER */}
      <AnimatePresence>
        {minimized && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 right-4 bg-purple-600 text-white rounded-full shadow-xl p-3 z-[9999] flex items-center gap-2"
          >
            <Headphones size={16} />
            <span className="text-xs">{selectedStyle.label}</span>

            <button onClick={togglePlay}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={() => {
                setMinimized(false);
                setOpen(true);

                // 🔥 Reactivar blur si está sonando
                if (playing) {
                  setBlurActive(true);
                }
              }}
            >
              ⬆
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
