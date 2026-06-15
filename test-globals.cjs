console.log('global.electron:', typeof global.electron);
console.log('global.BrowserWindow:', typeof global.BrowserWindow);
console.log('process.electronBinding:', typeof process.electronBinding);
console.log('process.electronBinding names:', typeof process.electronBinding === 'function' ? Object.keys(process.electronBinding('common')).slice(0, 10) : 'N/A');
