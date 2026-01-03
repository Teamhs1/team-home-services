// /lib/events.js
export function emitJobCreated(job) {
  window.dispatchEvent(new CustomEvent("job:created", { detail: job }));
}
