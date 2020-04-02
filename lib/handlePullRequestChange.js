module.exports = handlePullRequestChange;

const isSemanticMessage = require("./isSemanticMessage");
const getConfig = require("probot-config");

const DEFAULT_OPTS = {
  titleOnly: false,
  commitsOnly: false,
  titleAndCommits: false,
  anyCommit: false,
  scopes: null,
};

async function commitsAreSemantic(context, scopes) {
  const { data: commits } = await context.github.pullRequests.getCommits(
    context.repo({
      number: context.payload.pull_request.number,
    })
  );

  return commits
    .map(({ commit }) => commit)
    .every(({ message }) => isSemanticMessage(message, scopes));
}

async function handlePullRequestChange(context) {
  const { title, head } = context.payload.pull_request;
  const {
    titleOnly,
    commitsOnly,
    titleAndCommits,
    anyCommit,
    scopes,
  } = await getConfig(context, "semantic.yml", DEFAULT_OPTS);
  const hasSemanticTitle = isSemanticMessage(title, scopes);
  const hasSemanticCommits = await commitsAreSemantic(
    context,
    scopes,
    (commitsOnly || titleAndCommits) && !anyCommit
  );

  let isSemantic;

  if (titleOnly) {
    isSemantic = hasSemanticTitle;
  } else if (commitsOnly) {
    isSemantic = hasSemanticCommits;
  } else if (titleAndCommits) {
    isSemantic = hasSemanticTitle && hasSemanticCommits;
  } else {
    isSemantic = hasSemanticTitle || hasSemanticCommits;
  }

  const state = isSemantic ? "success" : "failure";

  function getDescription() {
    if (isSemantic && titleAndCommits)
      return "ready to be merged, squashed or rebased";
    if (!isSemantic && titleAndCommits)
      return "add a semantic commit AND PR title";
    if (hasSemanticTitle && !commitsOnly) return "ready to be squashed";
    if (hasSemanticCommits && !titleOnly)
      return "ready to be merged or rebased";
    if (titleOnly) return "add a semantic PR title";
    if (commitsOnly && anyCommit) return "add a semantic commit";
    if (commitsOnly) return "make sure every commit is semantic";

    return "add a semantic commit or PR title";
  }

  const status = {
    sha: head.sha,
    state,
    target_url: "https://github.com/littlecastrum/semantic-pr-checker",
    description: getDescription(),
    context: "Semantic PR Checker",
  };
  const result = await context.github.repos.createStatus(context.repo(status));

  return result;
}
