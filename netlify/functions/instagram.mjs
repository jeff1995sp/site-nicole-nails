// Instagram Login: credentials exist only in Netlify environment variables.
export default async function handler(request) {
  const reply = (body, status = 200) => Response.json(body, {
    status, headers: { 'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store' }
  });
  if (request.method !== 'GET') return reply({ error: 'method_not_allowed' }, 405);
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const user = process.env.INSTAGRAM_USER_ID;
  const version = process.env.INSTAGRAM_API_VERSION || 'v27.0';
  if (!token || !user) return reply({ items: [], status: 'not_configured' }, 503);
  if (!/^\d+$/.test(user) || !/^v\d+\.\d+$/.test(version)) return reply({ items: [], status: 'invalid_configuration' }, 503);
  const url = new URL(`https://graph.instagram.com/${version}/${user}/media`);
  url.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,children{id,media_type,media_url,thumbnail_url}');
  url.searchParams.set('limit', '12');
  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) return reply({ items: [], status: 'instagram_unavailable' }, 502);
    const data = await upstream.json();
    if (!Array.isArray(data.data)) throw new Error('Invalid response');
    const items = [];
    for (const post of data.data) {
      const media = post.media_type === 'CAROUSEL_ALBUM' ? (post.children?.data || []) : [post];
      for (const entry of media) {
        // Send video URL only when Meta makes it available; gallery uses the thumbnail.
        const src = entry.media_type === 'VIDEO' ? entry.thumbnail_url : entry.media_url;
        if (typeof src !== 'string') continue;
        try { if (new URL(src).protocol !== 'https:') continue; } catch { continue; }
        const video = entry.media_type === 'VIDEO' && typeof entry.media_url === 'string' && entry.media_url.startsWith('https://') ? entry.media_url : null;
        items.push({ id: String(entry.id), url: src, video });
      }
    }
    return reply({ items: items.slice(0, 16) });
  } catch {
    return reply({ items: [], status: 'instagram_unavailable' }, 502);
  }
}
