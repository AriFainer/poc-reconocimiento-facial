const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack')

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        fallback: {
            extensions: ['.js', '.jsx'],
            child_process: false, // Use 'false' or 'empty'
            fs: false, // Similarly for 'fs' and other Node.js modules
            http: require.resolve("stream-http"),
            crypto:require.resolve("crypto-browserify"),
            os: require.resolve("os-browserify/browser"),
            path: require.resolve("path-browserify"),
            vm: require.resolve("vm-browserify"),
            stream: require.resolve("stream-browserify")
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            favicon: './public/favicon.ico',
            manifest: './public/manifest.json'

        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
};
