const { copy } = require('esbuild-plugin-copy');

let myPlugin = copy({
  // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
  // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
  resolveFrom: 'out',
  assets: {
    from: ['./node_modules/.prisma/client/schema.prisma', './node_modules/.prisma/client/libquery_engine-rhel*'],
    to: ['.'],
  },
  watch: true,
});

module.exports = [myPlugin];
