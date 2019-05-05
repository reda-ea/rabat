const markdox = require('markdox');
const fs = require('fs');
const path = require('path');

fs.readdir(
    path.join(__dirname, '..', 'src'),
    (err, files) => !err && files.filter(
        file => file.endsWith('.js')
    ).forEach(
        file => markdox.process(path.join(__dirname, '..', 'src', file), {
            output: path.join(__dirname, file.replace(/js$/, 'md')),
            template: path.join(__dirname, 'template.md.ejs'),
        }, () => console.log(file, "processed"))
    )
);
