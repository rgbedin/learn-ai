const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const { dotenvLoad } = require('dotenv-mono');

module.exports = function ({ dotenv, paths }) {
  const env = dotenvLoad();
  return env.env;
};
