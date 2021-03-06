import { parse, walk } from 'svelte/compiler';
import type { Processor } from 'windicss/lib';
import { StyleSheet, InlineAtRule } from 'windicss/utils/style';
import { CSSParser } from 'windicss/utils/parser';
import type { TemplateNode } from 'svelte/types/compiler/interfaces';

export interface PreprocessorConfig {
	filename?: string,
	includeBaseStyles?: boolean,
}

export default function preprocessor(
	processor: Processor,
	content: string,
	config?: PreprocessorConfig
): string {
	let transformed = content;

	// Parse Svelte markup
	const ast = parse(content, { filename: config?.filename ?? 'Unknown.svelte' });

	// Create stylesheet object from existing style tag or an empty one
	const stylesheet = ast.css ? new CSSParser(content.substr(ast.css.content.start, ast.css.content.end - ast.css.content.start)).parse() : new StyleSheet();

	// Keep track of the changes in the buffer
	let markupOffset = 0;
	// Walk the html markup for all class attributes
	walk(ast.html, {
		enter: function (node: TemplateNode) {
			if (node.type === 'Attribute' && node.name.toLowerCase() === 'class') {
				// Retrive start/end of the attribute's value (everything within "" or {})
				let [attr_start, attr_end] = node.value.reduce(([start, end]: [number, number], value: any) => {
					return [Math.min(start, value.start), Math.max(end, value.end)];
				}, [node.end, node.start] as [number, number]);

				// Retrive the start/end of the attribute's value content (excluding the {} or {``})
				let content_start = attr_start;
				let content_end = attr_end;
				if (node.value.length === 1 && node.value[0].type === 'MustacheTag') {
					content_start += 1;
					content_end -= 1;
					if (node.value[0].expression.type === 'TemplateLiteral') {
						content_start += 1;
						content_end -= 1;
					}
				}

				// Retrive the attribute value's content
				const value = transformed.substr(markupOffset + content_start, content_end - content_start);

				// Compile the value using WindiCSS
				const result = processor.compile(value);

				// Extend stylesheet with the result
				stylesheet.extend(result.styleSheet);

				// Retrieve the new class names
				const new_value = (result.className ? [result.className] : []).concat(result.ignored).join(' ');

				// Replace attribute's value with new value
				const before = transformed.substr(0, markupOffset + content_start);
				const after = transformed.substr(markupOffset + content_end);
				transformed = before + new_value + after;

				// Update offset with current modification
				markupOffset -= value.length;
				markupOffset += new_value.length;
			}
		} as any
	});

	// Extend stylesheet with preflight
	stylesheet.extend(processor.preflight(transformed, config?.includeBaseStyles ?? false, true, true, true));

	// Process directives
	for (const style of stylesheet.children) {
		// @apply
		const applies = style.property.filter(i => i.name === 'apply').map(i => i.value).join(' ');
		if (applies) {
			const new_styles = processor.compile(applies, undefined, undefined, false, undefined, style.rule.substr(1)).styleSheet.children;
			for (const new_style of new_styles) {
				style.extend(new_style);
			}
			style.property = style.property.filter(i => i.name !== 'apply');
		}

		// // @variants
		// style.atRules = style.atRules?.map((rule, i) => {
		// 	if (rule.match(/^@variants/)) {
		// 		const variants = rule
		// 			.replace('@variants', '')
		// 			.replace(/^ +/g, '')
		// 			.replace(/ +/g, '')
		// 			.split(/[ +,]/);
		// 		stylesheet.add(processor.wrapWithVariants(variants, style));
		// 		return '';
		// 	}
		// 	return rule;
		// }).filter(i => i);
	}

	if (ast.css) {
		// Replace existing style tag with new one
		const cssOffset = ast.html.start < ast.css.start ? markupOffset : 0;
		transformed = transformed.substr(0, cssOffset + ast.css.start) + '<style>' + stylesheet.build() + '</style>' + transformed.substr(cssOffset + ast.css.end);
	} else {
		// Append new style tag
		transformed += `<style>${stylesheet.build()}</style>`;
	}

	return transformed;
}