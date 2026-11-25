export async function resizeLogo(file) {
  // Il limite 140000 coincide con le regole di firestore.
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (e) {
    throw new Error('Immagine non leggibile.');
  }

  const scale = Math.min(1, 200 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const qualities = [0.8, 0.6, 0.4];
  for (const quality of qualities) {
    const url = canvas.toDataURL('image/webp', quality);
    if (url.length <= 140000) {
      return url;
    }
  }

  throw new Error('Logo troppo grande: usa un\'immagine più semplice.');
}
