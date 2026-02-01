export default function FormattedDescription({ text }) {
  if (!text) return <p>No description provided.</p>;

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => (
          <p key={i}>{line}</p>
        ))}
    </div>
  );
}
