const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/renderer/react/index.js',
  output: {
    path: path.resolve(__dirname, 'src/renderer/dist'),
    filename: 'bundle.js',
    publicPath: './dist/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      // Add alias for cleaner imports
      '@components': path.resolve(__dirname, 'src/renderer/react/components'),
      '@context': path.resolve(__dirname, 'src/renderer/react/context'),
      '@styles': path.resolve(__dirname, 'src/renderer/react/styles')
    }
  },
  devtool: 'source-map',
  target: 'electron-renderer'
}; 