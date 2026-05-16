import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const blob = await req.body;
    
    // Parse multipart form data
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Parse the multipart data to get file and moduleId
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString().split(`--${boundary}`);
    
    let fileData = null;
    let fileName = null;
    let fileType = null;
    let moduleId = null;
    
    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        if (part.includes('name="file"')) {
          const nameMatch = part.match(/filename="(.+?)"/);
          if (nameMatch) fileName = nameMatch[1];
          const contentTypeMatch = part.match(/Content-Type:\s*(.+?)\r\n/);
          if (contentTypeMatch) fileType = contentTypeMatch[1];
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          const fileContent = part.substring(dataStart, dataEnd);
          fileData = Buffer.from(fileContent, 'binary');
        }
        if (part.includes('name="moduleId"')) {
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          moduleId = part.substring(dataStart, dataEnd).trim();
        }
      }
    }
    
    if (!fileData || !fileName || !moduleId) {
      return res.status(400).json({ error: 'Missing file or moduleId' });
    }
    
    const timestamp = Date.now();
    const blobPath = `${moduleId}/${timestamp}-${fileName}`;
    
    const blobResult = await put(blobPath, fileData, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: fileType || 'application/octet-stream',
    });
    
    return res.status(200).json({
      id: blobResult.url,
      name: fileName,
      size: `${(fileData.length / 1024 / 1024).toFixed(2)} MB`,
      type: fileType || fileName.split('.').pop(),
      uploadDate: new Date().toLocaleDateString(),
      url: blobResult.url
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}
