import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid ID' });

    if (req.method === 'GET') {
        try {
            const { rows: threads } = await sql`SELECT * FROM threads WHERE id = ${id}`;
            if (threads.length === 0) return res.status(404).json({ error: 'Thread not found' });
            const thread = threads[0];

            const { rows: posts } = await sql`SELECT * FROM posts WHERE thread_id = ${id} ORDER BY created_at ASC`;

            return res.status(200).json({ thread, posts });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    if (req.method === 'POST') {
        const { name, content, author_id, attachment_url, attachment_name, attachment_type } = req.body;
        if (!content && !attachment_url) return res.status(400).json({ error: 'Content or file required' });

        try {
            await sql`
        INSERT INTO posts (thread_id, name, content, author_id, attachment_url, attachment_name, attachment_type) 
        VALUES (${id}, ${name || 'Lucky Guest'}, ${content || ''}, ${author_id || null}, ${attachment_url || null}, ${attachment_name || null}, ${attachment_type || null})
      `;
            return res.status(201).json({ success: true });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Failed to post' });
        }
    }

    if (req.method === 'DELETE') {
        const { admin_key } = req.body || req.query;
        // シンプルな管理者チェック（環境変数があると良いが、なければデフォルト）
        const IS_ADMIN = admin_key === (process.env.ADMIN_KEY || 'lucky-admin-123');

        if (!IS_ADMIN) {
            return res.status(403).json({ error: 'Only admins can delete threads' });
        }

        try {
            // ON DELETE CASCADEを設定したので、threadsの削除だけでpostsも消えるはずだが明示的にも可能
            await sql`DELETE FROM posts WHERE thread_id = ${id}`;
            await sql`DELETE FROM threads WHERE id = ${id}`;
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Failed to delete' });
        }
    }
}
