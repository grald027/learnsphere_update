import { put } from '@vercel/blob';
import busboy from 'busboy';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBuffer, fileName, fileType, moduleId } = await parseForm(req);

    if (!fileBuffer || !fileName || !moduleId) {
      return res.status(400).json({ error: 'Missing file or moduleId' });
    }

    const blobPath = `${moduleId}/${Date.now()}-${fileName}`;

    const blobResult = await put(blobPath, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: fileType || 'application/octet-stream',
    });

    return res.status(200).json({
      id: blobResult.url,
      name: fileName,
      size: `${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      type: fileType || fileName.split('.').pop(),
      uploadDate: new Date().toLocaleDateString(),
      url: blobResult.url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });

    const fileChunks = [];
    let fileName = null;
    let fileType = null;
    let moduleId = null;

    bb.on('file', (fieldName, stream, info) => {
      fileName = info.filename;
      fileType = info.mimeType;
      stream.on('data', (chunk) => fileChunks.push(chunk));
      stream.on('error', reject);
    });

    bb.on('field', (fieldName, value) => {
      if (fieldName === 'moduleId') moduleId = value;
    });

    bb.on('finish', () => {
      resolve({
        fileBuffer: fileChunks.length > 0 ? Buffer.concat(fileChunks) : null,
        fileName,
        fileType,
        moduleId,
      });
    });

    bb.on('error', reject);
    req.pipe(bb);
  });
}
