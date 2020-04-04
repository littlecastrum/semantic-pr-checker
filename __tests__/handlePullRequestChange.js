const { Octokit } = require("@octokit/rest");
const https = require("https");
const { promisify } = require("util");
const nock = require("nock");
const yaml = require("js-yaml");
const { dedent } = require("../src/utils");
const handlePullRequestChange = require("../src/handlePullRequestChange");

https.get[promisify.custom] = function getAsync(options) {
  return new Promise((resolve, reject) => {
    https
      .get(options, (response) => {
        response.end = new Promise((resolve) => response.on("end", resolve));
        resolve(response);
      })
      .on("error", reject);
  });
};

nock.disableNetConnect();

describe("handlePullRequestChange", () => {
  it("should be a function", () => {
    expect(typeof handlePullRequestChange).toBe("function");
  });

  it("should return `failure` status if PR has no semantic commits and no semantic title", async () => {
    const context = buildContext();

    context.payload.pull_request.title = "do a thing";
    const expectedBody = {
      number: 123,
      state: "failure",
      target_url: "https://github.com/littlecastrum/semantic-pr-checker",
      description: "add a semantic commit AND PR title",
      context: "Semantic PR Checker",
    };

    const mock = nock("https://api.github.com")
      .get("/repos/sally/project-x/pulls?number=123")
      .reply(200, unsemanticCommits())
      .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
      .reply(200)
      .get("/repos/sally/project-x/contents/.github/semantic.yml")
      .reply(200, getConfigResponse());

    await handlePullRequestChange(context);
    expect(mock.isDone()).toBe(true);
  });

  describe("when using custom scopes", () => {
    it("should return `success` status if PR has semantic title with available scope", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Test title";
      const expectedBody = {
        number: 123,
        state: "success",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "ready to be squashed",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: TITLE
					scopes:
						- NOJIRA
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has semantic title with invalid scope", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "SOMETHING: Test a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: TITLE
					scopes:
						- NOJIRA
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has semantic commit with invalid scope", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Test a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "make sure every commit is semantic",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommitsWithBadScope())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: COMMITS
					scopes:
						- NOJIRA
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `success` status if PR has semantic title with available scope", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Test a thing";
      const expectedBody = {
        number: 123,
        state: "success",
        description: "ready to be squashed",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: TITLE
					scopes:
						- NOJIRA
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });
  });

  describe("when using custom types", () => {
    it("should return `success` status if PR has semantic title with available types", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "TEST: Test title [feat]";
      const expectedBody = {
        number: 123,
        state: "success",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "ready to be squashed",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: TITLE
					types:
						- feat
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has semantic title with invalid type", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "SOMETHING: Test a thing [test]";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: TITLE
					types:
						- feat
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `success` status if PR has semantic commits with available type", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Test a thing [feat]";
      const expectedBody = {
        number: 123,
        state: "success",
        description: "ready to be merged or rebased",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: COMMITS
					types:
						- feat
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has semantic commits with invalid type", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "SOMETHING: Test a thing [feat]";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "make sure every commit is semantic",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommitsWithBadType())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(
          200,
          getConfigResponse(dedent`
					checkTarget: COMMITS
					types:
						- feat
				`)
        );

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });
  });

  describe("when `checkTarget` is set to `COMMITS` in config", () => {
    it("should return `failure` status if PR has no semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "make sure every commit is semantic",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, unsemanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: COMMITS"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has no semantic commits but has a semantic title", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Test a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "make sure every commit is semantic",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, unsemanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: COMMITS"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if one or commits are not well formed", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "make sure every commit is semantic",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, [...unsemanticCommits(), ...semanticCommits()])
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: COMMITS"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `success` status if PR has semantic commits but has no semantic title", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "bananas";
      const expectedBody = {
        number: 123,
        state: "success",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "ready to be merged or rebased",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: COMMITS"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });
  });

  describe("when `checkTarget` is set to `TITLE` in config", () => {
    it("should return `failure` status if PR has no semantic PR title", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, unsemanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: TITLE"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has no semantic PR title but has semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: TITLE"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `success` status if PR has semantic PR title but no semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "NOJIRA: Try a thing";
      const expectedBody = {
        number: 123,
        state: "success",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "ready to be squashed",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, unsemanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: TITLE"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });
  });

  describe("when `checkTarget` is set to `ALL` in config", () => {
    it("should return `failure` status if PR has no semantic PR title and no semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic commit AND PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, unsemanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: ALL"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `failure` status if PR has no semantic PR title but has semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "do a thing";
      const expectedBody = {
        number: 123,
        state: "failure",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "add a semantic commit AND PR title",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: ALL"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });

    it("should return `success` status if PR has a semantic PR title and semantic commits", async () => {
      const context = buildContext();

      context.payload.pull_request.title = "TEST: Test a thing";
      const expectedBody = {
        number: 123,
        state: "success",
        target_url: "https://github.com/littlecastrum/semantic-pr-checker",
        description: "ready to be merged, squashed or rebased",
        context: "Semantic PR Checker",
      };

      const mock = nock("https://api.github.com")
        .get("/repos/sally/project-x/pulls?number=123")
        .reply(200, semanticCommits())
        .post("/repos/sally/project-x/statuses/abcdefg", expectedBody)
        .reply(200)
        .get("/repos/sally/project-x/contents/.github/semantic.yml")
        .reply(200, getConfigResponse("checkTarget: ALL"));

      await handlePullRequestChange(context);
      expect(mock.isDone()).toBe(true);
    });
  });
});

function unsemanticCommits() {
  return [
    { commit: { message: "fix something" } },
    { commit: { message: "fix something else" } },
  ];
}

function semanticCommits() {
  return [
    { commit: { message: "NOJIRA: Something [feat]" } },
    { commit: { message: "NOJIRA: Something [feat]" } },
    { commit: { message: "NOJIRA: Something [feat]" } },
  ];
}

function semanticCommitsWithBadScope() {
  return [
    { commit: { message: "TEST: Something" } },
    { commit: { message: "TEST: Something else" } },
    { commit: { message: "TEST: Something [feat]" } },
  ];
}

function semanticCommitsWithBadType() {
  return [
    { commit: { message: "TEST: Something [test]" } },
    { commit: { message: "TEST: Something [test]" } },
    { commit: { message: "TEST: Something [test]" } },
  ];
}

function buildContext(overrides) {
  const github = new Octokit();
  const repoStructure = {
    owner: "sally",
    repo: "project-x",
  };
  const defaults = {
    log: () => {
      /* no-op */
    },
    github,
    repo: (obj = {}) => {
      return Object.assign(repoStructure, obj);
    },
    config: async (fileName, defaultConfig) => {
      const get = promisify(https.get);

      try {
        const response = await get(
          `https://api.github.com/repos/sally/project-x/contents/.github/${fileName}`
        );

        let body = "";

        response.on("data", (chunk) => (body += chunk));
        await response.end;
        const { content } = JSON.parse(body);
        const config = yaml.safeLoad(Buffer.from(content, "base64").toString());

        return {
          ...defaultConfig,
          ...config,
        };
      } catch (e) {
        console.log(e);
      }
    },
    payload: {
      pull_request: {
        number: 123,
        title: "do a thing",
        head: {
          sha: "abcdefg",
        },
      },
    },
  };

  return Object.assign({}, defaults, overrides);
}

function getConfigResponse(content = "") {
  return { content: Buffer.from(content).toString("base64") };
}
