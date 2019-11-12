const path = require('path');

module.exports = {
    entry: './build/script.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

