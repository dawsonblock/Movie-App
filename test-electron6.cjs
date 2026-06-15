const e = require('electron');
console.log('typeof e:', typeof e);
console.log('e.app:', typeof e.app);
console.log('has app:', 'app' in e);
console.log('keys:', Object.keys(e).slice(0, 10));
process.exit(0);
