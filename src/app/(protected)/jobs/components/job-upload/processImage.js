// components/job-upload/processImage.js

export async function processImage(file) {
  return new Promise((resolve) => {
    // 🛡️ Guard clause: si no es imagen, no tocar
    if (!file || !file.type?.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    let settled = false; // 🔒 evita dobles resolve

    const safeResolve = (result) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        if (!w || !h) {
          // ⚠️ dimensiones inválidas → fallback
          safeResolve(file);
          return;
        }

        const MAX = 1600;
        const scale = Math.min(MAX / w, MAX / h, 1);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          safeResolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              safeResolve(file);
            } else {
              safeResolve(
                new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
              );
            }
          },
          "image/jpeg",
          0.9
        );
      } catch (err) {
        console.warn("⚠️ Image processing exception:", err);
        safeResolve(file);
      }
    };

    img.onerror = () => {
      console.warn("⚠️ Image failed to load, using original file:", file.name);
      safeResolve(file);
    };

    // ⏱️ Timeout de seguridad (mobile Safari fix)
    setTimeout(() => {
      if (!settled) {
        console.warn("⏱️ Image processing timeout, fallback:", file.name);
        safeResolve(file);
      }
    }, 4000);

    img.src = objectUrl;
  });
}
