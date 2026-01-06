
(function(window, $) {

	/*********************************
	 Функции работы с настройками контроллера для Интерфейса окна Настроек
	 ***************************************************/

	fn.settings.goToTop = function() {
		const section = Array.from(document.querySelectorAll('#popup_box .content'))
			.find(el => getComputedStyle(el).display === 'block');
		if (section) {
			let content = section.querySelector('.scroller');
			if(content) content.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	fn.settings.onloadBackEnd = function() {
		fn.settings.form = document.getElementById('settingsForm');
		if(fn.settings.form) {
			fn.settings.form.onsubmit = fn.settings.formOnSubmit;
		}
		fn.settings.writeDataInFormFields();
	};

	fn.settings.formOnSubmit = function(e) {
		e.preventDefault();

		const data = new FormData(fn.settings.form);
		const result = Object.fromEntries(data.entries());
		const exp = [];

		const settingsSaved = function(msg) {
			const saved = msg || 'Сохранено!';
			$('#saved_settings').html(saved).fadeIn().delay(1000).fadeOut();
		};

		for (let key in result) {
			let [chapter, section, name] = key.split('_');
			let value = result[key].trim() === '' ? 0 : result[key].trim();

			if (typeof DT.settings[chapter]?.[section]?.[name] !== 'undefined' && DT.settings[chapter][section][name] != value) {
				DT.settings[chapter][section][name] = value;
				exp.push({ chapter, section, name, value });
			}
		}

		// Проверка для visualizationDelay
		const timing = DT.settings.controller?.timing;
		if(timing && parseInt(timing.visualizationDelay) < parseInt(timing.dataReceiptPeriod)) {
			timing.visualizationDelay = timing.dataReceiptPeriod;
			exp.push({
				chapter: 'controller',
				section: 'timing',
				name: 'visualizationDelay',
				value: timing.visualizationDelay
			});
			fn.settings.writeDataInFormFields();
		}

		if(exp.length > 0) {
			fn.settings.save(exp, 'chapter_section_name', function() {
				fn.DeliverData.change({sender: 'fn.settings.save', action: 'save', data: exp });
				settingsSaved();
			});
		}
	};

	fn.settings.writeDataInFormFields = function() {
		for (let chapter in DT.settings) {
			for (let section in DT.settings[chapter]) {
				for (let name in DT.settings[chapter][section]) {
					let input = document.getElementById(`${chapter}_${section}_${name}`);
					let value = DT.settings[chapter][section][name];

					if(!input) continue;

					input.value = parseFloat(value) === 0 ? '' : value;

					if(chapter === 'controller') {
						switch(section) {
							case 'rotation':
							case 'tdp':
							case 'compressor':
								if(name === 'isEnable') {
									const childPartID = `${chapter}_${section}_`;
									const childInputMap = {
										rotation: ['value', 'reduction'],
										tdp: ['value'],
										compressor: ['air']
									};
									const childInput = childInputMap[section] || [];

									const disabledHandler = (el) => {
										childInput.forEach(item => {
											const child = document.getElementById(childPartID+item);
											if(child) child.disabled = !el.checked;
										});
									};

									input.addEventListener("change", function() {
										this.value = this.checked ? 'on' : 'off';
										disabledHandler(this);
									});

									if(value === 'on') {
										input.checked = true;
										input.value = 'on';
										disabledHandler(input);
									}
								}
								break;

							case 'timing':
								const inputID = `${chapter}_${section}_dataFrequencyInterval`;
								input.title = (input.id !== inputID) ? (input.value/1000) : input.value;
								input.addEventListener('input', function() {
									this.title = (this.id !== inputID) ? (this.value/1000) : this.value;
								});
								break;
						}
					}
				}
			}
		}
	};

	/*********************************
	 Функции работы с пользовательскими переменными для Интерфейса окна Настроек
	 ***************************************************/

	fn.variables.renderBackEnd = function(variables) {
		fn.variables.form = document.getElementById('variableForm');
		fn.variables.list = document.getElementById('variableList');
		if(fn.variables.list) fn.variables.list.innerHTML = '';

		variables.forEach((variable, i) => {
			const card = document.createElement('div');
			card.className = 'variable-card';
			card.setAttribute('draggable', true);
			card.dataset.uid = variable.id;
			card.dataset.index = i;

			variable.value = 'N/a';
			if(DT.STATISTIC.length > 0){
				const first = DT.STATISTIC[0];
				variable.value = fn.evaluateExpression(variable.source, first);
			}

			let HTML = `<div><strong>${variable.name} - ${variable.title}</strong>`;
			HTML += `<span>${variable.source} | ${variable.value}</span></div>`;
			HTML += `<div class="btns"><button class="btn variable_edit">&#xf044;</button>`;
			HTML += `<button class="btn variable_delete">&#xf014;</button></div>`;
			card.innerHTML = HTML;

			fn.variables.list.appendChild(card);
		});

		if(fn.variables.form) fn.variables.form.onsubmit = fn.variables.formOnSubmit;
		fn.variables.enableCardDragAndDrop();
	};

	fn.variables.editAction = function(el) {
		const parentCard = el.closest('.variable-card');
		const variables = fn.variables.sort();
		const variable = variables[parentCard.dataset.index];

		if(variable.id != parentCard.dataset.uid) {
			console.log('fn.variables.editAction :: element ID != sensor ID');
			return false;
		}

		fn.variables.form.variable_UID.value = variable.id;
		fn.variables.form.variable_title.value = variable.title;
		fn.variables.form.variable_name.value = variable.name;
		fn.variables.form.variable_source.value = variable.source;
		fn.variables.form.variable_description.value = variable.description || '';
		fn.variables.form.variable_order.value = variable.order;

		fn.settings.goToTop();
	};

	fn.variables.deleteAction = function(el) {
		const parentCard = el.closest('.variable-card');
		const variables = fn.variables.sort();
		const variable = variables[parentCard.dataset.index];

		if(variable.id != parentCard.dataset.uid) {
			console.log('fn.variables.deleteAction :: element ID != sensor ID');
			return false;
		}

		fn.db.delete('variables', variable, fn.variables.load);
	};

	fn.variables.formOnSubmit = function(e) {
		e.preventDefault();

		let variable = {
			id: parseInt(fn.variables.form.variable_UID.value),
			title: fn.variables.form.variable_title.value,
			name: fn.variables.form.variable_name.value,
			source: fn.variables.form.variable_source.value,
			description: fn.variables.form.variable_description.value,
			order: parseInt(fn.variables.form.variable_order.value)
		};

		fn.variables.save(variable);
		fn.variables.form.reset();
		fn.variables.form.variable_UID.value = 0;
	};

	fn.variables.enableCardDragAndDrop = function() {
		let drag = {};
		document.querySelectorAll('.variable-card').forEach(card => {
			card.ondragstart = e => {
				fn.variables.form.reset();
				fn.variables.form.variable_UID.value = 0;
				drag.index = e.target.closest('.variable-card').dataset.index;
				drag.uid = e.target.closest('.variable-card').dataset.uid;
			};
			card.ondragover = e => e.preventDefault();
			card.ondrop = e => {
				const target = {
					index: e.target.closest('.variable-card').dataset.index,
					uid: e.target.closest('.variable-card').dataset.uid
				};
				const variables = fn.variables.sort();

				if(variables[drag.index].id != drag.uid || variables[target.index].id != target.uid){
					console.log('fn.variables.enableCardDragAndDrop :: element ID != sensor ID');
					return false;
				}

				const dragEl = variables[drag.index];
				const targetEl = variables[target.index];
				const order = dragEl.order;
				dragEl.order = targetEl.order;
				targetEl.order = order;

				fn.variables.saveOrder([dragEl, targetEl]);
			};
		});
	};

	/*********************************
	 Функции работы с датчиками для Интерфейса окна Настроек
	 ***************************************************/

	fn.sensors.renderBackEnd = function(sensors) {
		fn.sensors.form = document.getElementById('sensorForm');
		fn.sensors.list = document.getElementById('sensorList');
		if(fn.sensors.list) fn.sensors.list.innerHTML = '';

		sensors.forEach((sensor, i) => {
			const card = document.createElement('div');
			card.className = 'sensor-card';
			card.setAttribute('draggable', true);
			card.dataset.uid = sensor.id;
			card.dataset.index = i;

			let HTML = `<div><strong>${sensor.name}</strong>`;
			HTML += `<span>${sensor.location} | ${sensor.source} | ${sensor.format} | ${sensor.unit}</span></div>`;
			HTML += `<div class="btns"><button class="btn sensor_edit">&#xf044;</button>`;
			HTML += `<button class="btn sensor_delete">&#xf014;</button></div>`;
			card.innerHTML = HTML;

			fn.sensors.list.appendChild(card);
		});

		if(fn.sensors.form) fn.sensors.form.onsubmit = fn.sensors.formOnSubmit;
		fn.sensors.enableCardDragAndDrop();
	};

	fn.sensors.editAction = function(el) {
		const parentCard = el.closest('.sensor-card');
		const sensors = fn.sensors.sort();
		const sensor = sensors[parentCard.dataset.index];

		if(sensor.id != parentCard.dataset.uid) {
			console.log('fn.sensors.editAction :: element ID != sensor ID');
			return false;
		}

		fn.sensors.form.sensor_UID.value = sensor.id;
		fn.sensors.form.sensor_elUid.value = sensor.elUid;
		fn.sensors.form.sensor_name.value = sensor.name;
		fn.sensors.form.sensor_source.value = sensor.source;
		fn.sensors.form.sensor_description.value = sensor.description || '';
		fn.sensors.form.sensor_location.value = sensor.location;
		fn.sensors.form.sensor_format.value = sensor.format;
		fn.sensors.form.sensor_unit.value = sensor.unit;
		fn.sensors.form.sensor_top.value = sensor.top;
		fn.sensors.form.sensor_order.value = sensor.order;

		fn.settings.goToTop();
	};

	fn.sensors.deleteAction = function(el) {
		const parentCard = el.closest('.sensor-card');
		const sensors = fn.sensors.sort();
		const sensor = sensors[parentCard.dataset.index];

		if(sensor.id != parentCard.dataset.uid) {
			console.log('fn.sensors.deleteAction :: element ID != sensor ID');
			return false;
		}

		fn.db.delete('sensors', sensor, fn.sensors.load);
	};

	fn.sensors.formOnSubmit = function(e) {
		e.preventDefault();

		let sensor = {
			id: parseInt(fn.sensors.form.sensor_UID.value),
			elUid: fn.sensors.area[fn.sensors.form.sensor_location.value],
			name: fn.sensors.form.sensor_name.value,
			source: fn.sensors.form.sensor_source.value,
			description: fn.sensors.form.sensor_description.value,
			location: fn.sensors.form.sensor_location.value,
			format: fn.sensors.form.sensor_format.value,
			unit: fn.sensors.form.sensor_unit.value,
			top: fn.sensors.form.sensor_top.value,
			order: parseInt(fn.sensors.form.sensor_order.value)
		};

		fn.sensors.save(sensor);
		fn.sensors.form.reset();
		fn.sensors.form.sensor_UID.value = 0;
	};

	fn.sensors.enableCardDragAndDrop = function() {
		let drag = {};
		document.querySelectorAll('.sensor-card').forEach(card => {
			card.ondragstart = e => {
				fn.sensors.form.reset();
				fn.sensors.form.sensor_UID.value = 0;
				drag.index = e.target.closest('.sensor-card').dataset.index;
				drag.uid = e.target.closest('.sensor-card').dataset.uid;
			};
			card.ondragover = e => e.preventDefault();
			card.ondrop = e => {
				const target = {
					index: e.target.closest('.sensor-card').dataset.index,
					uid: e.target.closest('.sensor-card').dataset.uid
				};
				const sensors = fn.sensors.sort();

				if(sensors[drag.index].id != drag.uid || sensors[target.index].id != target.uid){
					console.log('fn.sensors.enableCardDragAndDrop :: element ID != sensor ID');
					return false;
				}

				const dragSensor = sensors[drag.index];
				const targetSensor = sensors[target.index];
				const order = dragSensor.order;
				dragSensor.order = targetSensor.order;
				targetSensor.order = order;

				fn.sensors.saveOrder([dragSensor, targetSensor]);
			};
		});
	};

	/***************************************************************************
	 Общая функция-обработчик, запускающаяся после загрузки окна Настроек
	 ***************************************************************************/

	fn.SettingsPopUpLoadHandler = function() {
		DT.ws.isSettingsPageOpened = true;

		fn.settings.onloadBackEnd();
		fn.variables.load();
		fn.sensors.load();
		fn.ws.onLoad();

		window.FinishCallback = true;
	};

})(window, jQuery);
