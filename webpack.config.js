/**
 * webpack config for compiling shoud's client-side app script.
 */


var
path = require('path'),
webpack = require('webpack');

var modulesDirectories = ["node_modules", "client/components"];

module.exports = {

    colors: true,

    entry: "./client/app.js",

    output: {
        path: "./public/js/",
        filename: "app.js"
    },

    watch: true,
    watchDelay: 500,

    resolve: {

        root: __dirname + "/client/",

        modulesDirectories: modulesDirectories,

        alias: {
            jquery: 'jquery.js'
        }
    },

    module: {

        postLoaders: [
            {
                test: /\.(js)$/,
                exclude: modulesDirectories.map(function(x) {
                    return new RegExp(x);
                }),
                loader: "jshint-loader"
            }
        ]
    },

    jshint: {
        reporter: require('./webpack/jshint-loader-reporter')
    },
    // not needed?
    // devtool: 'source-map',

    plugins: [
        // strip out all comments since it's a minified build.
        // that means removing any and all copyright notices.
        // new webpack.optimize.UglifyJsPlugin({ output: {comments: false} }),

        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            Handlebars: "handlebars"
        })

    ]
};
