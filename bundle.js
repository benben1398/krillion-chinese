const fs = require('fs');
const path = require('path');
const dir = __dirname;

const html = fs.readFileSync(path.join(dir, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'public', 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'public', 'app.js'), 'utf8');

// Replace external link with inlined style
let bundled = html.replace('<link rel="stylesheet" href="/style.css">', '<style>\n' + css + '\n</style>');
// Replace external script with inlined script
bundled = bundled.replace('<script src="/app.js"></script>', '<script>\n' + js + '\n</script>');

fs.writeFileSync(path.join(dir, 'index.html'), bundled, 'utf8');
fs.writeFileSync(path.join(dir, 'public', 'index.html'), bundled, 'utf8');
console.log('Successfully generated bundled multiplayer index.html! Size: ' + bundled.length);
