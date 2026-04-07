const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // Transpile ESM-only @blocknote packages through SWC so webpack can
  // process them rather than treating them as pre-built externals.
  transpilePackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/mantine",
    "@handlewithcare/prosemirror-inputrules",
  ],
  webpack: (config) => {
    // @handlewithcare/prosemirror-inputrules only has an "import" export
    // condition (no "require"), so webpack fails when @blocknote/core's CJS
    // bundle tries to require() it. Alias it directly to the ESM dist file
    // so webpack resolves it without going through the broken exports map.
    config.resolve.alias["@handlewithcare/prosemirror-inputrules"] = path.resolve(
      __dirname,
      "node_modules/@handlewithcare/prosemirror-inputrules/dist/index.js"
    );
    return config;
  },
};

module.exports = nextConfig;