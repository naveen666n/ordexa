import client from '../client';

const upload = (file) => {
  const fd = new FormData();
  fd.append('image', file);
  return client.post('/admin/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default { upload };
