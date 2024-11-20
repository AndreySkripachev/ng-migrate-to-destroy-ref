import { CallExpression, Identifier, Node } from "ts-morph";

export namespace NodeUtils {

	export function getIdentifierFor(node: Node): Identifier | null {
		return node.getChildren().find(child => child instanceof Identifier) ?? null;
	}

	export function findFunctionCallInNode(node: Node, functionName: string): CallExpression | null {
		for (const child of node.getChildren()) {
			if (child instanceof CallExpression) {
				if (getIdentifierFor(child)?.getText() === functionName) {
					return child;
				}
			}
			const nestedCall = findFunctionCallInNode(child, functionName);

			if (nestedCall !== null) {
				return nestedCall;
			}
		}

		return null;
	}
}
