import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    require('./functions/index.js');
    console.log("Syntax OK");
} catch (e) {
    console.error(e);
    process.exit(1);
}
