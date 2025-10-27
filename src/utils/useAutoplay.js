import { useEffect, useRef } from "react";

/**
 * Custom hook para controlar autoplay de un slider.
 *
 * @param {boolean} isActive - Si el autoplay debe estar activo (ej. cuando está en hover).
 * @param {boolean} isPaused - Si el usuario ha pausado manualmente.
 * @param {Function} onNext - Función que se ejecuta en cada intervalo (ej. ir al siguiente slide).
 * @param {number} interval - Tiempo en milisegundos (default: 4000ms).
 */
const useAutoplay = (isActive, isPaused, onNext, interval = 4000) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        onNext();
      }, interval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused, onNext, interval]);
};

export default useAutoplay;
