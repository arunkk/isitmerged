import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const TTL_MS = 24 * 60 * 60 * 1000;

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'cache.db'));
db.pragma('journal_mode = WAL');
db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
        repo_path  TEXT PRIMARY KEY,
        scanned_at INTEGER NOT NULL,
        branches   TEXT NOT NULL
    )
`);

// Repos already re-scanned since this process started. Startup is a rescan
// trigger, so the first request per repo per process always hits git.
const revalidated = new Set();

function getScan(repoPath) {
    const row = db.prepare('SELECT scanned_at, branches FROM scans WHERE repo_path = ?').get(repoPath);
    if (!row) return null;
    return { scannedAt: row.scanned_at, branches: JSON.parse(row.branches) };
}

function saveScan(repoPath, branches) {
    db.prepare(`
        INSERT INTO scans (repo_path, scanned_at, branches) VALUES (?, ?, ?)
        ON CONFLICT(repo_path) DO UPDATE SET scanned_at = excluded.scanned_at, branches = excluded.branches
    `).run(repoPath, Date.now(), JSON.stringify(branches));
    revalidated.add(repoPath);
}

/**
 * Cached branches, or null when a fresh git scan is required: no cache yet,
 * cache older than 24h, or this repo has not been scanned since server start.
 */
function getFreshScan(repoPath) {
    if (!revalidated.has(repoPath)) return null;

    const cached = getScan(repoPath);
    if (!cached || Date.now() - cached.scannedAt > TTL_MS) return null;

    return cached;
}

/** Mark a branch deleted in the cache so the next cached read still shows it as gone. */
function markDeleted(repoPath, branchName) {
    const cached = getScan(repoPath);
    if (!cached) return;

    const branches = cached.branches.map((b) =>
        b.name === branchName ? { ...b, deleted: true } : b
    );
    db.prepare('UPDATE scans SET branches = ? WHERE repo_path = ?')
        .run(JSON.stringify(branches), repoPath);
}

export { getFreshScan, saveScan, markDeleted };
