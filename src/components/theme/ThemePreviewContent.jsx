export default function ThemePreviewContent({ mode = "public" }) {
  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold">
        🎨 Theme Preview {mode === "admin" && "(Admin)"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">Card</div>
        <button className="px-4 py-2 rounded bg-blue-600 text-white">
          Button
        </button>
        <input className="border rounded px-3 py-2" placeholder="Input" />
      </div>
    </div>
  );
}
