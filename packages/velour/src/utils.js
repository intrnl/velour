/**
 * @template T
 * @param {T} value
 * @param {StackNode<T> | undefined} next
 */
function StackNode (value, next) {
	this._value = value;
	this._next = next;
}

/**
 * @template T
 */
export class Stack {
	/** @type {StackNode<T> | undefined} */
	_head;
	/** @type {StackNode<T> | undefined} */
	_tail;
	/** @type {number} */
	size = 0;

	/**
	 * @param {T} value
	 */
	push (value) {
		this._head = new StackNode(value, this._head);
	}

	pop () {
		const current = this._head;

		if (!current) {
			return;
		}

		this._head = current._next;
		this.size--;

		return current._value;
	}
}

export const noop = () => {};
export const is_function = (x) => typeof x === 'function';
export const is_array = Array.isArray;

export const ArrayPrototypeSlice = Array.prototype.slice;
