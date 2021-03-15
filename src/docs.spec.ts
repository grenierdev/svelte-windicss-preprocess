import { Processor } from 'windicss/lib';
import preprocessor from './preprocessor';
import { expect } from 'chai';

describe('Readme', () => {
	it('class attribute', () => {
		const processor = new Processor();
		const content = `<h1 class="text-4xl font-extrabold">Hello World</h1>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1 class={\`windi-mqgc06\`}>Hello World</h1><style>.windi-mqgc06 {
  font-weight: 800;
  font-size: 2.25rem;
  line-height: 2.5rem;
}</style>`);
	});

	it('class directives', () => {
		const processor = new Processor();
		const content = `<h1 class:text-4xl={large} class:font-extra-bold={bold} class:foo class="text-indigo-600">Hello World</h1>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1    class={\`\${large ? 'windi-1v0e16j' : ''} \${bold ? 'windi-40b0h1' : ''} \${foo ? 'foo' : ''} windi-d3nmre\`}>Hello World</h1><style>.windi-40b0h1 {
  font-weight: 700;
}
.windi-1v0e16j {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
.windi-d3nmre {
  --tw-text-opacity: 1;
  color: rgba(79, 70, 229, var(--tw-text-opacity));
}</style>`);
	});

	it('variants attribute', () => {
		const processor = new Processor();
		const content = `<h1 sm="text-4xl" hover="text-pink-600" class="text-indigo-600">Hello World</h1>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1   class={\`windi-wq912a windi-smsgw7 windi-d3nmre\`}>Hello World</h1><style>.windi-smsgw7:hover {
  --tw-text-opacity: 1;
  color: rgba(219, 39, 119, var(--tw-text-opacity));
}
.windi-d3nmre {
  --tw-text-opacity: 1;
  color: rgba(79, 70, 229, var(--tw-text-opacity));
}
@media (min-width: 640px) {
  .windi-wq912a {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }
}</style>`);
	});

	it('@apply directive', () => {
		const processor = new Processor();
		const content = `<h1 class="foo">Hello World</h1><style>.foo { @apply text-4xl; }</style>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1 class={\`foo\`}>Hello World</h1><style>.foo {
  font-size: 2.25rem;
  line-height: 2.5rem;
}</style>`);
	});

	it('@screen directive', () => {
		const processor = new Processor();
		const content = `<h1 class="foo">Hello World</h1><style>@screen sm { .foo { font-weight: bold; } }</style>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1 class={\`foo\`}>Hello World</h1><style>@media (min-width: 640px) {
  .foo {
    font-weight: bold;
  }
}</style>`);
	});

	it('@variants directive', () => {
		const processor = new Processor();
		const content = `<h1 class="foo">Hello World</h1><style>@variants active, hover { .foo { font-weight: bold; } }</style>`;
		const transformed = preprocessor(processor, content, { ignoreDynamicClassesWarning: true, includeBaseStyles: false });
		expect(transformed.code).to.be.eq(`<h1 class={\`foo\`}>Hello World</h1><style>.foo:active {
  font-weight: bold;
}
.foo:hover {
  font-weight: bold;
}</style>`);
	});
});