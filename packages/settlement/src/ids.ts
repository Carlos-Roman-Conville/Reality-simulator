// Ids: a prefix and a zero-padded counter per settlement state, minted by the reducer so a replay mints the
// same ids. Ids are never reused and never renamed; a retired record keeps its id.

export const PREFIXES = [
  'dist', 'parcel', 'bldg', 'title', 'lease', 'txn', 'acct', 'biz', 'post', 'asg', 'proj', 'office', 'perm',
] as const
export type Prefix = typeof PREFIXES[number]

export type Counters = Record<string, number>

export function mint(counters: Counters, prefix: Prefix): { id: string; counters: Counters } {
  const n = (counters[prefix] ?? 0) + 1
  return { id: `${prefix}.${String(n).padStart(4, '0')}`, counters: { ...counters, [prefix]: n } }
}

export function prefixOf(id: string): string {
  return id.slice(0, id.indexOf('.'))
}

/** Pool ids are the host's: anything starting with `pool.` is a draw from an unnamed labour pool. */
export function isPool(person: string): boolean {
  return person.startsWith('pool.')
}
