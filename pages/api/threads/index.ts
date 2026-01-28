import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // テーブル作成（初回のみ・自動リカバリ）
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS threads (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT DEFAULT '雑談',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
            await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          thread_id INTEGER REFERENCES threads(id),
          name TEXT DEFAULT '名無しさん',
          content TEXT NOT NULL,
          attachment_url TEXT,
          attachment_name TEXT,
          attachment_type TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
        } catch (e) {
            console.error('Table creation error:', e);
        }

        try {
            // スレッド一覧取得
            const { rows: threads } = await sql`
        SELECT t.*, COUNT(p.id) as count 
        FROM threads t 
        LEFT JOIN posts p ON t.id = p.thread_id 
        GROUP BY t.id 
        ORDER BY t.created_at DESC
      `;
            return res.status(200).json(threads);
        } catch (e) {
            console.error('Fetch threads error:', e);
            return res.status(500).json({ error: 'Failed to fetch threads' });
        }
    }

    if (req.method === 'POST') {
        const { title, category } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        try {
            // スレッド作成
            const { rows: threadRows } = await sql`
        INSERT INTO threads (title, category) VALUES (${title}, ${category || '雑談'}) RETURNING id
      `;
            const threadId = threadRows[0].id;

            // 最初のレス
            await sql`
        INSERT INTO posts (thread_id, name, content) VALUES (${threadId}, 'Lucky Admin', 'Welcome to Lucky Field!')
      `;

            return res.status(201).json({ id: threadId });
        } catch (e) {
            console.error('Create thread error:', e);
            return res.status(500).json({ error: 'Failed to create thread' });
        }
    }
}
