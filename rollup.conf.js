const path = require('path');
const { getRollupPlugins } = require('@gera2ld/plaid');
const userscript = require('rollup-plugin-userscript');
const pkg = require('./package.json');

const DIST = 'dist';
const FILENAME = 'index';

const bundleOptions = {
  extend: true,
  esModule: false,
};
const postcssOptions = {
  ...require('@gera2ld/plaid/config/postcssrc'),
  inject: false,
  minimize: true,
};
const rollupConfig = [
  {
    input: {
      input: 'src/index.js',
      plugins: [
        ...getRollupPlugins({
          esm: true,
          minimize: false,
          postcss: postcssOptions,
        }),
        userscript(
          path.resolve('src/meta.js'),
          meta => meta
            .replace('process.env.VERSION', pkg.version)
            .replace('process.env.AUTHOR', pkg.author),
        ),
      ],
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.user.js`,
      ...bundleOptions,
    },
  },
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
  };
});

module.exports = rollupConfig.map(({ input, output }) => ({
  ...input,
  output,
}));
