const withCSS = require("@zeit/next-css");

module.exports = {
  // @note: plugins (css-modules...):
  ...withCSS({
    cssModules: true
  }),
  // @note: config:
  publicRuntimeConfig: {
    staticFolder: "/static"
  }
};
