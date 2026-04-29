async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/site-sections');
    const data = await res.json();
    const sonaton = data.find(r => r.section_key === 'sonatonPackages')?.content || [];
    const muslim = data.find(r => r.section_key === 'muslimPackages')?.content || [];
    console.log('Sonaton Packages:', JSON.stringify(sonaton, null, 2));
    console.log('Muslim Packages:', JSON.stringify(muslim, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
