import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { ClassDeclaration, Project, Scope, SourceFile } from 'ts-morph';
import { ImportUtils } from './utils/import-utils';
import { ClassUtils } from './utils/class-utils';
import { NodeUtils } from './utils/node-utils';

const FILE_REGEX = /^\/projects\/.*\.ts$/;
const DESTROYABLE_ALIAS = 'DestroyableComponent';
const project = new Project();

interface SchematicProperties {

  /** Decorator name. */
  readonly decoratorName: string;

  /** Pipe name. */
  readonly pipeName: string;
}

function shouldProcessFile(tsSource: string): boolean {
	return tsSource.includes(DESTROYABLE_ALIAS) || tsSource.includes('takeUntilDestroy(this)');
}

function getComponentClasses(source: SourceFile): ClassDeclaration[] {
	return source.getClasses()
		.filter(ClassUtils.isAngularFeature);
}

function insertDestroyRefToComponent(component: ClassDeclaration): string {
  let destroyRefName = 'destroyRef';
  let existsProperty = component.getProperty(destroyRefName);

  while (existsProperty !== undefined) {
    destroyRefName = `${destroyRefName}_`;
    existsProperty = component.getProperty(destroyRefName);
  }

  component.insertProperty(0, {
    name: 'destroyRef',
    initializer: 'inject(DestroyRef)',
    isReadonly: true,
    scope: Scope.Private,
  }).appendWhitespace('\n');

  return destroyRefName;
}

function processComponent(component: ClassDeclaration, options: SchematicProperties): boolean {
	ClassUtils.removeDecorator(component, options.decoratorName);

	const fns = NodeUtils.findFunctionCallsInNode(component, options.pipeName);

	if (fns.length !== 0) {
		const propName = insertDestroyRefToComponent(component);
		fns.forEach(fn => fn.replaceWithText(`takeUntilDestroyed(this.${propName})`));
    return true;
	}

  return false;
}

function processFile(tsSource: string, options: SchematicProperties): string {
	if (!shouldProcessFile(tsSource)) {
		return tsSource;
	}

	const source = project.createSourceFile('temp.ts', tsSource, { overwrite: true });

	const components = getComponentClasses(source);

	if (components.length === 0) {
		return tsSource;
	}

	const flags = components.map(component => processComponent(component, options));

  if (flags.some(Boolean)) {
    ImportUtils.addImport(source, 'DestroyRef', '@angular/core', 0);
    ImportUtils.addImport(source, 'takeUntilDestroyed', '@angular/core/rxjs-interop', 0);
  }

	ImportUtils.removeImport(source, '/destroyable', false);

	return source.getFullText();
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function destroyRef(options: SchematicProperties): Rule {
	return (tree: Tree, _context: SchematicContext) => {
		tree.visit(path => {
			if (FILE_REGEX.test(path)) {
				const buffer = tree.read(path);
				if (buffer) {
					let content = buffer.toString();
					const proceedFile = processFile(content, options);
					if (proceedFile !== content) {
						tree.overwrite(path, proceedFile);
					}
				}
			}
		});
		return tree;
	};
}
