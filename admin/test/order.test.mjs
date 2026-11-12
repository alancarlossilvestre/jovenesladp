import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import { openDb } from '../src/db.mjs'

for (const kind of ['events', 'resources']) {
  test(`${kind}: insertar, mover y borrar mantiene posiciones consecutivas desde 1`, (t) => {
    const db = openDb(':memory:')
    t.after(() => db.close())
    for (const id of ['uno', 'dos', 'tres']) db.upsert(kind, id, { title: id })
    const sequence = () => db.list(kind).map((row) => [row.id, row.position])
    assert.deepEqual(sequence(), [['uno', 1], ['dos', 2], ['tres', 3]])
    db.upsert(kind, 'tres', { title: 'Movido', position: 1 })
    assert.deepEqual(sequence(), [['tres', 1], ['uno', 2], ['dos', 3]])
    db.upsert(kind, 'nuevo', { title: 'Nuevo', position: 2 })
    assert.deepEqual(sequence(), [['tres', 1], ['nuevo', 2], ['uno', 3], ['dos', 4]])
    db.upsert(kind, 'nuevo', { title: 'Solo texto' })
    assert.equal(db.get(kind, 'nuevo').position, 2)
    db.upsert(kind, 'tres', { title: 'Al final', position: 9999 })
    assert.deepEqual(sequence(), [['nuevo', 1], ['uno', 2], ['dos', 3], ['tres', 4]])
    db.remove(kind, 'uno')
    assert.deepEqual(sequence(), [['nuevo', 1], ['dos', 2], ['tres', 3]])
    assert.throws(() => db.upsert(kind, 'invalido', { position: 0 }), RangeError)
    assert.equal(db.get(kind, 'invalido'), null)
  })
}

test('migracion: preserva contenido, orden relativo y datos al reabrir la base', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'mnj-order-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const path = join(directory, 'old.db')
  const legacy = new DatabaseSync(path)
  legacy.exec(`CREATE TABLE entries (
    kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT '2026-01-01', updated_at TEXT NOT NULL DEFAULT '2026-01-01',
    PRIMARY KEY (kind, id)
  )`)
  const insert = legacy.prepare('INSERT INTO entries (kind, id, data, position) VALUES (?, ?, ?, ?)')
  insert.run('events', 'a', '{"title":"No cambiar"}', 0)
  insert.run('events', 'b', '{"title":"Empatado"}', 0)
  insert.run('events', 'c', '{"title":"Tercero"}', 8)
  insert.run('resources', 'recurso', '{"title":"Material"}', 0)
  insert.run('hero', 'main', '{"description":"Mi hero"}', 0)
  legacy.close()

  let db = openDb(path)
  try {
    assert.deepEqual(db.list('events').map((row) => [row.id, row.position]), [['a', 1], ['b', 2], ['c', 3]])
    assert.equal(db.get('events', 'a').title, 'No cambiar')
    assert.equal(db.get('events', 'a').updatedAt, '2026-01-01')
    assert.equal(db.get('resources', 'recurso').position, 1)
    assert.equal(db.get('hero', 'main').description, 'Mi hero')
    db.addRegistration({ id: 'existing', eventId: 'a', name: 'Demo', email: 'demo@example.test', phone: '', church: '', consentAt: '2026-01-01' })
    db.upsert('events', 'c', { title: 'Tercero', position: 1 })
    db.close()
    db = openDb(path)
    assert.deepEqual(db.list('events').map((row) => [row.id, row.position]), [['c', 1], ['a', 2], ['b', 3]])
    assert.equal(db.registrations().length, 1)
  } finally {
    db.close()
  }
})
