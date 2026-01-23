"use client";

export default function PublicThemePreview() {
  return (
    <main className="min-h-screen flex items-center justify-center text-center p-10">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold">🎨 Theme Preview</h1>
        <p className="text-gray-500">
          This is a public preview of the Team Home Services design system.
        </p>

        <button className="px-4 py-2 rounded bg-blue-600 text-white">
          Example Button
        </button>
      </div>
    </main>
  );
}
