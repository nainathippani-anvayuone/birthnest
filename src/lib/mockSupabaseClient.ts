// A minimal, in-memory stand-in for the subset of the supabase-js API this
// app actually uses (see the .from()/.auth()/.channel() calls across
// src/pages and src/hooks). Powers "demo mode" when no real Supabase project
// is configured — see isDemoMode in lib/supabase.ts. Deliberately loose
// typing throughout: it's emulating a schemaless query engine.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { demoStore, demoCredentials, type Row, type Store } from './demoData';

type Listener = (event: string, session: any) => void;

// A slimmed-down mirror of the RLS policies in supabase/migrations/, applied
// to SELECT results only. Real Postgres RLS scopes rows automatically even
// when the app's own query has no explicit filter — several pages
// intentionally lean on that (e.g. AppointmentsPage queries every
// appointment and trusts RLS to narrow it per role). The mock has no
// database underneath it, so without this, a demo receptionist login would
// see every doctor's private clinical notes, etc. Patients never log in
// (staff-only portal), so there's no patient-self-access case here at all —
// every table is scoped purely by staff role / doctor ownership.
interface SessionCtx { userId: string | null; role: string | null }
const STAFF_ROLES = new Set(['admin', 'doctor', 'receptionist', 'lab_staff']);

function applyRowLevelSecurity(table: string, rows: Row[], ctx: SessionCtx): Row[] {
  const { userId, role } = ctx;
  switch (table) {
    case 'profiles':
      return rows.filter((r) => r.id === userId || (role !== null && STAFF_ROLES.has(role)));
    case 'patients':
      return rows.filter(() => role !== null && STAFF_ROLES.has(role));
    case 'appointments':
      return rows.filter((r) => r.doctor_id === userId || role === 'admin' || role === 'receptionist');
    case 'consultations':
    case 'prescriptions':
      return rows.filter((r) => r.doctor_id === userId || role === 'admin');
    case 'lab_orders':
      return rows.filter((r) => r.doctor_id === userId || role === 'admin' || role === 'lab_staff' || role === 'receptionist');
    case 'invoices':
      return rows.filter(() => role === 'admin' || role === 'receptionist');
    default:
      return rows; // no policy needed: public catalogs, or always explicitly filtered by the caller
  }
}

interface EmbedDef {
  table: string;
  type: 'one' | 'many';
  localField: string;
  foreignField: string;
}

// parentTable>alias -> how to resolve that embed. Covers every relational
// select string used in this codebase (see the grep-verified inventory in
// the PR that introduced demo mode).
const EMBED_CONFIG: Record<string, EmbedDef> = {
  'doctors>profile': { table: 'profiles', type: 'one', localField: 'id', foreignField: 'id' },
  'appointments>patient': { table: 'patients', type: 'one', localField: 'patient_id', foreignField: 'id' },
  'appointments>doctor': { table: 'doctors', type: 'one', localField: 'doctor_id', foreignField: 'id' },
  'appointments>service': { table: 'services', type: 'one', localField: 'service_id', foreignField: 'id' },
  'consultations>patient': { table: 'patients', type: 'one', localField: 'patient_id', foreignField: 'id' },
  'consultations>doctor': { table: 'doctors', type: 'one', localField: 'doctor_id', foreignField: 'id' },
  'prescriptions>patient': { table: 'patients', type: 'one', localField: 'patient_id', foreignField: 'id' },
  'prescriptions>doctor': { table: 'doctors', type: 'one', localField: 'doctor_id', foreignField: 'id' },
  'prescriptions>items': { table: 'prescription_items', type: 'many', localField: 'id', foreignField: 'prescription_id' },
  'lab_orders>patient': { table: 'patients', type: 'one', localField: 'patient_id', foreignField: 'id' },
  'lab_orders>doctor': { table: 'doctors', type: 'one', localField: 'doctor_id', foreignField: 'id' },
  'lab_orders>items': { table: 'lab_order_items', type: 'many', localField: 'id', foreignField: 'lab_order_id' },
  'lab_order_items>lab_test': { table: 'lab_tests', type: 'one', localField: 'lab_test_id', foreignField: 'id' },
  'invoices>patient': { table: 'patients', type: 'one', localField: 'patient_id', foreignField: 'id' },
  'invoices>items': { table: 'invoice_items', type: 'many', localField: 'id', foreignField: 'invoice_id' },
  'invoices>payments': { table: 'payments', type: 'many', localField: 'id', foreignField: 'invoice_id' },
  'medication_dispenses>medication': { table: 'medications', type: 'one', localField: 'medication_id', foreignField: 'id' },
};

