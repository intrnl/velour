import { effect, is_readable } from './signal.js';

const STYLE_CACHE = Symbol('velour.style-cache');
const LISTENER_CACHE = Symbol('velour.listener-cache');

const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

/**
 * @this {Node}
 * @param {Event} event
 */
function event_bubble_proxy (event) {
	return this[LISTENER_CACHE][event.type + false](event);
}

/**
 * @this {Node}
 * @param {Event} event
 */
function event_capture_proxy (event) {
	return this[LISTENER_CACHE][event.type + true](event);
}

export const set_dom_props = (element, props, is_svg) => {
	for (const key in props) {
		if (key === 'children') {
			continue;
		}

		const val = props[key];

		if (key[0] === 'o' && key[1] === 'n') {
			let name = key;
			let capture = false;

			if (name.endsWith('Capture')) {
				capture = true;
				name = name.slice(0, -7);
			}

			const lowercase = name.toLowerCase();

			if (lowercase in element) {
				name = lowercase.slice(2);
			}
			else {
				name = name.slice(2);
			}

			const handler = capture ? event_capture_proxy : event_bubble_proxy;
			const listeners = element[LISTENER_CACHE] ||= {};
			listeners[name + capture] = val;

			element.addEventListener(name, handler, capture);
		}
		else if (key === 'classList') {
			setClassList(element, val, props['className'] || props['class']);
		}
		else if (key === 'style') {
			setStyle(element, val);
		}
		else if (key === 'class') {
			setProperty(element, 'className', val);
		}
		else if (!is_svg && key in element) {
			setProperty(element, key, val);
		}
		else {
			// Normalize incorrect prop usage for SVG:
			// - xlink:href / xlinkHref --> href (xlink:href was removed from SVG and isn't needed)
			// - className --> class
			const name = is_svg
				? key.replace(/xlink(H|:h)/, 'h').replace(/sName$/, 's')
				: key;

			setAttribute(element, name, val);
		}
	}
};

const setAttributeStatic = (element, key, value) => {
	if (typeof value === 'function') {
	}
	else if (value != null && (value !== false || key[4] === '-')) {
		element.setAttribute(key, value);
	}
	else {
		element.removeAttribute(key);
	}
};

export const setAttribute = (element, key, value) => {
	if (is_readable(value)) {
		effect(() => {
			setAttributeStatic(element, key, value.value);
		});
	}
	else {
		setAttributeStatic(element, key, value);
	}
};

const setPropertyStatic = (element, key, value) => {
	element[key] = value;
};

export const setProperty = (element, key, value) => {
	if (is_readable(value)) {
		effect(() => {
			setPropertyStatic(element, key, value.value);
		});
	}
	else {
		setPropertyStatic(element, key, value);
	}
};

const setStyleValue = (style, key, value) => {
	if (key[0] === '-') {
		style.setProperty(key, value == null ? '' : value);
	}
	else if (value == null) {
		style[key] = '';
	}
	else if (typeof value != 'number' || IS_NON_DIMENSIONAL.test(key)) {
		style[key] = value;
	}
	else {
		style[key] = value + 'px';
	}
};

const setStyleStatic = (element, value) => {
	const style = element.style;

	if (typeof value === 'string') {
		style.cssText = value;
	}
	else {
		style.cssText = '';
	}
};

export const setStyle = (element, value) => {
	if (is_readable(value)) {
		effect(() => {
			setStyleStatic(element, value.value);
		});
	}
	else if (typeof value === 'object' && value) {
		const style = element.style;

		for (const key in value) {
			const val = value[key];
			const is_dynamic = is_readable(val);

			if (is_dynamic) {
				effect(() => {
					setStyleValue(style, key, val.value);
				});
			}
			else {
				setStyleValue(style, key, val);
			}
		}
	}
	else {
		setStyleStatic(element, value);
	}
};

export const setClassList = (element, value, classNameValue) => {
	const is_cn_dynamic = is_readable(classNameValue);
	const list = element.classList;

	for (const key in value) {
		const val = value[key];
		const is_dynamic = is_readable(val);

		if (is_cn_dynamic) {
			effect(() => {
				classNameValue.value;
				list.toggle(key, !!(is_dynamic ? val.value : val));
			});
		}
		else if (is_dynamic) {
			effect(() => {
				list.toggle(key, !!val.value);
			});
		}
		else if (val) {
			list.add(key);
		}
	}
};
