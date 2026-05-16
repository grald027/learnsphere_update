import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId } = req.query;
    
    const blobs = await list({
      prefix: moduleId || '',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      limit: 100,
    });
    
    const files = blobs.blobs.map(blob => ({
      id: blob.url,
      name: blob.pathname.split('/').pop() || blob.pathname,
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      type: blob.contentType || 'application/octet-stream',
      uploadDate: new Date(blob.uploadedAt).toLocaleDateString(),
      url: blob.url
    }));
    
    return res.status(200).json({ files });
    
  } catch (error) {
    console.error('List error:', error);
    return res.status(500).json({ error: 'List failed' });
  }
}
