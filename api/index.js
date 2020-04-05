const { toLambda } = require("probot-serverless-now");
const appFn = require("../app");

module.exports = toLambda(appFn);
