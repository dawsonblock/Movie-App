const Module = require('module');
console.log('has electron in builtins:', Module.builtinModules.includes('electron'));
console.log('builtinModules sample:', Module.builtinModules.slice(0, 10));
