import ts from "typescript";

export const PACKAGE_PREFIX = "scraft";

/** Prefix class expressions, never customer text, IDs or variant option values. */
export function namespacePackageClasses(source: string, filename: string) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const edits = new Map<number, { end: number; value: string }>();
  const declarations = new Map<string, ts.VariableDeclaration[]>();
  function index(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
      declarations.set(node.name.text, [
        ...(declarations.get(node.name.text) ?? []),
        node,
      ]);
    ts.forEachChild(node, index);
  }
  index(ast);
  const visiting = new Set<ts.Node>();
  function literal(node: ts.StringLiteralLike) {
    const value = node.text.replace(/\S+/g, (original) => {
      const token = original
        .replace(
          /--radius-(xs|sm|md|lg|xl|2xl|3xl|4xl)\b/g,
          `--${PACKAGE_PREFIX}-radius-$1`
        )
        // These utility hooks belong to our Card styles. Third-party selectors
        // (Recharts, DayPicker, etc.) and their underscore combinators stay intact.
        .replace(
          /(^|:)\[([^\]]+)\]:/g,
          (_, separator: string, selector: string) =>
            `${separator}[${selector.replace(/\.(border-[bt])\b/g, `[class~='${PACKAGE_PREFIX}:$1']`)}]:`
        );
      return token.startsWith(`${PACKAGE_PREFIX}:`)
        ? token
        : `${PACKAGE_PREFIX}:${token}`;
    });
    edits.set(node.getStart(ast), { end: node.end, value: JSON.stringify(value) });
  }
  function expression(node: ts.Node) {
    if (visiting.has(node)) return;
    if (ts.isIdentifier(node)) {
      const bindings = declarations.get(node.text) ?? [];
      // Incoming host class props have no local initializer and stay host-owned.
      // Ambiguous local bindings must be resolved by an explicit author change.
      if (bindings.length > 1)
        throw new Error(`Ambiguous class binding ${node.text} in ${filename}`);
      const initializer = bindings[0]?.initializer;
      if (initializer) {
        visiting.add(node);
        expression(initializer);
        visiting.delete(node);
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      literal(node);
    else if (ts.isConditionalExpression(node)) {
      expression(node.whenTrue);
      expression(node.whenFalse);
    } else if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
        expression(node.right);
      else if (
        [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
          node.operatorToken.kind
        )
      ) {
        expression(node.left);
        expression(node.right);
      }
    } else if (ts.isArrayLiteralExpression(node)) node.elements.forEach(expression);
    else if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node)
    )
      expression(node.expression);
    else if (ts.isTemplateExpression(node))
      throw new Error(
        `Dynamic class template needs an explicit package transform: ${filename}`
      );
    else if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name))
          literal(property.name);
      }
    }
  }
  function variantValues(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) variantValues(property.initializer);
      }
    } else expression(node);
  }
  function visit(node: ts.Node) {
    if (
      ts.isJsxAttribute(node) &&
      /(?:^className$|ClassName$)/.test(node.name.getText(ast)) &&
      node.initializer
    ) {
      if (ts.isJsxExpression(node.initializer)) {
        if (node.initializer.expression) expression(node.initializer.expression);
      } else expression(node.initializer);
    }
    if (
      ts.isPropertyAssignment(node) &&
      /(?:^class$|^className$|ClassName$)/.test(
        node.name.getText(ast).replace(/["']/g, "")
      )
    )
      expression(node.initializer);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (["cn", "clsx"].includes(node.expression.text))
        node.arguments.forEach(expression);
      if (node.expression.text === "cva") {
        if (node.arguments[0]) expression(node.arguments[0]);
        const config = node.arguments[1];
        if (config && ts.isObjectLiteralExpression(config)) {
          const variants = config.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) &&
              property.name.getText(ast) === "variants"
          );
          if (variants && ts.isPropertyAssignment(variants))
            variantValues(variants.initializer);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const [start, edit] of [...edits.entries()].sort(([a], [b]) => b - a))
    source = source.slice(0, start) + edit.value + source.slice(edit.end);
  return source;
}