function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseEmbeds(selectStr: string): { alias: string; table: string; inner: string }[] {
  const embeds: { alias: string; table: string; inner: string }[] = [];
  for (const raw of splitTopLevel(selectStr)) {
    const token = raw.trim();
    const parenIdx = token.indexOf('(');
    if (parenIdx === -1) continue; // plain column / '*' — no embed
    const head = token.slice(0, parenIdx).trim();
    const inner = token.slice(parenIdx + 1, token.lastIndexOf(')'));
    const [aliasPart, tablePart] = head.includes(':') ? head.split(':') : [head, head];
    embeds.push({ alias: aliasPart.trim(), table: tablePart.trim(), inner });
  }
  return embeds;
}

function attachEmbeds(parentTable: string, row: Row, selectStr: string, store: Store): Row {
  const embeds = parseEmbeds(selectStr);
  if (embeds.length === 0) return row;
  const result: Row = { ...row };
  for (const e of embeds) {
    const def = EMBED_CONFIG[`${parentTable}>${e.alias}`];
    if (!def) continue;
    const pool = store[def.table] ?? [];
    if (def.type === 'one') {
      const match = pool.find((r) => r[def.foreignField] === row[def.localField]) ?? null;
      result[e.alias] = match ? attachEmbeds(def.table, match, e.inner, store) : null;
    } else {
      result[e.alias] = pool
        .filter((r) => r[def.foreignField] === row[def.localField])
        .map((r) => attachEmbeds(def.table, r, e.inner, store));
    }
  }
  return result;
}

type FilterOp = 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'not_null';
interface Filter { field: string; op: FilterOp; value: unknown }

function applyFilter(rows: Row[], f: Filter): Row[] {
  switch (f.op) {
    case 'eq': return rows.filter((r) => r[f.field] === f.value);
    case 'neq': return rows.filter((r) => r[f.field] !== f.value);
    case 'in': return rows.filter((r) => (f.value as unknown[]).includes(r[f.field]));
    case 'gte': return rows.filter((r) => r[f.field] !== null && r[f.field] !== undefined && r[f.field] >= (f.value as string | number));
    case 'lte': return rows.filter((r) => r[f.field] !== null && r[f.field] !== undefined && r[f.field] <= (f.value as string | number));
    case 'not_null': return rows.filter((r) => r[f.field] !== null && r[f.field] !== undefined);
    default: return rows;
  }
}

let idCounter = 0;
function nextId(table: string) {
  idCounter += 1;
  return `demo-${table}-${Date.now().toString(36)}-${idCounter}`;
}

// A tiny table-level pub/sub so `.channel(...).on('postgres_changes', ...)`
// actually reacts to writes in demo mode (e.g. the notification badge
// updating the moment a notification is marked read), instead of being a
// silent no-op. Real per-row filter strings (`user_id=eq.<id>`) aren't
// parsed — every listener on a table just gets told "something changed" and
// re-fetches, which is fine since only one demo session is active at a time.
type TableListener = () => void;
const tableListeners = new Map<string, Set<TableListener>>();

function emitTableChange(table: string) {
  tableListeners.get(table)?.forEach((cb) => cb());
}

function subscribeTable(table: string, cb: TableListener) {
  if (!tableListeners.has(table)) tableListeners.set(table, new Set());
  tableListeners.get(table)!.add(cb);
  return () => tableListeners.get(table)?.delete(cb);
}

