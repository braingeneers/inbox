module.exports = {
  entry: './app.js',
  devServer: {
    contentBase: __dirname,
    host: '0.0.0.0',
    port: 80,
    disableHostCheck: true,
  },
};
