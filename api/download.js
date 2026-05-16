export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    
    const headers = {
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${url.split('/').pop()}"`,
    };
    
    return new Response(blob, { headers });
    
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Download failed' });
  }
}
