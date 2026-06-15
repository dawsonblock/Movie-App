console.log('process.versions.electron:', process.versions.electron);
console.log('process.execPath:', process.execPath);
const e = require('electron');
console.log('typeof require(electron):', typeof e);
console.log('electron keys:', Object.keys(e).slice(0, 5));
