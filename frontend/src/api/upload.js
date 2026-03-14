import { apiClient } from './client';

export const requestUploadURL = (data) => apiClient.post('/v1/wash/admin/upload', data);
export const getFileURL = (key) => apiClient.get(`/v1/wash/admin/upload/${encodeURIComponent(key)}`);
export const deleteFile = (key) => apiClient.delete(`/v1/wash/admin/upload/${encodeURIComponent(key)}`);

export async function uploadFile(file, folder = 'general') {
  const { data } = await requestUploadURL({
    filename: file.name,
    content_type: file.type,
    folder,
    bucket: import.meta.env.VITE_R2_BUCKET || 'wash-uploads',
  });

  await fetch(data.upload_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  return data.key;
}
