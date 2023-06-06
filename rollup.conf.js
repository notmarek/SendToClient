const path = require('path');
const { getRollupPlugins } = require('@gera2ld/plaid');
const sites = require('./sites.json');

const userscript = require('rollup-plugin-userscript');
const pkg = require('./package.json');
const env = process.env.NODE_ENV || 'development';

const DIST = 'dist';
const FILENAME = 'SendToClient';

const bundleOptions = {
  extend: true,
  esModule: false,
};
const postcssOptions = {
  ...require('@gera2ld/plaid/config/postcssrc'),
  inject: false,
  minimize: true,
};

const coolreplace = () => {
  return {
    name: 'coolreplace',

    buildStart() {},

    renderChunk(code, chunk) {
      return {
        code: code.replaceAll(/'sites\[(.*?)\]'/g, (match, site) =>
          JSON.stringify(sites[site])
        ),
      };
    },

    transform(code, id) {
      return {
        code: code.replaceAll(/'sites\[(.*?)\]'/g, (match, site) =>
          JSON.stringify(sites[site])
        ),
      };
    },
  };
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
        userscript(path.resolve('src/meta.js'), (meta) =>
          meta
            .replace('process.env.VERSION', pkg.version)
            .replace('process.env.AUTHOR', pkg.author)
            .replace(
              '// @match       STC.sites',
              (() => {
                let result = '';
                for (let type in sites) {
                  for (let site of sites[type]) {
                    result += `// @match       *://${site}/*\n`;
                  }
                }
                return result.replace(/\n$/, '');
              })()
            )
        ),
        coolreplace(),
      ],
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.user.js`,
      banner:
        env === 'development'
          ? `GM.registerMenuCommand('Built @ ${new Date()}', ()=>{});`
          : '',
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
