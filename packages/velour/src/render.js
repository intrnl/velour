import { set_dom_props } from './dom.js';
import { AttachableNode, ComponentNode, ConditionalNode, IntrinsicNode, ListIndexNode } from './nodes.js';
import { Scope, Signal, cleanup, effect, is_readable, signal, untrack } from './signal.js';
import { Stack, is_array, is_function } from './utils.js';

/**
 * @typedef {object} RenderTarget
 * @property {(node: Node, ref: Node | null) => void} insertBefore
 * @property {?Node} nextSibling
 */

/**
 * @typedef {object} RenderJob
 * @property {RenderContext} _context
 * @property {RenderTarget} _target
 * @property {any} _value
 */

/**
 * @typedef {object} IndexItemNode
 * @property {RenderContext} _context
 * @property {SyntheticFragment} _target
 * @property {Signal<any>} _signal
 */

const ROOT = Symbol('velour.root');

/**
 * @param {(node: HTMLElement | SVGElement) => void} fn
 * @returns {AttachableNode}
 */
export const attach = (fn) => {
	return new AttachableNode(fn);
};

/**
 * @param {any} next
 * @param {HTMLElement | SVGElement} element
 */
export const render = (next, element) => {
	/** @type {RenderContext | undefined} */
	let root = element[ROOT];
	/** @type {Stack<RenderJob>} */
	const queue = new Stack();

	if (!root) {
		root = new RenderContext();
		root._is_svg = element instanceof SVGElement;
	}
	else {
		root.clear();
		element.innerHTML = '';
	}

	queue.push({ _context: root, _target: element, _value: next });
	commit(queue);
};

/**
 * @param {Stack<RenderJob>} stack
 */
const commit = (stack) => {
	let node;
	while (node = stack.pop()) {
		const context = node._context;
		const target = node._target;
		const value = node._value;

		if (value === undefined || value === null || typeof value === 'boolean') {
			continue;
		}
		else if (typeof value === 'string' || typeof value === 'number') {
			let node = document.createTextNode('' + value);
			target.insertBefore(node, null);
		}
		else if (is_readable(value)) {
			let node = document.createTextNode('');
			target.insertBefore(node, null);

			context.run(() => {
				effect(() => {
					node.data = value.value;
				});
			});
		}
		else if (is_array(value)) {
			let idx = value.length;

			while (idx--) {
				const item = value[idx];
				stack.push({ _context: context, _target: target, _value: item });
			}
		}
		else if (value instanceof IntrinsicNode) {
			const name = value._type;
			const props = value._props;

			const is = props.is;
			const children = props.children;

			let child_context = context;
			let is_svg = context._is_svg;

			if (name === 'svg') {
				child_context = new RenderContext(context);
				is_svg = child_context._is_svg = true;
			}
			else if (context._is_svg && name === 'foreignObject') {
				child_context = new RenderContext(context);
				child_context._is_svg = false;
			}

			const node = !is_svg
				? document.createElement(name, { is: typeof is === 'string' ? is : undefined })
				: document.createElementNS('http://www.w3.org/2000/svg', name);

			context.run(() => set_dom_props(node, props, is_svg));

			target.insertBefore(node, null);

			stack.push({ _context: child_context, _target: node, _value: children });
		}
		else if (value instanceof ComponentNode) {
			const render = value._render;
			const props = value._props;

			const ret = untrack(() => render(props));

			stack.push({ _context: context, _target: target, _value: ret });
		}
		else if (value instanceof AttachableNode) {
			const fn = value._fn;

			if (!(target instanceof SyntheticFragment)) {
				fn(target);
			}
		}
		else if (value instanceof ConditionalNode) {
			const when = value._when;
			const children = value._children;

			const is_dynamic = is_function(children);

			if (is_readable(when)) {
				const fragment = new SyntheticFragment();
				const child_context = new RenderContext(context);

				/** @type {Stack<RenderJob>} */
				const child_stack = new Stack();

				let key = is_dynamic ? Symbol() : false;

				fragment._insert(target, null);

				effect(() => {
					let next = when.value;
					let normalized = is_dynamic ? next : !!next;

					if (key === normalized) {
						return;
					}

					key = normalized;

					child_context.clear();
					fragment._detach(true);

					if (next) {
						child_stack.push({
							_context: child_context,
							_target: fragment,
							_value: is_dynamic ? untrack(() => children(next)) : children,
						});

						fragment._attach();
						commit(child_stack);
					}
				});
			}
			else if (when) {
				stack.push({
					_context: context,
					_target: target,
					_value: is_dynamic ? untrack(() => children(when)) : children,
				});
			}
		}
		else if (value instanceof ListIndexNode) {
			const source = value._source;
			const children = value._children;
			const fallback = value._fallback;

			const is_dynamic = is_function(children);

			if (is_readable(source)) {
				/** @type {IndexItemNode[]} */
				const parts = [];

				/** @type {Stack<RenderJob>} */
				const child_stack = new Stack();
				const initial_marker = document.createComment('');

				target.insertBefore(initial_marker, null);

				effect(() => {
					const items = source.value;
					const items_len = items.length;
					const parts_len = parts.length;

					let index = 0;

					for (; index < items_len; index++) {
						const val = items[index];

						if (index < parts_len) {
							const part = parts[index];
							part._signal.value = val;
						}
						else {
							const prev = parts[index - 1];
							const before = prev ? prev._target.nextSibling : initial_marker;

							const state = signal(val);

							const child_target = new SyntheticFragment();
							const child_context = new RenderContext(context);

							const ret = is_dynamic
								? child_context.run(() => untrack(() => children(state, index)))
								: children;

							child_target._insert(target, before);

							parts.push({ _context: child_context, _target: child_target, _signal: state });
							child_stack.push({ _context: child_context, _target: child_target, _value: ret });
						}
					}

					if (parts_len > items_len) {
						for (; index < parts_len; index++) {
							const part = parts[index];

							part._context.clear();
							part._target._remove(true);
						}

						parts.length = items_len;
					}

					commit(child_stack);
				});

				cleanup(() => {
					for (let i = 0, l = parts.length; i < l; i++) {
						let part = parts[i];
						part._context.clear(true);
					}
				});
			}
			else if (source.length > 0) {
				for (let idx = 0, len = source.length; idx < len; idx++) {
					stack.push({
						_context: context,
						_target: target,
						_value: is_dynamic ? untrack(() => children(signal(source[idx]), idx)) : children,
					});
				}
			}
			else {
				stack.push({ _context: context, _target: target, _value: fallback });
			}
		}
		else {
			throw new Error(`Unknown type: ${value}`);
		}
	}
};

