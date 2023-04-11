import { Index, Show, batch, cleanup, computed, readable, render, signal } from '@intrnl/velour';
import * as perfmon from 'perf-monitor';

import './style.css';

const Cursor = ({ label, x, y, big, color }) => {
	return (
		<div
			className='cursor'
			classList={{ big, label }}
			style={{
				borderColor: color,
				transform: readable(() => `translate(${x.value}px, ${y.value}px) scale(${big.value ? 2 : 1})`),
			}}
		>
			<Show when={label}>
				<span>
					{x}, {y}
				</span>
			</Show>
		</div>
	);
};

const Spiral = () => {
	let stopped = false;

	const COUNT = 500;
	const LOOPS = 6;

	const x = signal(0);
	const y = signal(0);
	const big = signal(false);
	const counter = signal(0);

	const cursors = computed(() => {
		const _counter = counter.value;
		const _x = x.value;
		const _y = y.value;

		const max = COUNT + Math.round(Math.sin((_counter / 90) * 2 * Math.PI) * COUNT * 0.5);
		const arr = Array.from({ length: max });

		for (let i = max; i--;) {
			const f = (i / max) * LOOPS;
			const theta = f * 2 * Math.PI;
			const m = 20 + i * 2;
			const hue = (f * 255 + _counter * 10) % 255;

			arr[i] = {
				color: `hsl(${hue}, 100%, 50%)`,
				x: (_x + Math.sin(theta) * m) | 0,
				y: (_y + Math.cos(theta) * m) | 0,
			};
		}

		return arr;
	});

	// Defer movement updates
	const moved = { timeout: false, x: 0, y: 0 };

	const handlePointerMove = (ev) => {
		moved.x = ev.x;
		moved.y = ev.y;

		if (!moved.timeout) {
			moved.timeout = true;

			requestAnimationFrame(() => (
				batch(() => {
					moved.timeout = false;
					x.value = moved.x;
					y.value = moved.y;
				})
			));
		}
	};

	const handlePointerDown = () => {
		big.value = true;
	};

	const handlePointerUp = () => {
		big.value = false;
	};

	const increment = () => {
		if (stopped) {
			return;
		}

		counter.value++;
		requestAnimationFrame(increment);
	};

	window.addEventListener('pointermove', handlePointerMove);
	window.addEventListener('pointerdown', handlePointerDown);
	window.addEventListener('pointerup', handlePointerUp);

	requestAnimationFrame(increment);

	cleanup(() => {
		stopped = true;

		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerdown', handlePointerDown);
		window.removeEventListener('pointerup', handlePointerUp);
	});

	return (
		<div className='main'>
			<Cursor label x={x} y={y} big={big} />

			<Index each={cursors}>
				{(cursor) => (
					<Cursor
						color={readable(() => cursor.value.color)}
						x={readable(() => cursor.value.x)}
						y={readable(() => cursor.value.y)}
						big={big}
					/>
				)}
			</Index>
		</div>
	);
};

if (!(/[&?]perfmon=(false|off|0)\b/).test(location.search)) {
	perfmon.startFPSMonitor();
	perfmon.startMemMonitor();
}

render(<Spiral />, document.getElementById('root'));
