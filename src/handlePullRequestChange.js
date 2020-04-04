const semanticChecker = require("./semanticChecker");
const { CHECK_TARGETS, DEFAULT_OPTS } = require("./constants");

async function commitsAreSemantic(context, scopes, types, isSemanticMessage) {
  const { data: commits } = await context.github.pulls.list(
    context.repo({
      number: context.payload.pull_request.number,
    })
  );

  return commits
    .map(({ commit }) => commit)
    .every(({ message }) => isSemanticMessage(message, scopes, types));
}

async function handlePullRequestChange(context) {
  const { title, head } = context.payload.pull_request;
  const {
    checkTarget,
    commitStructure,
    validationRegex,
    scopes,
    types,
  } = await context.config("semantic.yml", DEFAULT_OPTS);

  const isSemanticMessage = semanticChecker({
    commitStructure,
    validationRegex,
  });
  const hasSemanticTitle = isSemanticMessage(title, scopes, types);
  const hasSemanticCommits = await commitsAreSemantic(
    context,
    scopes,
    types,
    isSemanticMessage
  );

  const isSemantic = (() => {
    switch (checkTarget) {
      case CHECK_TARGETS.title:
        return hasSemanticTitle;
      case CHECK_TARGETS.commits:
        return hasSemanticCommits;
      case CHECK_TARGETS.all:
        return hasSemanticTitle && hasSemanticCommits;
      default:
        return hasSemanticTitle || hasSemanticCommits;
    }
  })();

  const state = isSemantic ? "success" : "failure";

  function getDescription() {
    if (checkTarget === CHECK_TARGETS.all) {
      return isSemantic
        ? "ready to be merged, squashed or rebased"
        : "add a semantic commit AND PR title";
    }
    if (hasSemanticTitle && checkTarget !== CHECK_TARGETS.commits) {
      return "ready to be squashed";
    }
    if (hasSemanticCommits && checkTarget !== CHECK_TARGETS.title) {
      return "ready to be merged or rebased";
    }
    if (checkTarget === CHECK_TARGETS.title) {
      return "add a semantic PR title";
    }
    if (checkTarget === CHECK_TARGETS.commits) {
      return "make sure every commit is semantic";
    }

    return "add a semantic commit OR PR title";
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

module.exports = handlePullRequestChange;
