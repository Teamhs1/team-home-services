// components/job-upload/processImage.js

export async function processImage(file) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0);

      const MAX = 1600;
      const scale = Math.min(MAX / w, MAX / h, 1);

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = w * scale;
      finalCanvas.height = h * scale;

      finalCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0,
          0,
          w,
          h,
          0,
          0,
          finalCanvas.width,
          finalCanvas.height
        );

      finalCanvas.toBlob(
        (blob) =>
          resolve(
            new File([blob], file.name, { type: file.type || "image/jpeg" })
          ),
        "image/jpeg",
        0.92
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