class RenderContext extends Scope {
	/**
	 * @param {RenderContext} [parent]
	 */
	constructor (parent) {
		super(parent || true);

		this._is_svg = parent ? parent._is_svg : false;
	}

	clear (from_parent) {
		super.clear(from_parent);
	}
}

class SyntheticFragment {
	constructor () {
		/** @type {ChildNode[]} */
		this._nodes = [];

		/** @type {Comment} */
		this._anchor = document.createComment('');

		/** @type {boolean} */
		this._attached = false;
	}

	get nextSibling () {
		const nodes = this._nodes;
		const length = nodes.length;

		const node = length > 0 ? nodes[length - 1] : this._anchor;
		return node.nextSibling;
	}

	/**
	 * @param {Node} node
	 * @param {Node | null} ref
	 */
	insertBefore (node, ref) {
		const anchor = this._anchor;
		const connected = anchor.isConnected;

		const nodes = this._nodes;
		const index = ref ? nodes.indexOf(ref) : -1;

		if (index !== -1) {
			const target = nodes[index];
			nodes.splice(index, 0, node);

			if (connected) {
				target.before(node);
			}
		}
		else {
			nodes.push(node);

			if (connected) {
				anchor.before(node);
			}
		}
	}

	/**
	 * @param {ParentNode} parent
	 * @param {Node} ref
	 */
	_insert (parent, ref) {
		const anchor = this._anchor;
		parent.insertBefore(anchor, ref);

		this._attach();
	}

	_remove () {
		this._detach(true);
		this._anchor.remove();
	}

	_attach () {
		const anchor = this._anchor;
		const nodes = this._nodes;
		const length = nodes.length;

		if (length > 0) {
			if (length < 32768) {
				anchor.before(...nodes);
			}
			else {
				for (let idx = 0; idx < length; idx++) {
					const child = nodes[idx];
					anchor.before(child);
				}
			}
		}

		this._attached = true;
	}

	_detach (clear) {
		const nodes = this._nodes;
		const length = nodes.length;

		if (length > 0) {
			if (length < 32768) {
				// NOTE(intrnl): is this the fastest way to remove?
				const fragment = new DocumentFragment();
				fragment.append(...nodes);
			}
			else {
				for (let idx = 0; idx < length; idx++) {
					const child = nodes[idx];
					child.remove();
				}
			}
		}

		if (clear) {
			nodes.length = 0;
		}

		this._attached = false;
	}
}
