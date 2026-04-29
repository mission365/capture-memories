async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/site-sections');
    const data = await res.json();
    const featuredAlbums = data.find(r => r.section_key === 'featuredAlbums')?.content || [];
    console.log('Featured Albums from DB:', JSON.stringify(featuredAlbums, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
