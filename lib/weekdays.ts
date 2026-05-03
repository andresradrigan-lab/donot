/**
 * Helper puro (sin acceso a BD) para parsear el campo Json
 * `availableWeekdays` que en MySQL/MariaDB se guarda como array JSON.
 *
 * Vivo en su propio archivo para que los componentes cliente puedan
 * usarlo sin arrastrar a Prisma + el adapter de MariaDB al bundle.
 */
export function weekdaysFromJson(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const out: number[] = []
  for (const v of value) {
    const n = Number(v)
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.push(n)
  }
  return out
}
