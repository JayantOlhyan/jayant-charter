export function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `***${digits.slice(-4)}`;
}

export function redactEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  return `${parts[0].slice(0, 1)}***@${parts[1]}`;
}

export function safeOperationalLog(
  event: string,
  meta: Record<string, string | number | boolean | null | undefined>
) {
  const clean: Record<string, string | number | boolean | null | undefined> = {};
  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase();
    if (lower.includes("phone") || lower.includes("email") || lower.includes("note") || lower.includes("name")) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = value;
    }
  }
  if (process.env.NODE_ENV !== "test") {
    console.info(JSON.stringify({ ts: new Date().toISOString(), event, ...clean }));
  }
}
