const withPWA = require("next-pwa");
const withFonts = require("next-fonts");
const withImages = require("next-images");
const withPlugins = require("next-compose-plugins");

module.exports = withPlugins(
  [withPWA, withFonts, withImages],
  {
    env: {
      ENVIRONMENT: process.env.ENVIRONMENT,
    },
    projectRoot: __dirname,
    typescript: {
      ignoreBuildErrors: false,
    },
    inlineImageLimit: 0,
    experimental: {
      externalDir: true,
    },
    pwa: {
      dest: "public",
      disable: process.env.NODE_ENV !== "production",
    },
    webpack5: false,
  }
);
