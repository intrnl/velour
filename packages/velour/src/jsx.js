import { ComponentNode, IntrinsicNode } from './nodes.js';

export const Fragment = (props) => {
	return props.children;
};

export const jsx = (type, props) => {
	if (type === Fragment) {
		return Fragment(props);
	}
	else if (typeof type === 'function') {
		return new ComponentNode(type, props);
	}

	return new IntrinsicNode(type, props);
};

export const createElement = (type, props, children) => {
	if (arguments.length > 2) {
		props ||= {};
		props.children = arguments.length > 3 ? Array.prototype.slice.call(arguments, 2) : children;
	}

	return jsx(type, props);
};
