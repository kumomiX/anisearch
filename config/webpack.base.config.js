const path = require('path')
const {
  CheckerPlugin,
  TsConfigPathsPlugin,
} = require('awesome-typescript-loader')

module.exports = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsConfigPathsPlugin()],
  },
  plugins: [new CheckerPlugin()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'awesome-typescript-loader',
          options: {
            useBabel: true,
            babelCore: '@babel/core',
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
}
