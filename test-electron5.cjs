async function test() {
  console.log('process.versions.electron:', process.versions.electron);
  try {
    const e = await import('electron');
    console.log('import electron type:', typeof e);
    console.log('import electron default:', typeof e.default);
    console.log('import electron app:', typeof e.app);
    console.log('import electron keys:', Object.keys(e).slice(0, 10));
  } catch(err) {
    console.log('import error:', err.message);
  }
}
test();
