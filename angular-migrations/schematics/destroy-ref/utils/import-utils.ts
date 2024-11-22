import { ImportDeclaration, ImportSpecifier, SourceFile } from "ts-morph";

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
			});
			return;
		}

		source.insertImportDeclaration(index, {
			moduleSpecifier: moduleName,
			namedImports: [importName],
		});
	}

	export function removeImport(source: SourceFile, moduleName: string, strict = true): void {
		getImportByName(source, moduleName, strict)?.remove();
	}

  export function removeNamedImport(source: SourceFile, importName: string): void {
    let specifier: ImportSpecifier | null = null;

    for (const importDec of source.getImportDeclarations()) {
      if (specifier !== null) {
        break;
      }

      for (const namedImport of importDec.getNamedImports()) {
        if (namedImport.getName() === importName) {
          specifier = namedImport;
          break
        }
      }
    }

    if (specifier === null) {
      return;
    }

    const importDeclaration = specifier.getImportDeclaration();
    specifier.remove();
    if (importDeclaration.getNamedImports().length === 0) {
      importDeclaration.remove();
    }
  }
}
