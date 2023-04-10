import { ConditionalNode, ListIndexNode, ListSampleNode } from './nodes.js';

export const Show = (props) => {
	return new ConditionalNode(props.when, props.children);
};

export const For = (props) => {
	return new ListSampleNode(props.each, props.children);
};

export const Index = (props) => {
	return new ListIndexNode(props.each, props.children);
};
