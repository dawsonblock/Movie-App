const bindingNames = process._getActiveRequests || (() => []);
console.log('versions:', process.versions);
try {
  const electron = process._linkedBinding('electron');
  console.log('electron binding keys:', Object.keys(electron));
} catch(e) {
  console.log('electron binding error:', e.message);
}
try {
  const browserWindow = process._linkedBinding('browser_window');
  console.log('browser_window binding found');
} catch(e) {
  console.log('browser_window binding error:', e.message);
}
