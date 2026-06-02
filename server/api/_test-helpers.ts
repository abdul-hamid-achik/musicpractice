/**
 * Shared mock helpers for server API tests.
 *
 * Drizzle chains are fluent AND thenable: you can call methods on them
 * (`from`, `where`, `limit`...) and at any point `await` the chain to
 * materialize a row. We build plain chains where:
 *   - mutator methods (from, where, limit, offset, ...) return the chain itself
 *   - the chain is also thenable: `await chain` resolves to the configured
 *     `limitValue` / `returningValue` (whichever applies)
 */
export interface ChainOpts {
  /** Value resolved by `.limit(n)` and by direct `await` of the chain. */
  limitValue?: unknown;
  /** Value resolved by `.returning()`. */
  returningValue?: unknown;
}

export function makeChain(opts: ChainOpts = {}): any {
  const chain: any = {
    // mutators return the chain
    from: () => chain,
    where: () => chain,
    leftJoin: () => chain,
    innerJoin: () => chain,
    rightJoin: () => chain,
    fullJoin: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    having: () => chain,
    offset: () => chain,
    values: () => chain,
    set: () => chain,
  };
  // Terminals return the chain (which is thenable) — not a Promise.
  // This way, callers can keep chaining (`.limit().offset()`) and still
  // `await` at the end to materialize the result.
  chain.limit = () => chain;
  chain.returning = () => chain;
  // Thenable
  chain.then = (resolve: (v: unknown) => void) => resolve(opts.limitValue ?? opts.returningValue);
  return chain;
}

export interface DrizzleMockOpts {
  /** Single-shot value for `select(...).limit(n)` and await of the select chain. */
  selectLimit?: unknown;
  /** Single-shot value for `select(...).returning()` */
  selectReturning?: unknown;
  /** Per-call queue of select values. Each call returns the next value (or last). */
  selectQueue?: unknown[];
  /** Single-shot value for `insert(...).returning()` */
  insertReturning?: unknown;
  /** Single-shot value for `update(...).returning()` */
  updateReturning?: unknown;
  /** Single-shot value for `delete(...).returning()` */
  deleteReturning?: unknown;
}

export function makeDrizzleMock(opts: DrizzleMockOpts = {}): any {
  let selectIdx = 0;
  const getNextSelect = (): unknown => {
    if (!opts.selectQueue) return opts.selectLimit;
    const v = opts.selectQueue[selectIdx] ?? opts.selectQueue[opts.selectQueue.length - 1];
    selectIdx++;
    return v;
  };
  return {
    select: () => makeChain({ limitValue: getNextSelect(), returningValue: opts.selectReturning }),
    insert: () => makeChain({ returningValue: opts.insertReturning }),
    update: () => makeChain({ returningValue: opts.updateReturning }),
    delete: () => makeChain({ returningValue: opts.deleteReturning }),
  };
}
