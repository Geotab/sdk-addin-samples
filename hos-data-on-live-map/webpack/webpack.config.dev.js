const Path = require('path');
const Webpack = require('webpack');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  entry: './.dev/index.js',
  mode: 'development',
  devtool: 'eval-cheap-source-map',
  output: {
    chunkFilename: 'js/[name].chunk.js',
  },
  devServer: {
    inline: true,
    hot: true,
  },
  plugins: [
    new Webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].js',
      chunkFilename: '[id].[chunkhash].js'
    }),
  ],
  devServer: {
      contentBase: Path.join(__dirname),
      disableHostCheck: true,
      compress: true,
      port: 8080,
      index: 'index.html'
  },
  module: {
    rules: [
      {
          enforce: 'pre',
          test: /\.js$/,
          exclude: [/node_modules/, /\.dev/],
          use: [
              {
                  loader: 'eslint-loader',
                  options: {
                  formatter: require('eslint/lib/cli-engine/formatters/stylish')
                  },
              },
          ],
      },
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
        },
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        loader: 'babel-loader',
      },
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
        }, {
          loader: 'postcss-loader'
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
      {
        test: /\.css/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      }
    ],
  },
});
