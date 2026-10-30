/** Formula atom counts and standard atomic weights (kg/mol), CIAAW:
 * https://ciaaw.org/atomic-weights.htm. Rounded representative values, not isotope masses.
 */
export const atomicMass: Record<string, number> = {
  H: .001008, C: .012011, N: .014007, O: .015999, S: .03206,
  K: .039098, Ca: .040078, Hg: .20059, Pb: .2072, Fe: .055845, Cu: .063546,
};

/** Parse neutral formulas, including repeated atoms and nested parenthesized groups.
 * Unsupported notation is rejected rather than silently losing atoms.
 */
export function formulaAtoms(formula: string): Record<string, number> {
  let i = 0;
  function count() {
    const digits = /^\d+/.exec(formula.slice(i))?.[0];
    if (!digits) return 1;
    i += digits.length;
    const n = Number(digits);
    if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`invalid formula ${formula}`);
    return n;
  }
  function group(nested: boolean): Record<string, number> {
    const atoms: Record<string, number> = {};
    while (i < formula.length && formula[i] !== ")") {
      let part: Record<string, number>;
      if (formula[i] === "(") {
        i++;
        part = group(true);
      } else {
        const el = /^[A-Z][a-z]?/.exec(formula.slice(i))?.[0];
        if (!el) throw new Error(`invalid formula ${formula}`);
        i += el.length;
        part = { [el]: 1 };
      }
      const n = count();
      for (const [el, value] of Object.entries(part)) atoms[el] = (atoms[el] ?? 0) + value * n;
    }
    if (!Object.keys(atoms).length || (nested && formula[i++] !== ")")) throw new Error(`invalid formula ${formula}`);
    return atoms;
  }
  const atoms = group(false);
  if (i !== formula.length) throw new Error(`invalid formula ${formula}`);
  return atoms;
}
