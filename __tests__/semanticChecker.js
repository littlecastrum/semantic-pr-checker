const semanticChecker = require("../lib/semanticChecker");

describe("semanticChecker", () => {
  let isSemanticMessage;

  describe("when using default configuration", () => {
    beforeAll(() => {
      isSemanticMessage = semanticChecker({
        usesTypes: false,
        usesScopes: true,
        commitStructure: ["scope", "subject", "feat"],
        validationRegex: /^([A-Z]+-?[0-9]*): ([A-Z]{1}[\w]+)(\s\[[\w]+\])?$/,
      });
    });
    it("should return true without type", () => {
      expect(isSemanticMessage("GTECH-3213: Something")).toBe(true);
    });
    it("should return true with type", () => {
      expect(isSemanticMessage("GTECH-3213: Something [feat]")).toBe(true);
    });
    it("should return false on lowercase scope", () => {
      expect(isSemanticMessage("GTECH-3213: non-semantic commit message")).toBe(
        false
      );
    });
    it("should return false on lowercase first letter of subject", () => {
      expect(isSemanticMessage("GTECH-3213: non-semantic commit message")).toBe(
        false
      );
    });
    it("should return false with withspace at the end", () => {
      expect(
        isSemanticMessage("GTECH-3213: non-semantic commit message ")
      ).toBe(false);
    });
    it("should return false with uppercase type", () => {
      expect(
        isSemanticMessage("GTECH-3213: non-semantic commit message [FEAT]")
      ).toBe(false);
    });
    it("should return false with character after the type", () => {
      expect(
        isSemanticMessage("GTECH-3213: non-semantic commit message [feat] test")
      ).toBe(false);
    });
    describe("when receiving an array of valid scopes", () => {
      it("should return true if it has a valid scope", () => {
        expect(isSemanticMessage("GTECH-3213: Something", ["GTECH"])).toBe(
          true
        );
      });
      it("should return false if it does not have a valid scope", () => {
        expect(isSemanticMessage("GTECH-3213: Something", ["TEST"])).toBe(
          false
        );
      });
    });
    it("should allow merge commits", () => {
      expect(isSemanticMessage("Merge branch 'master' into patch-1")).toBe(
        true
      );
    });
  });
});
