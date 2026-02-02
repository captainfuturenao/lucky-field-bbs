import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid ID' });

    if (req.method === 'PUT') {
        const { content, author_id } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        try {
            const { rows } = await sql`SELECT author_id FROM posts WHERE id = ${id}`;
            if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });

            if (rows[0].author_id !== author_id) {
                return res.status(403).json({ error: 'Not authorized to edit this post' });
            }

            await sql`UPDATE posts SET content = ${content} WHERE id = ${id}`;
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Failed to update post' });
        }
    }

    if (req.method === 'DELETE') {
        const { author_id } = req.body || req.query;

        try {
            const { rows } = await sql`SELECT author_id FROM posts WHERE id = ${id}`;
            if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });

            if (rows[0].author_id !== author_id) {
                return res.status(403).json({ error: 'Not authorized to delete this post' });
            }

            await sql`DELETE FROM posts WHERE id = ${id}`;
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Failed to delete post' });
        }
    }
}
