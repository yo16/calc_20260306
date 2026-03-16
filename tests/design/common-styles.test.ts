import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const SRC_DIR = path.join(ROOT_DIR, "src");

describe("Common Styles - Design System", () => {
  /* ============================================
     CSS変数の定義確認
     ============================================ */
  describe("CSS variables in globals.css", () => {
    const globalsPath = path.join(SRC_DIR, "app/globals.css");
    let globalsContent: string;

    beforeAll(() => {
      globalsContent = fs.readFileSync(globalsPath, "utf-8");
    });

    test("globals.css が存在すること", () => {
      expect(fs.existsSync(globalsPath)).toBe(true);
    });

    // カラーパレットのCSS変数が定義されていること
    test("プライマリカラー変数が定義されていること", () => {
      expect(globalsContent).toContain("--color-primary:");
      expect(globalsContent).toContain("--color-primary-hover:");
      expect(globalsContent).toContain("--color-primary-light:");
      expect(globalsContent).toContain("--color-primary-dark:");
    });

    // 背景色のCSS変数が定義されていること
    test("背景色変数が定義されていること", () => {
      expect(globalsContent).toContain("--color-bg:");
      expect(globalsContent).toContain("--color-bg-card:");
      expect(globalsContent).toContain("--color-bg-input:");
    });

    // テキスト色のCSS変数が定義されていること
    test("テキスト色変数が定義されていること", () => {
      expect(globalsContent).toContain("--color-text-primary:");
      expect(globalsContent).toContain("--color-text-secondary:");
      expect(globalsContent).toContain("--color-text-muted:");
      expect(globalsContent).toContain("--color-text-inverse:");
    });

    // ボーダー色のCSS変数が定義されていること
    test("ボーダー色変数が定義されていること", () => {
      expect(globalsContent).toContain("--color-border:");
      expect(globalsContent).toContain("--color-border-focus:");
    });

    // ステータスカラーのCSS変数が定義されていること
    test("エラー・成功色の変数が定義されていること", () => {
      expect(globalsContent).toContain("--color-error:");
      expect(globalsContent).toContain("--color-error-bg:");
      expect(globalsContent).toContain("--color-success:");
    });

    // タイポグラフィのCSS変数が定義されていること
    test("フォントサイズ変数が定義されていること", () => {
      expect(globalsContent).toContain("--font-size-sm:");
      expect(globalsContent).toContain("--font-size-base:");
      expect(globalsContent).toContain("--font-size-lg:");
      expect(globalsContent).toContain("--font-size-xl:");
    });

    // スペーシングのCSS変数が定義されていること
    test("スペーシング変数が定義されていること", () => {
      expect(globalsContent).toContain("--spacing-xs:");
      expect(globalsContent).toContain("--spacing-sm:");
      expect(globalsContent).toContain("--spacing-md:");
      expect(globalsContent).toContain("--spacing-lg:");
      expect(globalsContent).toContain("--spacing-xl:");
    });

    // 角丸のCSS変数が定義されていること
    test("角丸変数が定義されていること", () => {
      expect(globalsContent).toContain("--radius-sm:");
      expect(globalsContent).toContain("--radius-md:");
      expect(globalsContent).toContain("--radius-lg:");
    });

    // シャドウのCSS変数が定義されていること
    test("シャドウ変数が定義されていること", () => {
      expect(globalsContent).toContain("--shadow-sm:");
      expect(globalsContent).toContain("--shadow-md:");
      expect(globalsContent).toContain("--shadow-lg:");
    });

    // レイアウト変数が定義されていること
    test("レイアウト変数が定義されていること", () => {
      expect(globalsContent).toContain("--header-height:");
      expect(globalsContent).toContain("--footer-height:");
      expect(globalsContent).toContain("--content-max-width:");
    });
  });

  /* ============================================
     ダークモード対応の確認
     ============================================ */
  describe("Dark mode support", () => {
    let globalsContent: string;

    beforeAll(() => {
      const globalsPath = path.join(SRC_DIR, "app/globals.css");
      globalsContent = fs.readFileSync(globalsPath, "utf-8");
    });

    // prefers-color-schemeメディアクエリが存在すること
    test("prefers-color-scheme: dark メディアクエリが定義されていること", () => {
      expect(globalsContent).toContain("prefers-color-scheme: dark");
    });

    // ダークモードでCSS変数が再定義されていること
    test("ダークモードでカラー変数が再定義されていること", () => {
      // ダークモードのメディアクエリブロック内で変数が再定義されているか確認
      const darkModeMatch = globalsContent.match(
        /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\n\}/
      );
      expect(darkModeMatch).not.toBeNull();

      // ダークモードブロック内でカラー変数の再定義を確認
      const darkBlock = darkModeMatch![0];
      expect(darkBlock).toContain("--color-primary:");
      expect(darkBlock).toContain("--color-bg:");
      expect(darkBlock).toContain("--color-text-primary:");
    });
  });

  /* ============================================
     レイアウトファイルの構造確認
     ============================================ */
  describe("Layout structure", () => {
    const layoutPath = path.join(SRC_DIR, "app/layout.tsx");
    let layoutContent: string;

    beforeAll(() => {
      layoutContent = fs.readFileSync(layoutPath, "utf-8");
    });

    test("layout.tsx が存在すること", () => {
      expect(fs.existsSync(layoutPath)).toBe(true);
    });

    // ヘッダー要素が含まれていること
    test("header要素が含まれていること", () => {
      expect(layoutContent).toContain("<header");
    });

    // メインコンテンツ要素が含まれていること
    test("main要素が含まれていること", () => {
      expect(layoutContent).toContain("<main");
    });

    // フッター要素が含まれていること
    test("footer要素が含まれていること", () => {
      expect(layoutContent).toContain("<footer");
    });

    // アプリタイトルが表示されていること
    test("アプリタイトル 'CalcApp' が含まれていること", () => {
      expect(layoutContent).toContain("CalcApp");
    });

    // globals.cssがインポートされていること
    test("globals.css がインポートされていること", () => {
      expect(layoutContent).toContain("./globals.css");
    });

    // layout.module.cssがインポートされていること
    test("layout.module.css がインポートされていること", () => {
      expect(layoutContent).toContain("./layout.module.css");
    });

    // メタデータが適切に設定されていること
    test("メタデータの title が設定されていること", () => {
      expect(layoutContent).toContain("title:");
    });

    // html langが設定されていること
    test("html lang属性が設定されていること", () => {
      expect(layoutContent).toMatch(/lang=["'][a-z]{2}["']/);
    });
  });

  /* ============================================
     レイアウトモジュールCSSの確認
     ============================================ */
  describe("Layout module CSS", () => {
    const layoutCssPath = path.join(SRC_DIR, "app/layout.module.css");
    let layoutCssContent: string;

    beforeAll(() => {
      layoutCssContent = fs.readFileSync(layoutCssPath, "utf-8");
    });

    test("layout.module.css が存在すること", () => {
      expect(fs.existsSync(layoutCssPath)).toBe(true);
    });

    // ヘッダーのスタイルが定義されていること
    test("ヘッダーのスタイルが定義されていること", () => {
      expect(layoutCssContent).toContain(".header");
    });

    // メインコンテンツのスタイルが定義されていること
    test("メインコンテンツのスタイルが定義されていること", () => {
      expect(layoutCssContent).toContain(".main");
    });

    // フッターのスタイルが定義されていること
    test("フッターのスタイルが定義されていること", () => {
      expect(layoutCssContent).toContain(".footer");
    });

    // CSS変数が参照されていること（テーマ管理の確認）
    test("CSS変数を使用してスタイリングされていること", () => {
      expect(layoutCssContent).toContain("var(--");
    });
  });

  /* ============================================
     レスポンシブデザインの確認
     ============================================ */
  describe("Responsive design", () => {
    test("layout.module.css にレスポンシブ用メディアクエリがあること", () => {
      const layoutCssPath = path.join(SRC_DIR, "app/layout.module.css");
      const content = fs.readFileSync(layoutCssPath, "utf-8");
      // 768pxブレークポイントのメディアクエリがあること
      expect(content).toMatch(/@media\s*\(min-width:\s*768px\)/);
    });

    test("SignupForm.module.css にモバイル対応メディアクエリがあること", () => {
      const signupCssPath = path.join(
        SRC_DIR,
        "components/auth/SignupForm.module.css"
      );
      const content = fs.readFileSync(signupCssPath, "utf-8");
      expect(content).toMatch(/@media\s*\(max-width:\s*600px\)/);
    });
  });

  /* ============================================
     SignupForm.module.cssがCSS変数を使用していること
     ============================================ */
  describe("SignupForm styles use CSS variables", () => {
    const signupCssPath = path.join(
      SRC_DIR,
      "components/auth/SignupForm.module.css"
    );
    let signupContent: string;

    beforeAll(() => {
      signupContent = fs.readFileSync(signupCssPath, "utf-8");
    });

    // CSS変数でテーマカラーを使用していること
    test("プライマリカラー変数を参照していること", () => {
      expect(signupContent).toContain("var(--color-primary");
    });

    // テキスト色にCSS変数を使用していること
    test("テキスト色変数を参照していること", () => {
      expect(signupContent).toContain("var(--color-text-primary");
      expect(signupContent).toContain("var(--color-text-secondary");
    });

    // 背景色にCSS変数を使用していること
    test("背景色変数を参照していること", () => {
      expect(signupContent).toContain("var(--color-bg-card");
    });

    // ボーダー色にCSS変数を使用していること
    test("ボーダー色変数を参照していること", () => {
      expect(signupContent).toContain("var(--color-border");
    });

    // ハードコードされた色値ではなくCSS変数を使うことでダークモード対応
    test("ダークモード用の個別メディアクエリが不要であること（CSS変数で自動対応）", () => {
      // prefers-color-scheme: darkの個別メディアクエリがSignupForm内にないこと
      expect(signupContent).not.toContain("prefers-color-scheme: dark");
    });
  });

  /* ============================================
     異常系: スタイルが未適用でもコンテンツが読めること
     ============================================ */
  describe("Content readability without styles", () => {
    // SignupFormがセマンティックなHTMLを使用していること
    test("SignupForm がセマンティックなHTML要素を使用していること", () => {
      const signupPath = path.join(
        SRC_DIR,
        "components/auth/SignupForm.tsx"
      );
      const content = fs.readFileSync(signupPath, "utf-8");
      // form, label, input, buttonなどセマンティックな要素を使用していること
      expect(content).toContain("<form");
      expect(content).toContain("<label");
      expect(content).toContain("<input");
      expect(content).toContain("<button");
      expect(content).toContain("<h1");
    });

    // layout.tsxがセマンティックなHTML構造であること
    test("layout.tsx がセマンティックなHTML構造を使用していること", () => {
      const layoutPath = path.join(SRC_DIR, "app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain("<header");
      expect(content).toContain("<main");
      expect(content).toContain("<footer");
    });

    // フォーカスインジケーターが定義されていること（アクセシビリティ）
    test("フォーカスインジケーターが globals.css に定義されていること", () => {
      const globalsPath = path.join(SRC_DIR, "app/globals.css");
      const content = fs.readFileSync(globalsPath, "utf-8");
      expect(content).toContain(":focus-visible");
    });
  });
});
