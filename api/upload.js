import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

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
    // Parse the multipart form data properly
    const form = formidable({ maxFileSize: 100 * 1024 * 1024 });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // formidable v3+ returns arrays for all fields
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const moduleId = Array.isArray(fields.moduleId) ? fields.moduleId[0] : fields.moduleId;

    if (!file || !moduleId) {
      return res.status(400).json({ error: 'Missing file or moduleId' });
    }

    // Read file as a proper binary buffer (no corruption)
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = file.originalFilename || 'upload';
    const fileType = file.mimetype || 'application/octet-stream';

    const timestamp = Date.now();
    const blobPath = `${moduleId}/${timestamp}-${fileName}`;

    const blobResult = await put(blobPath, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: fileType,
    });

    return res.status(200).json({
      id: blobResult.url,
      name: fileName,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: fileType,
      uploadDate: new Date().toLocaleDateString(),
      url: blobResult.url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}
