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
        index: 'my_project.html',
        openPage: 'my_project.html',
        open: true
    }
};

module.exports = config;
