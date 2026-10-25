/**
 * 計算エンジン - 再帰下降パーサーによる四則演算
 * eval() は絶対に使用しない
 */

// 計算結果の型定義
export type CalculateSuccess = { expression: string; result: number };
export type CalculateError = { error: string };
export type CalculateResult = CalculateSuccess | CalculateError;

// 最大文字数制限
const MAX_EXPRESSION_LENGTH = 100;

// ホワイトリスト: 数字・演算子・小数点・スペースのみ許可
const VALID_EXPRESSION_PATTERN = /^[0-9+\-*/.\s]+$/;

/**
 * 入力バリデーション
 * ホワイトリスト方式で数字・演算子・小数点・スペースのみ許可する
 */
function validateExpression(expression: string): string | null {
  if (!expression || expression.trim().length === 0) {
    return "Empty expression";
  }

  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return `Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters`;
  }

  if (!VALID_EXPRESSION_PATTERN.test(expression)) {
    return "Invalid characters in expression";
  }

  return null;
}

/**
 * トークナイザー: 数式文字列をトークン列に分解する
 */
type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  const chars = expression.replace(/\s/g, "");
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];

    // 数値（整数・小数）の読み取り
    if (char >= "0" && char <= "9" || char === ".") {
      let numStr = "";
      let hasDot = false;

      while (i < chars.length && ((chars[i] >= "0" && chars[i] <= "9") || chars[i] === ".")) {
        if (chars[i] === ".") {
          if (hasDot) {
            throw new Error("Invalid number: multiple decimal points");
          }
          hasDot = true;
        }
        numStr += chars[i];
        i++;
      }

      const value = parseFloat(numStr);
      if (isNaN(value)) {
        throw new Error(`Invalid number: ${numStr}`);
      }
      tokens.push({ type: "number", value });
      continue;
    }

    // 演算子の読み取り
    if (char === "+" || char === "-" || char === "*" || char === "/") {
      tokens.push({ type: "operator", value: char });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
}

/**
 * 再帰下降パーサー
 *
 * 文法:
 *   expression = term (('+' | '-') term)*
 *   term       = factor (('*' | '/') factor)*
 *   factor     = NUMBER
 *
 * 演算子の優先順位: * / が + - より高い
 */
class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  /** 現在のトークンを取得する */
  private current(): Token | undefined {
    return this.tokens[this.pos];
  }

  /** 現在のトークンを消費して次に進む */
  private consume(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  /** 式全体をパースして評価する */
  parse(): number {
    if (this.tokens.length === 0) {
      throw new Error("Invalid expression");
    }

    const result = this.parseExpression();

    // 全トークンを消費したか確認
    if (this.pos < this.tokens.length) {
      throw new Error("Invalid expression: unexpected token");
    }

    return result;
  }

  /** 加算・減算レベルの式をパースする */
  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.current()?.type === "operator" &&
           (this.current()?.value === "+" || this.current()?.value === "-")) {
      const op = this.consume();
      const right = this.parseTerm();

      if (op.value === "+") {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  /** 乗算・除算レベルの式をパースする */
  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.current()?.type === "operator" &&
           (this.current()?.value === "*" || this.current()?.value === "/")) {
      const op = this.consume();
      const right = this.parseFactor();

      if (op.value === "*") {
        left = left * right;
      } else {
        // ゼロ除算チェック
        if (right === 0) {
          throw new Error("Division by zero");
        }
        left = left / right;
      }
    }

    return left;
  }

  /** 数値（因子）をパースする */
  private parseFactor(): number {
    const token = this.current();

    if (!token) {
      throw new Error("Invalid expression: unexpected end of input");
    }

    if (token.type === "number") {
      this.consume();
      return token.value;
    }

    throw new Error("Invalid expression: expected number");
  }
}

/**
 * 数式を計算する
 * ホワイトリスト方式のバリデーション → トークナイズ → パース・評価
 */
export function calculate(expression: string): CalculateResult {
  // 入力バリデーション
  const validationError = validateExpression(expression);
  if (validationError) {
    return { error: validationError };
  }

  try {
    // トークナイズ
    const tokens = tokenize(expression);

    // パースと評価
    const parser = new Parser(tokens);
    const result = parser.parse();

    return { expression, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Calculation error";
    return { error: message };
  }
}