class MockQueryBuilder implements PromiseLike<{ data: any; error: any; count?: number }> {
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectStr = '*';
  private filters: Filter[] = [];
  private orders: { field: string; ascending: boolean }[] = [];
  private limitN?: number;
  private wantSingle = false;
  private wantCount = false;
  private wantHead = false;
  private insertPayload?: Row | Row[];
  private updatePayload?: Row;

  constructor(private store: Store, private table: string, private getCtx: () => SessionCtx) {}

  select(cols?: string, opts?: { count?: 'exact'; head?: boolean }) {
    if (cols) this.selectStr = cols;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.wantHead = true;
    return this;
  }
  eq(field: string, value: unknown) { this.filters.push({ field, op: 'eq', value }); return this; }
  neq(field: string, value: unknown) { this.filters.push({ field, op: 'neq', value }); return this; }
  in(field: string, value: unknown[]) { this.filters.push({ field, op: 'in', value }); return this; }
  gte(field: string, value: unknown) { this.filters.push({ field, op: 'gte', value }); return this; }
  lte(field: string, value: unknown) { this.filters.push({ field, op: 'lte', value }); return this; }
  not(field: string, _op: string, value: unknown) {
    if (value === null) this.filters.push({ field, op: 'not_null', value: null });
    return this;
  }
  order(field: string, opts?: { ascending?: boolean }) {
    this.orders.push({ field, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.wantSingle = true; return this; }
  maybeSingle() { this.wantSingle = true; return this; }
  insert(payload: Row | Row[]) { this.mode = 'insert'; this.insertPayload = payload; return this; }
  update(payload: Row) { this.mode = 'update'; this.updatePayload = payload; return this; }
  delete() { this.mode = 'delete'; return this; }

  then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
    onFulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onFulfilled, onRejected);
  }

  private matchRows(): Row[] {
    const base = this.store[this.table] ?? [];
    return this.filters.reduce((rows, f) => applyFilter(rows, f), base);
  }

  private async execute(): Promise<{ data: any; error: any; count?: number }> {
    if (this.mode === 'delete') {
      const matches = this.matchRows();
      this.store[this.table] = (this.store[this.table] ?? []).filter((r) => !matches.includes(r));
      emitTableChange(this.table);
      return { data: null, error: null };
    }

    if (this.mode === 'update') {
      const matches = this.matchRows();
      for (const row of matches) {
        Object.assign(row, this.updatePayload, { updated_at: new Date().toISOString() });
      }
      const data = this.wantSingle ? matches[0] ?? null : matches;
      emitTableChange(this.table);
      return { data, error: null };
    }

    if (this.mode === 'insert') {
      const payloads = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload!];
      const now = new Date().toISOString();
      const inserted = payloads.map((p) => {
        const row: Row = { id: nextId(this.table), created_at: now, updated_at: now, ...p };
        (this.store[this.table] ??= []).push(row);
        return row;
      });
      const data = this.wantSingle ? inserted[0] ?? null : inserted;
      emitTableChange(this.table);
      return { data, error: null };
    }

    // select
    let rows = applyRowLevelSecurity(this.table, this.matchRows(), this.getCtx());
    const count = rows.length;

    if (this.wantHead) {
      return { data: null, error: null, count };
    }

    if (this.orders.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const o of this.orders) {
          const av = a[o.field];
          const bv = b[o.field];
          if (av === bv) continue;
          const cmp = av > bv ? 1 : -1;
          return o.ascending ? cmp : -cmp;
        }
        return 0;
      });
    }

    if (this.limitN !== undefined) rows = rows.slice(0, this.limitN);

    const withEmbeds = rows.map((r) => attachEmbeds(this.table, r, this.selectStr, this.store));

    if (this.wantSingle) {
      return { data: withEmbeds[0] ?? null, error: withEmbeds[0] ? null : { message: 'No rows found' }, count };
    }
    return { data: withEmbeds, error: null, count: this.wantCount ? count : undefined };
  }
}

