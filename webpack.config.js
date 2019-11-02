const webpack = require('webpack');

const config = {
    entry: './my_project.js',
    output: {
        path: __dirname,
        filename: 'my_project.bundle.js'
    },
    devtool: 'source-map',
    module: {
    },
    plugins: [
    ],
    devServer: {
        index: 'index.html',
        openPage: 'index.html',
        open: true
    }
};

module.exports = config;
