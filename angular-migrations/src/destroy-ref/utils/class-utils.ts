import { ClassDeclaration } from "ts-morph";

export namespace ClassUtils {

	export function hasDecorator(classDec: ClassDeclaration, alias: string): boolean {
		return classDec.getDecorators().some(decorator => decorator.getName() === alias);
	}

	export function removeDecorator(classDec: ClassDeclaration, alias: string): void {
		const decorator = classDec.getDecorators().find(decorator => decorator.getName() === alias);
		decorator?.remove();
	}

	export function isAngularFeature(classDec: ClassDeclaration): boolean {
		return hasDecorator(classDec, 'Component') ||
			hasDecorator(classDec, 'Injectable') ||
			hasDecorator(classDec, 'Directive') ||
			hasDecorator(classDec, 'Pipe');
	}
}
