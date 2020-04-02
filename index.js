const handlePullRequestChange = require('./lib/handle-pull-request-change');

function probotPlugin (robot) {
  robot.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize'
  ], handlePullRequestChange)
};

module.exports = probotPlugin;