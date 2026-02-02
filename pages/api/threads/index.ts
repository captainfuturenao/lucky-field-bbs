import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // テーブル作成・カラム追加（自動リカバリ）
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS threads (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT DEFAULT '雑談',
          author_id TEXT,
          position INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
            // 既存テーブルへのカラム追加
            try { await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS author_id TEXT;`; } catch (e) { }
            try { await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '雑談';`; } catch (e) { }
            try { await sql`ALTER TABLE threads ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;`; } catch (e) { }

            await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
          name TEXT DEFAULT '名無しさん',
          content TEXT NOT NULL,
          author_id TEXT,
          attachment_url TEXT,
          attachment_name TEXT,
          attachment_type TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
            // 既存テーブルへのカラム追加
            try { await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id TEXT;`; } catch (e) { }
        } catch (e) {
            console.error('Table setup error:', e);
        }

        try {
            // スレッド一覧取得 (position昇順、その次に日付降順)
            const { rows: threads } = await sql`
        SELECT t.*, COUNT(p.id) as count 
        FROM threads t 
        LEFT JOIN posts p ON t.id = p.thread_id 
        GROUP BY t.id 
        ORDER BY t.position ASC, t.created_at DESC
      `;
            return res.status(200).json(threads);
        } catch (e) {
            console.error('Fetch threads error:', e);
            return res.status(500).json({ error: 'Failed to fetch threads' });
        }
    }

    if (req.method === 'POST') {
        const { title, category, author_id } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        try {
            // スレッド作成
            const { rows: threadRows } = await sql`
        INSERT INTO threads (title, category, author_id, position) VALUES (${title}, ${category || '雑談'}, ${author_id || null}, 0) RETURNING id
      `;
            const threadId = threadRows[0].id;

            // 最初の固定レス（必要なら）
            // await sql`
            //   INSERT INTO posts (thread_id, name, content, author_id) VALUES (${threadId}, 'Lucky Admin', 'Welcome to Lucky Field!', 'admin')
            // `;

            return res.status(201).json({ id: threadId });
        } catch (e) {
            console.error('Create thread error:', e);
            return res.status(500).json({ error: 'Failed to create thread' });
        }
    }

    if (req.method === 'PUT') {
        // 並び替えの保存
        const { threadIds } = req.body;
        if (!Array.isArray(threadIds)) return res.status(400).json({ error: 'threadIds array required' });

        try {
            // positionを一括更新（簡易的な実装）
            for (let i = 0; i < threadIds.length; i++) {
                await sql`UPDATE threads SET position = ${i} WHERE id = ${threadIds[i]}`;
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('Reorder threads error:', e);
            return res.status(500).json({ error: 'Failed to reorder threads' });
        }
    }
}
