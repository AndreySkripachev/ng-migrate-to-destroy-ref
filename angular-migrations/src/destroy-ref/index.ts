import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { ClassDeclaration, Project, Scope, SourceFile } from 'ts-morph';
import { ImportUtils } from './utils/import-utils';
import { ClassUtils } from './utils/class-utils';
import { NodeUtils } from './utils/node-utils';

const FILE_REGEX = /^\/projects\/.*\.ts$/;
const DESTROYABLE_ALIAS = 'DestroyableComponent';
const project = new Project();

function shouldProcessFile(tsSource: string): boolean {
	return tsSource.includes(DESTROYABLE_ALIAS) || tsSource.includes('takeUntilDestroy(this)');
}

function getComponentClasses(source: SourceFile): ClassDeclaration[] {
	return source.getClasses()
		.filter(ClassUtils.isAngularFeature);
}

function processComponent(component: ClassDeclaration): void {
	ClassUtils.removeDecorator(component, DESTROYABLE_ALIAS);

	const fn = NodeUtils.findFunctionCallInNode(component, 'takeUntilDestroy');

	if (fn !== undefined) {
		component.insertProperty(0, {
			name: 'destroyRef',
			initializer: 'inject(DestroyRef)',
			isReadonly: true,
			scope: Scope.Private,
			trailingTrivia: '\n'
		});
		fn?.replaceWithText('takeUntilDestroyed(this.destroyRef)');
	}
}

function processFile(tsSource: string): string {
	if (!shouldProcessFile(tsSource)) {
		return tsSource;
	}

	const source = project.createSourceFile('temp.ts', tsSource, { overwrite: true });

	const components = getComponentClasses(source);

	if (components.length === 0) {
		return tsSource;
	}

	ImportUtils.addImport(source, 'DestroyRef', '@angular/core', 0);
	ImportUtils.addImport(source, 'takeUntilDestroyed', '@angular/core/rxjs-interop', 0);

	components.forEach(processComponent);

	ImportUtils.removeImport(source, '/destroyable', false);

	return source.getFullText();
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function destroyRef(_options: any): Rule {
	return (tree: Tree, _context: SchematicContext) => {
		tree.visit(path => {
			if (FILE_REGEX.test(path)) {
				const buffer = tree.read(path);
				if (buffer) {
					let content = buffer.toString();
					const proceedFile = processFile(content);
					if (proceedFile !== content) {
						tree.overwrite(path, proceedFile);
					}
				}
			}
		});
		return tree;
	};
}
