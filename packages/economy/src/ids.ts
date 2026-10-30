// Ids (CONTRACTS.md §10): Economy mints inv, mkt, ship, ord, org with a counter per prefix. Stable, never reused,
// deterministic on replay. Every other id (goods, recipes, holders, settlements, roles) is the host's, opaque.

export const PREFIXES = ['inv', 'mkt', 'ship', 'ord', 'org'] as const
export type Prefix = (typeof PREFIXES)[number]
export type Counters = Partial<Record<Prefix, number>>

export function mint(counters: Counters, prefix: Prefix): { id: string; counters: Counters } {
  const n = (counters[prefix] ?? 0) + 1
  return { id: `${prefix}.${String(n).padStart(4, '0')}`, counters: { ...counters, [prefix]: n } }
}
