import { Index, Show, attach, computed, readable, render, signal } from '@intrnl/velour';

import './style.css';

const App = () => {
	const ENTER_KEY = 13;
	const ESCAPE_KEY = 27;

	const filters = {
		all: (items) => items,
		active: (items) => items.filter((item) => !item.completed),
		completed: (items) => items.filter((item) => item.completed),
	};

	const items = signal([]);
	const visibility = signal('all');
	const editing = signal(null);

	const filtered_items = computed(() => filters[visibility.value](items.value));
	const remaining = computed(() => filters.active(items.value).length);

	const toggle_all = (event) => {
		items.value = items.value.map((item) => ({ ...item, completed: event.target.checked }));
	};

	const clear_completed = () => {
		items.value = items.value.filter((item) => !item.completed);
	};

	const add_todo = (event) => {
		if (event.which === ENTER_KEY) {
			items.value = items.value.concat({
				id: Date.now(),
				title: event.target.value,
				completed: false,
			});

			event.target.value = '';
		}
	};

	const remove_todo = (id) => {
		items.value = items.value.filter((item) => item.id !== id);
	};

	const edit_todo = (next) => {
		const next_items = items.value.slice();
		const index = next_items.findIndex((item) => item.id === next.id);

		if (index !== -1) {
			next_items[index] = { ...next_items[index], ...next };
			items.value = next_items;
		}
	};

	const toggle_todo = (id, event) => {
		edit_todo({ id, completed: event.target.checked });
	};

	const handle_edit = (event) => {
		if (event.which === ENTER_KEY) {
			event.target.blur();
		}
		else if (event.which === ESCAPE_KEY) {
			editing.value = null;
		}
	};

	const handle_submit = (event) => {
		edit_todo({ id: editing.value, title: event.target.value });
		editing.value = null;
	};

	const update_view = () => {
		let route = window.location.hash.replace(/#\/?/, '');

		if (!filters[route]) {
			route = 'all';
		}

		visibility.value = route;
	};

	window.addEventListener('hashchange', update_view);
	update_view();

	return (
		<>
			<header className='header'>
				<h1>todos</h1>
				<input onKeyDown={add_todo} placeholder='What needs to be done' className='new-todo' autoFocus />
			</header>

			<Show when={readable(() => items.value.length > 0)}>
				<section className='main'>
					<input
						id='toggle-all'
						type='checkbox'
						checked={readable(() => remaining.value === 0)}
						onChange={toggle_all}
						className='toggle-all'
					/>
					<label htmlFor='toggle-all'>Mark all as complete</label>

					<ul className='todo-list'>
						<Index each={filtered_items}>
							{(item) => (
								<li
									classList={readable(() => ({
										todo: true,
										completed: item.value.completed,
										editing: editing.value && editing.value === item.value.id,
									}))}
								>
									<div className='view'>
										<input
											type='checkbox'
											checked={readable(() => item.value.completed)}
											onChange={(event) => toggle_todo(item.value.id, event)}
											className='toggle'
										/>

										<label onDblClick={() => (editing.value = item.value.id)}>
											{readable(() => item.value.title)}
										</label>

										<button onClick={() => remove_todo(item.value.id)} className='destroy'></button>
									</div>

									<Show when={readable(() => editing.value && editing.value === item.value.id)}>
										<input
											defaultValue={readable(() => item.value.title)}
											onKeyDown={handle_edit}
											onBlur={handle_submit}
											className='edit'
										>
											{attach((target) => setTimeout(() => target.focus(), 0))}
										</input>
									</Show>
								</li>
							)}
						</Index>
					</ul>

					<footer className='footer'>
						<span className='todo-count'>
							<strong>{remaining}</strong> {readable(() => remaining.value === 1 ? 'item' : 'items')} left
						</span>

						<ul className='filters'>
							<li>
								<a classList={readable(() => ({ selected: visibility.value === 'all' }))} href='#/'>All</a>
							</li>
							<li>
								<a classList={readable(() => ({ selected: visibility.value === 'active' }))} href='#/active'>Active</a>
							</li>
							<li>
								<a classList={readable(() => ({ selected: visibility.value === 'completed' }))} href='#/completed'>
									Completed
								</a>
							</li>
						</ul>

						<Show when={readable(() => items.value.length > remaining.value)}>
							<button className='clear-completed' onClick={clear_completed}>
								Clear completed
							</button>
						</Show>
					</footer>
				</section>
			</Show>
		</>
	);
};

render(<App />, document.getElementById('root'));
