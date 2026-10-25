import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    // CSS Modules をモックに置き換える
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // jose はESMモジュールのため、ts-jest で変換する
  transformIgnorePatterns: ["/node_modules/(?!jose)"],
};

export default config;
