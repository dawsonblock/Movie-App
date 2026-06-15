console.log('process.versions.electron:', process.versions.electron);
console.log('process._linkedBinding electron:', typeof process._linkedBinding('electron_common'));
console.log('global.electron:', typeof global.electron);
try {
  const native = process._linkedBinding('electron_common');
  console.log('native keys:', Object.keys(native).slice(0, 10));
} catch(e) {
  console.log('native error:', e.message);
}
