'use strict';

var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var GenerateJsonPlugin = require('./webpack-plugin-generate-json.js');
const NODE_ENV = process.env.NODE_ENV || 'production'; //development or production

var _load = function() {
    var webpackConfig = {
        entry: {
            'pc/app': [
                './client/pc/app/index'
            ],
            'pc/account': [
                './client/pc/account/account'
            ]
        },
        output: {
            filename: './[name].bundle.js',
            publicPath: '/',
            path: path.resolve(__dirname, 'dist')
        },
        module: {
            loaders: [{
                test: /\.js$/,
                exclude: [/app\/lib/, /node_modules/, /json-schema-faker\.min/],
                loader: 'ng-annotate!babel?presets[]=es2015'
            }, {
                test: /\.html$/,
                loader: 'raw'
            }, {
                test: /\.css$/,
                loader: 'style!css'
            }, {
                test: /\.(png|jpg|gif|woff2|woff|svg|eot|ttf|otf)/,
                loader: 'url?limit=1000&context=client&name=[path][name].[hash:8].[ext]',
                exclude: [/node_modules/]
            }]
        },
        resolve: {
            extensions: ['', '.js'],
            root: [
                process.cwd(),
                path.join(process.cwd(), 'node_modules'),
                path.join(process.cwd(), 'client/pc/vendor')
            ]
        },
        plugins: [
            new webpack.NoErrorsPlugin(),
            new HtmlWebpackPlugin({
                chunks: ['pc/account', 'pc/common'],
                filename: 'pc/account.html',
                template: 'client/pc/account.html',
                inject: 'body',
                hash: true
            }),
            new HtmlWebpackPlugin({
                chunks: ['pc/app', 'pc/common'],
                filename: 'pc/index.html',
                template: 'client/pc/index.html',
                inject: 'body',
                hash: true
            }),
            new GenerateJsonPlugin('pc/config.json', gernerateJson, path.resolve('./client/pc/config/config.json')),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery",
                "window.jQuery": "jquery"
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: 'pc/common'
            }),
            new CopyWebpackPlugin([
                // {from: __dirname + '/client/pc/config.json', to: 'pc'},
                {from: __dirname + '/client/pc/favicon.ico', to: 'pc'},
                {from: __dirname + '/client/pc/app/assets/geos', to: 'pc/app/assets/geos'}
            ])
        ]
    };
    var developmentConfig = {
        watch: true,
        watchOptions: {
            aggregateTimeout: 100
        },
        debug: true,
        devtool: 'cheap-source-map',
        devServer: {
            contentBase: __dirname + '/client',
            host: 'localhost',
            port: 8080,
            hot: true,
            info: true,
            inline: true,
            historyApiFallback: {
                index: '/pc/'
            }
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ]
    };
    var productionConfig = {
        debug: false,
        output: {
            filename: '[name].[chunkhash].js'
        },
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                exclude: /app.*\.js|common.*\.js|account.*\.js/i, //app.*.js由于存在隐藏式的注入导致代码混淆有问题，故暂时排查
                compress: {
                    warnings: false,
                    drop_console: true,
                    unsafe: true,
                },
                mangle: {
                    // You can specify all variables that should not be mangled.
                    // For example if your vendor dependency doesn't use modules
                    // and relies on global variables. Most of angular modules relies on
                    // angular global variable, so we should keep it unchanged
                    except: ['$super', '$', 'exports', 'require', 'angular']
                }
            }),
            new CleanWebpackPlugin(['dist'], {
                root: __dirname,
                verbose: true,
                dry: false
            })
        ]
    };
    function gernerateJson(path) {
        var json = requireNotByCache(path), newConfig,
            businessforms = json['BusinessForms'] || [],
            parentPath = path.slice(0, path.lastIndexOf('\\') + 1), watchList = [path];
        businessforms.forEach(function (item) {
            var key = item.id + '_Pages', itemPath = parentPath + 'config-' + item.id + '.json';
            newConfig = requireNotByCache(itemPath) || {};
            json[key] = newConfig;
            watchList.push(itemPath);
        });
        function requireNotByCache(path) {
            var result = {};
            delete require.cache[require.resolve(path)];
            try {
                result = require(path);
            } catch(e) {
                console.log('\x1b[33m' + 'The JSON file is not validated : ' + path);
                result = {};
            }
            return result;
        }
        return {
            json,
            watchList
        };
    }
    function customizer(objValue, srcValue) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }
    if (NODE_ENV == 'production') {
        webpackConfig = _.mergeWith(webpackConfig, productionConfig, customizer);
    } else { //development
        webpackConfig = _.mergeWith(webpackConfig, developmentConfig, customizer);
        webpackConfig.entry['pc/app'].push('webpack/hot/dev-server')
        webpackConfig.entry['pc/account'].push('webpack/hot/dev-server');
    }
    console.log('Current Environment: ', NODE_ENV);
    return webpackConfig;
};

module.exports = _load();
