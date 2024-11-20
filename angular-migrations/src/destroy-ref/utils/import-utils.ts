import { ImportDeclaration, SourceFile } from "ts-morph";

export namespace ImportUtils {

	function getImportByName(
		source: SourceFile,
		moduleName: string,
		strict = true,
	): ImportDeclaration | null {
		return source.getImportDeclarations()
			.find(importDec => {
				const name = importDec.getModuleSpecifier().getText().slice(1, -1);
				return strict ? name === moduleName : name.endsWith(moduleName);
			}) ?? null;
	}

	export function addImport(
		source: SourceFile,
		importName: string,
		moduleName: string,
		index?: number
	): void {
		const existsImport = getImportByName(source, moduleName);

		if (existsImport !== null) {
			existsImport.addNamedImport(importName);
			return;
		}

		if (index === undefined) {
			source.addImportDeclaration({
				moduleSpecifier: moduleName,
				namedImports: [importName],
				leadingTrivia: '\t',
			});
			return;
		}

		source.insertImportDeclaration(index, {
			moduleSpecifier: moduleName,
			namedImports: [importName],
			leadingTrivia: '\t',
		});
	}

	export function removeImport(source: SourceFile, moduleName: string, strict = true): void {
		getImportByName(source, moduleName, strict)?.remove();
	}
}
