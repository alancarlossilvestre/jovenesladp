import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// Capa de datos aislada: cambiar a PostgreSQL solo exige reimplementar este módulo.
export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS entries (
      kind TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY (kind, id)
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      church TEXT NOT NULL DEFAULT '',
      consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS registrations_event ON registrations (event_id, created_at);
  `)

  const orderedKinds = ['events', 'resources']
  const orderedRows = (kind) => db.prepare('SELECT * FROM entries WHERE kind = ? ORDER BY position, created_at, id').all(kind)
  function transaction(action) {
    db.exec('BEGIN IMMEDIATE')
    try {
      const result = action()
      db.exec('COMMIT')
      return result
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
  function reorder(kind, ids) {
    const update = db.prepare('UPDATE entries SET position = ? WHERE kind = ? AND id = ? AND position != ?')
    ids.forEach((id, index) => update.run(index + 1, kind, id, index + 1))
  }

  // Conserva el orden anterior (incluidos ceros y empates), sin tocar contenido ni inscripciones.
  transaction(() => {
    if (db.prepare('PRAGMA user_version').get().user_version < 1) {
      for (const kind of orderedKinds) reorder(kind, orderedRows(kind).map((row) => row.id))
      db.exec('PRAGMA user_version = 1')
    }
  })

  const parse = (row) => ({ ...JSON.parse(row.data), id: row.id, position: row.position, updatedAt: row.updated_at })

  return {
    raw: db,
    close: () => db.close(),
    list(kind) {
      return orderedRows(kind).map(parse)
    },
    get(kind, id) {
      const row = db.prepare('SELECT * FROM entries WHERE kind = ? AND id = ?').get(kind, id)
      return row ? parse(row) : null
    },
    upsert(kind, id, data) {
      return transaction(() => {
        const { position, ...rest } = data
        const ordered = orderedKinds.includes(kind)
        const rows = ordered ? orderedRows(kind) : []
        const ids = rows.filter((row) => row.id !== id).map((row) => row.id)
        const requested = position ?? rows.find((row) => row.id === id)?.position ?? ids.length + 1
        if (ordered && (!Number.isInteger(requested) || requested < 1)) throw new RangeError('Orden debe empezar en 1.')
        const target = ordered ? Math.min(requested, ids.length + 1) : (position ?? 0)
        db.prepare(`
          INSERT INTO entries (kind, id, data, position) VALUES (?, ?, ?, ?)
          ON CONFLICT (kind, id) DO UPDATE SET data = excluded.data, position = excluded.position,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        `).run(kind, id, JSON.stringify(rest), target)
        if (ordered) {
          ids.splice(target - 1, 0, id)
          reorder(kind, ids)
        }
        return this.get(kind, id)
      })
    },
    remove(kind, id) {
      return transaction(() => {
        const removed = db.prepare('DELETE FROM entries WHERE kind = ? AND id = ?').run(kind, id).changes > 0
        if (removed && orderedKinds.includes(kind)) reorder(kind, orderedRows(kind).map((row) => row.id))
        return removed
      })
    },
    // Idempotente: el mismo id de inscripción (UUID del cliente) nunca crea dos filas.
    addRegistration(row) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO registrations (id, event_id, name, email, phone, church, consent_at)
        VALUES (:id, :eventId, :name, :email, :phone, :church, :consentAt)
      `).run(row)
      return result.changes > 0
    },
    registrations(eventId) {
      const sql = `SELECT id, event_id AS eventId, name, email, phone, church, created_at AS createdAt
        FROM registrations ${eventId ? 'WHERE event_id = ?' : ''} ORDER BY created_at DESC`
      return eventId ? db.prepare(sql).all(eventId) : db.prepare(sql).all()
    },
    removeRegistration(id) {
      return db.prepare('DELETE FROM registrations WHERE id = ?').run(id).changes > 0
    },
    registrationCounts() {
      return Object.fromEntries(db.prepare('SELECT event_id, COUNT(*) AS n FROM registrations GROUP BY event_id').all().map((r) => [r.event_id, r.n]))
    },
  }
}
