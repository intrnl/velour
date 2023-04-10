import { Show, readable, render, signal } from '@intrnl/velour';

const Counter = ({ initialValue = 0 }) => {
	const count = signal(initialValue);

	return (
		<>
			<button onClick={() => count.value += 1}>
				count: {count}
			</button>

			<div>doubled: {readable(() => count.value * 2)}</div>

			<Show when={readable(() => count.value % 2 === 0)}>
				odd!
			</Show>
			<Show when={readable(() => count.value % 2 !== 0)}>
				even!
			</Show>
		</>
	);
};

render(<Counter initialValue={2} />, document.getElementById('root'));
