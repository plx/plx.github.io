import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

describe("ESLint configuration", () => {
  it("enforces Astro accessibility rules", async () => {
    const [result] = await eslint.lintText("<img src=\"/example.png\">", {
      filePath: "src/a11y-fixture.astro",
    });

    expect(result.messages.map((message) => message.ruleId)).toContain(
      "astro/jsx-a11y/alt-text",
    );
  });

  it("keeps no-undef enabled for JavaScript", async () => {
    const [result] = await eslint.lintText("console.log(undeclaredValue);", {
      filePath: "scripts/undef-fixture.js",
    });

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "no-undef" }),
      ]),
    );
  });
});
