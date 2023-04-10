import { Index, readable, render, signal } from '@intrnl/velour';

import * as perfmon from 'perf-monitor';

import './style.css';
import './env.js';

function Table (props) {
	return (
		<table class='table table-striped latest-data'>
			<tbody>
				<Index each={props.dbs}>
					{(db) => (
						<tr>
							<td class='dbname'>
								{readable(() => db.value.dbname)}
							</td>

							<td class='query-count'>
								<span class={readable(() => db.value.lastSample.countClassName)}>
									{readable(() => db.value.lastSample.nbQueries)}
								</span>
							</td>

							<Index each={readable(() => db.value.lastSample.topFiveQueries)}>
								{(query) => (
									<td class={readable(() => query.value.elapsedClassName)}>
										{readable(() => query.value.formatElapsed)}

										<div class='popover left'>
											<div class='popover-content'>{readable(() => query.value.query)}</div>
											<div class='arrow'></div>
										</div>
									</td>
								)}
							</Index>
						</tr>
					)}
				</Index>
			</tbody>
		</table>
	);
}

if (!(/[&?]perfmon=(false|off|0)\b/).test(location.search)) {
	perfmon.startFPSMonitor();
	perfmon.startMemMonitor();
	perfmon.initProfiler('view update');

	const root = document.getElementById('root');
	const array = signal([]);

	function redraw () {
		const next = ENV.generateData().toArray();

		perfmon.startProfile('view update');
		array.value = next;
		perfmon.endProfile('view update');

		setTimeout(redraw, ENV.timeout);
	}

	redraw();
	render(<Table dbs={array} />, root);
}
else {
	const root = document.getElementById('root');
	const array = signal([]);

	function redraw () {
		const next = ENV.generateData().toArray();

		array.value(next);

		setTimeout(redraw, ENV.timeout);
	}

	redraw();
	render(<Table dbs={array} />, root);
}
