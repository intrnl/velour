import { Index, readable, render, signal } from '@intrnl/velour';

import * as perfmon from 'perf-monitor';

import './style.css';
import './env.js';

function Table (props) {
	return (
		<table className='table table-striped latest-data'>
			<tbody>
				<Index each={props.dbs}>
					{(db) => (
						<tr>
							<td className='dbname'>
								{readable(() => db.value.dbname)}
							</td>

							<td className='query-count'>
								<span className={readable(() => db.value.lastSample.countClassName)}>
									{readable(() => db.value.lastSample.nbQueries)}
								</span>
							</td>

							<Index each={readable(() => db.value.lastSample.topFiveQueries)}>
								{(query) => (
									<td className={readable(() => query.value.elapsedClassName)}>
										{readable(() => query.value.formatElapsed)}

										<div className='popover left'>
											<div className='popover-content'>{readable(() => query.value.query)}</div>
											<div className='arrow'></div>
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