interface MockSession { user: { id: string; email: string } }

function profileToSession(store: Store, id: string): MockSession | null {
  const profile = (store.profiles ?? []).find((p) => p.id === id);
  if (!profile) return null;
  return { user: { id: profile.id, email: profile.email } };
}

const DEMO_SESSION_KEY = 'birthnest_demo_session_user_id';

/**
 * Creates a mock Supabase-shaped client. `persist` controls whether sign-in/
 * sign-out touches localStorage — false for the "ephemeral" client used by
 * account provisioning, matching the real persistSession:false client, so
 * an admin creating a doctor account never gets logged out as that doctor.
 */
export function createMockSupabaseClient(persist: boolean) {
  const store = demoStore;
  let session: MockSession | null = persist
    ? profileToSession(store, localStorage.getItem(DEMO_SESSION_KEY) ?? '')
    : null;
  const listeners: Listener[] = [];

  const notify = (event: string) => listeners.forEach((l) => l(event, session));

  const getCtx = (): SessionCtx => {
    const userId = session?.user.id ?? null;
    const role = userId ? (store.profiles ?? []).find((p) => p.id === userId)?.role ?? null : null;
    return { userId, role };
  };

  const client = {
    from(table: string) {
      return new MockQueryBuilder(store, table, getCtx);
    },
    channel(_name: string) {
      let table: string | null = null;
      let callback: TableListener | null = null;
      let unsubscribe: (() => void) | null = null;
      const handle = {
        on(_event: string, filter: { table?: string }, cb: (...args: unknown[]) => void) {
          table = filter?.table ?? null;
          callback = () => cb();
          return handle;
        },
        subscribe() {
          if (table && callback) unsubscribe = subscribeTable(table, callback);
          return handle;
        },
        unsubscribe() {
          unsubscribe?.();
        },
      };
      return handle;
    },
    removeChannel(channel: { unsubscribe?: () => void } | null | undefined) {
      channel?.unsubscribe?.();
    },
    auth: {
      async getSession() {
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback: Listener) {
        listeners.push(callback);
        return { data: { subscription: { unsubscribe() {
          const idx = listeners.indexOf(callback);
          if (idx >= 0) listeners.splice(idx, 1);
        } } } };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const cred = demoCredentials.get(email);
        if (!cred || cred.password !== password) {
          return { data: null, error: { message: 'Invalid demo email or password.' } };
        }
        session = profileToSession(store, cred.id);
        if (persist && session) localStorage.setItem(DEMO_SESSION_KEY, session.user.id);
        notify('SIGNED_IN');
        return { data: { session }, error: null };
      },
      async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string; phone?: string } } }) {
        // Only ever called via the ephemeral (persist:false) client, by
        // staff provisioning (Users page) — patients are never logins, and
        // there's no public self-signup in a staff-only portal. Mirrors the
        // real `handle_new_user` trigger's default: new accounts land as
        // the lowest-privilege staff role until explicitly promoted.
        if (demoCredentials.has(email)) {
          return { data: null, error: { message: 'An account with this email already exists.' } };
        }
        const id = nextId('profiles');
        const now = new Date().toISOString();
        (store.profiles ??= []).push({
          id, role: 'receptionist', full_name: options?.data?.full_name ?? email.split('@')[0],
          email, phone: options?.data?.phone ?? null, avatar_url: null, is_active: true, created_at: now, updated_at: now,
        });
        demoCredentials.set(email, { password, id });
        return { data: { user: { id, email } }, error: null };
      },
      async signOut() {
        session = null;
        if (persist) localStorage.removeItem(DEMO_SESSION_KEY);
        notify('SIGNED_OUT');
        return { error: null };
      },
      async updateUser(_attrs: { password?: string }) {
        return { data: { user: session?.user ?? null }, error: null };
      },
    },
  };

  return client;
}
