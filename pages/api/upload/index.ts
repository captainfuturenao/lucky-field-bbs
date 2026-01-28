import { put } from '@vercel/blob';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { searchParams } = new URL(req.url as string, `http://${req.headers.host}`);
        const filename = searchParams.get('filename') || 'file';

        const blob = await put(filename, req, {
            access: 'public',
        });

        return res.status(200).json(blob);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Upload failed' });
    }
}
