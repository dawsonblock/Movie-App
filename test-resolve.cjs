try {
  console.log('resolve electron:', require.resolve('electron'));
} catch(e) {
  console.log('resolve error:', e.message);
}
