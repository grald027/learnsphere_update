import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  try {
    const body = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
            'text/plain',
            'text/markdown',
            'image/jpeg',
            'image/png',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024,
          tokenPayload: clientPayload, // passes moduleId through
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload complete:', blob.url, 'moduleId:', tokenPayload);
      },
    });

    return res.status(200).json(body);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ error: error.message });
  }
}
