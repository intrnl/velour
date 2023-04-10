import { Signal } from './signal.js';

/**
 * @param {string} type
 * @param {Record<string, any>} props
 */
export function IntrinsicNode (type, props) {
	this._type = type;
	this._props = props;
}

/**
 * @template T
 * @param {(props: T) => any} render
 * @param {T} props
 */
export function ComponentNode (render, props) {
	this._render = render;
	this._props = props;
}

/**
 * @param {any} when
 * @param {any} children
 */
export function ConditionalNode (when, children) {
	this._when = when;
	this._children = children;
}

/**
 * @param {T[] | Signal<T[]>} source
 * @param {any} children
 */
export function ListSampleNode (source, children) {
	this._source = source;
	this._children = children;
}

/**
 * @template T
 * @param {T[] | Signal<T[]>} source
 * @param {any} children
 * @param {any} fallback
 */
export function ListIndexNode (source, children, fallback) {
	this._source = source;
	this._children = children;
	this._fallback = fallback;
}

/**
 * @param {(node: HTMLElement | SVGElement) => void} fn
 */
export function AttachableNode (fn) {
	this._fn = fn;
}
