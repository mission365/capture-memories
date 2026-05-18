export function normalizeSupabaseStorageUrl(value) {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return '';
  }

  if (!rawValue.includes('/storage/v1/object/sign/')) {
    return rawValue;
  }

  const [baseUrl] = rawValue.split('?');
  return baseUrl.replace('/storage/v1/object/sign/', '/storage/v1/object/public/');
}

export function getUploadedStorageUrl(upload) {
  const publicUrl = normalizeSupabaseStorageUrl(upload?.publicUrl);

  if (publicUrl) {
    return publicUrl;
  }

  return normalizeSupabaseStorageUrl(upload?.signedUrl);
}
