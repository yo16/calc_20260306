import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = path.resolve(__dirname, "..");

describe("Project Setup", () => {
  const requiredDirectories = [
    "src/app/api/auth/login",
    "src/app/api/auth/signup",
    "src/app/api/auth/logout",
    "src/app/api/calculate",
    "src/app/login",
    "src/app/signup",
    "src/app/calculator",
    "src/components/calculator",
    "src/components/auth",
    "src/lib/auth",
    "src/lib/calculator",
    "src/lib/repositories",
    "src/types",
    "data",
    "tests/calculator",
    "tests/auth",
  ];

  describe("Directory structure", () => {
    test.each(requiredDirectories)(
      "directory '%s' exists",
      (dir) => {
        const fullPath = path.join(ROOT_DIR, dir);
        expect(fs.existsSync(fullPath)).toBe(true);
        expect(fs.statSync(fullPath).isDirectory()).toBe(true);
      }
    );
  });

  describe("package.json scripts", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf-8")
    );

    const requiredScripts = ["dev", "build", "lint", "test"];

    test.each(requiredScripts)(
      "script '%s' is defined",
      (script) => {
        expect(packageJson.scripts).toHaveProperty(script);
        expect(packageJson.scripts[script]).toBeTruthy();
      }
    );
  });

  describe("TypeScript configuration", () => {
    test("tsconfig.json exists", () => {
      const tsconfigPath = path.join(ROOT_DIR, "tsconfig.json");
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });
  });
});
