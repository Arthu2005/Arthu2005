export type ActionResult = { ok: boolean; message: string; errors?: Record<string, string>; data?: Record<string, unknown> } | null;
