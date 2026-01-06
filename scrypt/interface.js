
(function(window, $) {

	"use strict";

	fn.cssOptions = function(){

		let root = document.documentElement;
		let style = getComputedStyle(root);
		let opt = {
			'body_font_size' : style.getPropertyValue('--body_font_size'),
			'popup_box_left_start': style.getPropertyValue('--popup_box_left_start'),
			'popup_box_left_end': style.getPropertyValue('--popup_box_left_end')
		};

		opt.body_font_size = (opt.body_font_size == '') ? 14 : parseInt(opt.body_font_size);

		return opt;
	};

	/***********************************************************************
	 Программный контроллер визуализации параметров
	 ************************************************************************/

	fn.control.parseInputValues = function(inputKey){
		var response = {};
		inputKey.forEach(function(item){
			if(item != 'configName'){
				response[item] = document.getElementById(item+'-input').value;
				response[item] = parseFloat(response[item]);
			}
		});
		return response;
	};

	fn.control.replaceInputValues = function(){
		DT.control.inputKey.forEach(function(item){
			let input = document.getElementById(item+'-input');
			if(item == 'configName'){
				input.value = cfg.configName;
			} else {
				input.value = cfg.input[item];
			}
		});
	};

	/***** Отрисовка звезды с заданным количеством зубьев *****/

	fn.control.createStar = function(container, uid, css, teethNumber){
		const NS = "http://www.w3.org/2000/svg";
		// Центральный круг
		const centerCircle = document.createElementNS(NS, "circle");
		centerCircle.setAttribute("r", "15");
		centerCircle.setAttribute("fill", "#555");
		// Внутренняя окружность (по основанию зубьев)
		const innerRing = document.createElementNS(NS, "circle");
		innerRing.setAttribute("r", "90");
		innerRing.setAttribute("fill", "none");
		innerRing.setAttribute("stroke", "#555");
		innerRing.setAttribute("stroke-width", "10");
		/* Метка на звезде (r = 80)
        const markAngle = -90; // В градусах, можно поменять
        const markRad = markAngle * Math.PI / 180;
        const markX = 60 * Math.cos(markRad);
        const markY = 60 * Math.sin(markRad);

        const mark = document.createElementNS(NS, "circle");
              mark.setAttribute("cx", markX);
              mark.setAttribute("cy", markY);
              mark.setAttribute("r", "8"); // Размер метки
              mark.setAttribute("fill", "#333"); // Цвет метки
        */// Зубья
		const teethGroup = document.createElementNS(NS, "g");
		// Полигон
		const mainGroup = document.createElementNS(NS, "g");
		mainGroup.setAttribute("transform", "translate(100,100)");
		mainGroup.appendChild(centerCircle);
		mainGroup.appendChild(innerRing);
		//    mainGroup.appendChild(mark);
		mainGroup.appendChild(teethGroup);
		// Общий блок
		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("id", uid);
		svg.classList.add(uid);
		svg.style.top = css.top + 'px';
		svg.style.left = css.left + 'px';
		svg.setAttribute("viewBox", "0 0 200 200");
		svg.appendChild(mainGroup);

		const teethCount = teethNumber;
		const angleStep = 360 / teethCount;
		const r1 = 90;
		const r2 = 100;
		const toothWidth = angleStep * 0.9; // градусов

		for (let i = 0; i < teethCount; i++) {
			const angle = i * angleStep;
			const midRad = angle * Math.PI / 180;
			const halfWidthRad = (toothWidth / 2) * Math.PI / 180;

			const x1 = r1 * Math.cos(midRad - halfWidthRad);
			const y1 = r1 * Math.sin(midRad - halfWidthRad);
			const x2 = r1 * Math.cos(midRad + halfWidthRad);
			const y2 = r1 * Math.sin(midRad + halfWidthRad);
			const x3 = r2 * Math.cos(midRad);
			const y3 = r2 * Math.sin(midRad);

			const polygon = document.createElementNS(NS, "polygon");
			polygon.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
			polygon.setAttribute("fill", "#000");

			teethGroup.appendChild(polygon);
		}

		// Вставка в DOM
		container.appendChild(svg);
	};

	/***** Постоянная динамическая визуализация модели, управляемая несколькими глобальными параметрами *****/

	// Персистентное состояние интегратора

	DT.control.sim = {
		prevT: null,
		acc: 0, // накопленный путь вдоль цепи, px
		vSmooth: 0, // сглаженная скорость, px/s
		syncTDC: false // Флаг верхней мёртвой точки
	};

	// Функция синхронизации при приходе внешнего импульса (флаг на доли секунды)

	fn.control.requestTDC = function () {
		DT.control.sim.syncTDC = true;
	};

	fn.control.updateVisualisation = function() {

		const now = Date.now() / 1000;
		const root = document.documentElement;
		const vTarget = (dt.starCircleLength * p.starRotationSpeed) / 60; // Скорость вращения установки, px/s

		p.speed = vTarget;

		if(p.starRotationSpeed == 0){
			root.style.setProperty('--starAnimation', 'none'); // spin 15s linear infinite;
		} else {
			root.style.setProperty('--starAnimation', 'spin '+(Math.round(100*60/p.starRotationSpeed)/100)+'s linear infinite');
		}

		/* === Интегратор хода === */

		// Шаг времени (с ограничением от выбросов)

		if (DT.control.sim.prevT === null) {
			DT.control.sim.prevT = now;
		}

		let dtSec = now - DT.control.sim.prevT;
		dtSec = (dtSec < 0) ? 0 : (dtSec > 0.05 ? 0.05 : dtSec); // 0.05 - защитный кламп до ~20 FPS
		DT.control.sim.prevT = now;

		// Эксп. сглаживание скорости, чтобы исключить ступени входного сигнала

		const tau = 0.15; // Постоянная времени сглаживания («плавность» реакции на изменения скорости), с
		const alpha = 1 - Math.exp(-dtSec / tau);
		DT.control.sim.vSmooth += (vTarget - DT.control.sim.vSmooth) * alpha;

		// Накапливаем путь вдоль замкнутой длины

		DT.control.sim.acc = (DT.control.sim.acc + DT.control.sim.vSmooth * dtSec) % dt.chainTotalLength;
		DT.control.sim.acc = (DT.control.sim.acc < 0) ? (DT.control.sim.acc + dt.chainTotalLength) : DT.control.sim.acc;

		// Ключевой момент: компенсируем формулу с time*p.speed
		// d = ... + (time*p.speed) + dynamicOffset  => хотим d = ... + acc
		const dynamicOffset = DT.control.sim.acc - now * p.speed;

		// ===== ваш расчёт позиций поплавков, без изменений, только подставляем dynamicOffset =====

		const time = now; // оставлено для совместимости с вашим кодом
		const staticOffset = dt.chainStraightLength + dt.starCircleLength / 4; // Смещение 1-го поплавка в ВМТ по умолчанию.

		// ---- Синхронизация по ВМТ по запросу ----

		if (DT.control.sim.syncTDC) {
			// Берём «первый» поплавок (тот, который вы считаете исходным)
			const f0 = (p.floaters && p.floaters.length) ? p.floaters[0] : null;
			const total = dt.chainTotalLength;

			// Хотим: (f0.offset*total + staticOffset + sim.acc) % total == staticOffset
			// => sim.acc ≡ -f0.offset*total (mod total)
			const phi0 = f0 ? (f0.offset * total) : 0;
			DT.control.sim.acc = (total - (phi0 % total)) % total;  // эквивалент «-phi0 mod total»

			// Сразу сбросим шаг времени, чтобы не поймать крупный dt
			DT.control.sim.prevT = performance.now() / 1000;

			// Снимаем флаг — выполняем ровно один кадр
			DT.control.sim.syncTDC = false;
		}

		p.floaters.forEach((f) => {

			let vmtOffset = 0; // Смещение 1-го поплавка в ВМТ в процессе синхронизации в реальном времени с положением действующей установки
			let d = (f.offset * dt.chainTotalLength + staticOffset + dynamicOffset + time * p.speed) % dt.chainTotalLength;
			let x = 0, y = 0, lengthSector = 'Not Set', progress = 0;

			let inLowerArc = false;
			let inUpperArc = false;
			let inLeft = false;
			let fill = 0;

			// Расчёт координат поплавков

			if (d < dt.chainStraightLength) { // Начиная с 9 часов нижнего поворота Вверх по левой стороне (Отметка 0)

				x = p.leftX;
				y = p.bottomY - d;
				progress = d / dt.chainStraightLength;
				progress = airFilingStart + (f.fill - airFilingStart) * progress;
				inLeft = true;

			} else

			if (d < dt.chainStraightLength + dt.starCircleLength / 4) { // Верхний поворот c 9 часов до 12 часов

				const local = d - dt.chainStraightLength;
				const angle = Math.PI + (local / (dt.starCircleLength / 2)) * Math.PI;
				x = p.centerX + (dt.starDiameter / 2) * Math.cos(angle);
				y = p.topY + (dt.starDiameter / 2) * Math.sin(angle);
				inUpperArc = true;
				progress = f.fill;
				lengthSector = d - dt.chainStraightLength;
				if(lengthSector > dt.starCircleLength / 8){
					progress = f.fill - (f.fill/2) * ((lengthSector - dt.starCircleLength / 8) / (dt.starCircleLength / 8));
				}

			} else

			if (d < dt.chainStraightLength + dt.starCircleLength / 2) { // Верхний поворот c 12 часов до 3 часов

				const local = d - dt.chainStraightLength;
				const angle = Math.PI + (local / (dt.starCircleLength / 2)) * Math.PI;
				x = p.centerX + (dt.starDiameter / 2) * Math.cos(angle);
				y = p.topY + (dt.starDiameter / 2) * Math.sin(angle);
				lengthSector = d - (dt.chainStraightLength + dt.starCircleLength / 4);
				progress = 0;
				if(lengthSector < dt.starCircleLength / 8){
					progress = f.fill/2 - (f.fill/2) * ((lengthSector) / (dt.starCircleLength / 8));
				}

			} else

			if (d < 2 * dt.chainStraightLength + dt.starCircleLength / 2) { // Вниз по правой стороне

				const local = d - (dt.chainStraightLength + dt.starCircleLength / 2);
				x = p.rightX;
				y = p.topY + local;
				progress = 0;

			} else

			if(d < 2 * dt.chainStraightLength + 3 * dt.starCircleLength / 4){ // Нижний поворот с 3 часов до 6-ти часов

				const local = d - (2 * dt.chainStraightLength + dt.starCircleLength / 2);
				const angle = (local / (dt.starCircleLength / 2)) * Math.PI;
				x = p.centerX + (dt.starDiameter / 2) * Math.cos(angle);
				y = p.bottomY + (dt.starDiameter / 2) * Math.sin(angle);
				progress = 0;

			} else  { // Задув. Нижний поворот с 6 часов до 9-ти часов

				const local = d - (2 * dt.chainStraightLength + dt.starCircleLength / 2);
				const angle = (local / (dt.starCircleLength / 2)) * Math.PI;
				x = p.centerX + (dt.starDiameter / 2) * Math.cos(angle);
				y = p.bottomY + (dt.starDiameter / 2) * Math.sin(angle);
				inLowerArc = true;
				lengthSector = d - (2 * dt.chainStraightLength + 3 * dt.starCircleLength / 4);
				progress = airFilingStart * (lengthSector / (dt.starCircleLength / 4));
			}

			// Расчёт наполнения поплавков

			fill = progress;

			f.fillLayer.style.height = `${fill}%`;
			f.el.style.transform = `translate(${x}px, ${y}px)`;
			//	f.el.setAttribute('title', lengthSector);
		});

		requestAnimationFrame(fn.control.updateVisualisation);
	};

	/***** Отрисовка параметров в блоке генерации *****/

	fn.control.visualGeneratorBlock = function(action = 'play', data = {}) {

		DT.generator.lineSpeedEl = DT.generator.lineSpeedEl || document.getElementById('floatSpeed');
		DT.generator.rotationEl = DT.generator.rotationEl || document.getElementById('generatorRotation');
		DT.generator.energyEl = DT.generator.energyEl || document.getElementById('fullEnergyOut');

		switch(action){

			case 'reload': // Действие при обнаружении перезагрузки страницы

				if(DT.generator.prevAction && (DT.generator.prevAction == 'play' || DT.generator.prevAction == 'pause')){
					sessionStorage.setItem('generatorEnergy', DT.generator.energy);
					sessionStorage.setItem('generatorEnergyTime', DT.generator.energyTime);
				}
				break;

			case 'stop':

				DT.generator.lineSpeed = DT.emptyValue;
				DT.generator.rotation = DT.emptyValue;
				DT.generator.energy = DT.emptyValue;
				DT.generator.energyTime = 0;

				sessionStorage.removeItem('generatorEnergy');
				sessionStorage.removeItem('generatorEnergyTime');
				break;

			case 'pause':

				DT.generator.lineSpeed = DT.generator.lineSpeed || DT.emptyValue;
				DT.generator.rotation = DT.generator.rotation || DT.emptyValue;
				DT.generator.energy = DT.generator.energy || DT.emptyValue;
				DT.generator.energyTime = Date.now();
				break;

			case 'play':

				if(DT.settings.controller.rotation.isEnable == 'on') {
					DT.generator.lineSpeed = parseInt(p.speed * window.scale);
				} else {
					DT.generator.lineSpeed = DT.emptyValue;
				}

				DT.generator.rotation = fn.evaluateExpression(DT.settings.controller.generator.rotation, data);
				DT.generator.power = fn.evaluateExpression(DT.settings.controller.generator.energy, data);

				if(DT.generator.power != DT.emptyValue){
					// Попытка восстановить значение после перезагрузки страницы
					if(typeof DT.generator.energy == 'undefined'){
						if(typeof sessionStorage.generatorEnergy != 'undefined' && typeof sessionStorage.generatorEnergyTime != 'undefined'){
							if(sessionStorage.generatorEnergy != DT.emptyValue){
								DT.generator.energy = parseInt(sessionStorage.generatorEnergy);
								DT.generator.energyTime = parseInt(sessionStorage.generatorEnergyTime);
							}
						}
					}
					// Первый запуск. Либо переписываем значения, либо ноль				
					DT.generator.energy = (DT.generator.energy && DT.generator.energy != DT.emptyValue) ? DT.generator.energy : 0;
					DT.generator.energyTime = DT.generator.energyTime || Date.now();
					DT.generator.energy += parseFloat(DT.generator.power) * ((Date.now() - DT.generator.energyTime)/1000); // Суммирование энергии в Джоулях
				}

				DT.generator.energy = DT.generator.energy || 0;
				DT.generator.energyTime = Date.now();

				break;
		}

		DT.generator.lineSpeedEl.innerHTML = DT.generator.lineSpeed;
		DT.generator.rotationEl.innerHTML = (typeof DT.generator.rotation === 'number') ? parseInt(DT.generator.rotation) : DT.generator.rotation;
		DT.generator.energyEl.innerHTML = (typeof DT.generator.energy === 'number') ? (DT.generator.energy/3600).toFixed(2) : DT.generator.energy;
		DT.generator.prevAction = action;
	};

	/*************************************
	 СЕНСОРЫ
	 *********************************/

	fn.sensors.updateFrontEndValues = function(sensors, data = 'clear'){

		sensors.forEach(sensor => {

			let value = (typeof data === 'string' && data == 'clear') ? DT.emptyValue : fn.evaluateExpression(sensor.source, data);
			let uid = 'sensor_'+sensor.id;

			if(value != DT.emptyValue){
				value = fn.sensors.format(value, sensor.format);
			}

			if(typeof DT.sensors[uid] === 'undefined' || value != DT.sensors[uid]){
				const el = document.getElementById(uid);
				if (el) {
					el.querySelector('span.value').innerHTML = value;
				}
				DT.sensors[uid] = value;
			}
		});
	};

	fn.sensors.renderFrontEnd = function(sensors){

		const blockList = ['leftSensor', 'rightSensor'];
		blockList.forEach(function(key){
			let parent = document.getElementById(fn.sensors.area[key]);
			let children = parent.querySelectorAll('.'+key);
			children.forEach(el => el.remove());
		});

		sensors.forEach(sensor => {
			const block = document.getElementById(sensor.elUid);
			if (!block) {
				return;
			}
			const div = document.createElement('div');
			div.id = 'sensor_' + sensor.id;
			div.title = sensor.name || div.id;
			div.className = (!sensor.location) ? 'rightSensor' : sensor.location;
			div.style.top = sensor.top || '30px';
			div.style.position = 'absolute';
			div.draggable = true;
			let HTML = '<span class="value">'+(typeof DT.sensors[div.id] === 'undefined' ? '--' : DT.sensors[div.id])+'</span>';
			HTML += '<span class="letter">'+sensor.unit+'</span>';
			div.innerHTML = HTML;
			div.addEventListener('dragstart', e => {
				e.dataTransfer.setData('text/plain', sensor.id);
			});
			div.addEventListener('dragend', e => {
				const blockRect = block.getBoundingClientRect();
				const y = e.clientY - blockRect.top;
				const topValue = y + 'px';
				div.style.top = topValue;

				const sensorItem = sensors.find(s => s.id === sensor.id);
				if(sensorItem) {
					sensorItem.top = topValue;
					fn.sensors.save(sensorItem);
				}
			});
			block.appendChild(div);
		});
	};

	/**************************************
	 Обработчик глобальных window событий
	 ********************************************************/

	fn.windowEventHandler = function(){

		// При перезагрузке страницы сохраняем важные сессионные данные	 
		window.addEventListener('beforeunload', function () {
			fn.control.visualGeneratorBlock('reload');
		});
	};


	/**************************************
	 Обработчик нажатия закрывающих элементов управления
	 ********************************************************/

	fn.BodyClickHandler = function() {

		$('#body').on('click', '#fade, #close', function() {
			if(!fn.IsClickAllowed()) {
				return false;
			}
			switch($(this)[0].id){
				case "fade" :
				case "close" :
					fn.ClosePopUp();
					break;
			}
		});
	};

	/*****************************************************
	 Обработчик нажатий по кнопкам интерфейса
	 ********************************************************/

	fn.elementClickHandler = function(){

		const root = document.documentElement;

		/* Обработчик кликов по Меню в нижнем правом углу интерфейса */

		let menu = {};
		menu.settings = document.getElementById('buttonSettings');
		menu.settings.addEventListener('click', (e) => {
			fn.Settings('view');
		});
		menu.statusButton = document.getElementById('buttonConnectStatus');
		menu.statusButton.addEventListener('click', (e) => {
			let IP = localStorage.getItem('websocket_IP');
			if (menu.statusButton.classList.contains('connect')) {
				fn.ws.connect();
			} else
			if(IP){
				fn.ws.connect(true, IP);
				fn.ws.onOpenHandle = () => {
					if(DT.control.dysplayStatus == 'disconnect'){
						fn.control.dysplayStatus('ready'); // При подключении, сообщаем о готовности
					}
				};
			}
		});

		/* Обработчик кликов по пунктам выбора режима контроллера в блоке "Обработка потоковых данных"  */

		let controllerChangeMode = document.getElementById('controllerChangeMode');
		controllerChangeMode.addEventListener('click', (e) => {
			let mode = e.target.getAttribute('data-mode');
			controllerChangeMode.style.height = '0px';
			fn.control.changeMode(mode, 'init');
			setTimeout(function(){ controllerChangeMode.style.height = 'auto'; }, 100);
		});

		/* Обработчик кликов по панели с кнопками СТОП/ПАУЗА/PLAY контроллера визуализации  */

		let controllerButton = document.getElementById('controlButtons');
		controllerButton.addEventListener('click', (e) => {
			if (e.target.matches('.controlButtons')) {
				let status = e.target.id;
				status = status.replace('button', '');
				status = status.toLowerCase();

				if(fn.control.status() != status){
					fn.control.visualisation(status);
				}
			}
		});

		/* Обработчик кликов по кнопкам редактирования/удаления пользовательских переменных или датчиков во всплывающем окне Настроек */

		document.addEventListener('click', function(e) {
			if (e.target.matches('.variable_edit')) {
				fn.variables.editAction(e.target);
			} else
			if (e.target.matches('.variable_delete')) {
				fn.variables.deleteAction(e.target);
			} else
			if (e.target.matches('.sensor_edit')) {
				fn.sensors.editAction(e.target);
			} else
			if (e.target.matches('.sensor_delete')) {
				fn.sensors.deleteAction(e.target);
			}
		});

		/* Обработчик кликов по элементам блока ввода параметров */

		const saveConfigButton = document.getElementById('saveConfig');
		saveConfigButton.addEventListener('click', (e) => {

			if(!saveConfigButton.classList.contains('active')){
				return false;
			}

			/* var configList = fn.getStorageData('localStorage', 'configList');
                   configList = (!configList) ? [] : configList;
                   configList.push(cfg); */

			fn.control.applyInputParameters();

			var configList = [];
			configList.push(cfg);
			configList = JSON.stringify(configList);
			localStorage.setItem('configList', configList);
			localStorage.setItem('currentConfig', 0);

			saveConfigButton.classList.add('active');
			setTimeout(function(){
				saveConfigButton.classList.remove('active');
			}, 500);
		});

		DT.control.inputKey.forEach(function(id) {
			var el = document.getElementById(id+'-input');
			if(!el){ console.log(id);
				return;
			}
			el.setAttribute('previos-value', el.value);
			el.addEventListener('input', (e) => {
				const currentValue = e.target.value;
				const prevValue = e.target.getAttribute('previos-value');

				if (e.inputType === 'insertReplacementText' && currentValue !== prevValue) {
					saveConfigButton.classList.add('active');
					fn.control.applyInputParameters(e);
				}
				e.target.setAttribute('previos-value', currentValue);
			});

			el.addEventListener('blur', function(e){
				saveConfigButton.classList.add('active');
				fn.control.applyInputParameters(e);
			});
			el.addEventListener('keydown', function(e) {
				if (e.key === 'Enter') {
					saveConfigButton.classList.add('active');
					fn.control.applyInputParameters(e);
				}
			});
		});

		/* Обработчик изменения ширины панели статистики */

		const box = document.getElementById('resizableArea');
		const boxLine = document.getElementById('resizableAreaLine');

		let isResizing = false;
		let startX = 0;
		let startWidth = 0;

		boxLine.addEventListener('mousedown', (e) => {
			isResizing = true;
			startX = e.clientX;
			startWidth = getComputedStyle(root).getPropertyValue('--resizableArea_width').trim();
			startWidth = startWidth.replace('px', '');
		});

		document.addEventListener('mousemove', (e) => {
			if (!isResizing) return;
			const dx = e.clientX - startX;
			let currentWidth = startWidth - 2 * dx;
			let minWidth = getComputedStyle(root).getPropertyValue('--resizableArea_minWidth').trim();
			minWidth = minWidth.replace('px', '');
			currentWidth = (currentWidth < minWidth) ? minWidth : currentWidth;
			root.style.setProperty('--resizableArea_width', currentWidth + 'px');
			localStorage.setItem('resizableArea_width', currentWidth);
		});

		document.addEventListener('mouseup', () => {
			if(isResizing){
				isResizing = false;
			}
		});
	};

	/***************
	 POPUP FUNCTION
	 ********************/

	fn.fade = function() {
		var fade = $("#fade");
		if (!fade.exists()) fade = $("<div/>", {"id":"fade"}).appendTo("body");
		return fade;
	};

	fn.PopUpIsOpened = function(box, data) {

		var b = (!box) ? ['#popupbox', '#popup_box'] : [box], l = b.length;

		if($.type(box) == 'undefined' || $.type(data) == 'undefined') {

			for(var i in b) {
				var el = $(b[i]), pp = el.data('PopUpIsOpened');
				if($.type(pp) != 'undefined' && pp !== false) {
					return (l > 1) ? true : el;
				} else
				if(l == 1) {
					return false;
				}
			} return false;

		} else {

			$(b[0]).data('PopUpIsOpened', data);

		}
	};

	fn.PreloadUrl = function(id, url, callback) {

		var id = id || '', extArr = ['.php', '.html', 'http'];

		if(!$("#tmp_for_iframe").exists()) {
			$("<div/>", {"id":"tmp_for_iframe"}).appendTo("body").css({'display':'none'});
		}

		if(extArr.some(function(ext){ return url.indexOf(ext) != -1 ? true: false; })) {
			var iframe = $("<iframe/>", {"id": id, "src": url}).appendTo("#tmp_for_iframe");
			iframe.one('load onload', function() {
				if(typeof callback === 'function') callback(document.getElementById(id).contentWindow.document.body.innerHTML);
				setTimeout(function() { $("#tmp_for_iframe").empty(); }, 1000);
			});
			iframe.one('error onerror', function() {
				if(typeof callback === 'function') callback(false);
			});

		} else {

			if(typeof callback === 'function') callback($(url).html());

		}
	};

	fn.ViewPopUp = function(url, popUpType, menu, callback) {

		var id = (popUpType == 'large') ? '#popup_box' : '#popupbox', html = (popUpType == 'large') ? '#popup_box' : '#popupbox .msg_content';
		var variable = fn.CheckAllowedParamsAndConstructVariable();

		if((popUpType == 'large' && !variable) || fn.PopUpIsOpened()) {
			return false;
		}

		fn.PopUpIsOpened(id, true);

		var fade = fn.fade();
		fade.addClass('cursor_wait').fadeIn();
		var eq = (variable !== false && parseInt(variable.value) > 1) ? parseInt(variable.value)-1 : 0, prev = eq, callback = callback || null;

		fn.PreloadUrl('tmp_iframe', url, function(r) {

			if(!r) {
				fn.PopUpIsOpened(id, false);
				fade.removeClass('cursor_wait').fadeOut();
				return false;
			}

			$(html).html(r);

			// FinishCallback - Флаг окончания загрузки обратного вызова. Меняется на true во внешней функции после полной её отработки

			window.FinishCallback = (callback !== null) ? false : true;

			var Doload = setInterval (function() {

				if(callback !== null) {
					callback(id);
					callback = null;
				}

				if(!FinishCallback) {
					return false;
				}

				clearInterval(Doload);

				switch(popUpType) {

					case 'large' :

						var pp = $(id), mn = pp.find("#menu li"), cnt = pp.find(".content");

						if(eq >= cnt.length) {
							DT.UrlParams[variable.name] = cnt.length; eq = cnt.length-1; prev = eq;
						} else
						if(parseInt(variable.value) < 1) {
							DT.UrlParams[variable.name] = 1;
						}

						if(mn.length > 0) {
							cnt.css({ 'display': 'none', 'margin-top' : '30px' }).eq(eq).css({'display':'block'});
							mn.removeClass('active').eq(eq).addClass('active');
						}

						$(id).CSSanimate('WindowLeftRight', function(){

							let opt = fn.cssOptions();

							$(id).css({'left': opt.popup_box_left_end });
							fn.DeliverData.change({sender: 'fn.ViewPopUp', id: id });

							if(mn.length>0) {
								mn.unbind('click').click(function() {
									var is = $(this).index(), exit = cnt.length, clickAllowed = mn.eq(is).data('clickAllowed');
									if(!fn.IsClickAllowed() || ($.type(clickAllowed) != 'undefined' && !clickAllowed) || prev == is) {
										return false;
									}
									if(is == exit) {
										fn.ClosePopUp();
										return false;
									}

									mn.data('clickAllowed', false).removeClass('active');
									mn.eq(is).addClass('active');

									cnt.eq(prev).slideUp('normal', function(){
										cnt.eq(is).slideDown('normal', function() {
											DT.UrlParams[variable.name] = is+1;
											mn.data('clickAllowed', true);
											prev = is;
										});
									});
								}); // mn.click
							} // mn.length
						}); // $(id).CSSanimate

						break;

					default:

						var width = ((fn.WindowWidth() - 20) < popUpType) ? (fn.WindowWidth() - 20) : popUpType, margin_left = (width + 10) / 2;
						$(id).css({'width' : width+'px', 'margin-left' : -margin_left}).fadeIn();
						var margin_top = ($(id).height() + 10) / 2;
						$(id).css({ 'margin-top' : -margin_top});
						fn.DeliverData.change({sender: 'fn.ViewPopUp', id: id });

						break;
				}

				fade.removeClass('cursor_wait');

			}, 200);
		});
	};

	fn.CloseLightPopUp = function(handle) {

		var popupbox = fn.PopUpIsOpened('#popupbox'), fade = fn.fade();

		if(popupbox) {
			fn.disableMouseEvents();
			popupbox.fadeOut('normal', function(){
				popupbox.find('.msg_content').empty();
				fn.PopUpIsOpened('#popupbox', false);
				if($.type(handle) == 'function') handle();
				fn.enableMouseEvents();
			});

			fade.fadeOut();
			fn.DeliverData.change({sender: 'fn.ClosePopUp', id: '#popupbox' });
			return true;
		}
		return false;
	};

	fn.CloseComplexPopUp = function(handle) {
		var popup_box = fn.PopUpIsOpened('#popup_box'), fade = fn.fade();
		if(popup_box) {
			fn.disableMouseEvents();
			popup_box.CSSanimate('WindowLeftRight', function() {
				let opt = fn.cssOptions();
				popup_box.css({'left': opt.popup_box_left_start}).empty();
				fn.PopUpIsOpened('#popup_box', false);
				if($.type(handle) == 'function') handle();
				fn.enableMouseEvents();
			});
			fade.fadeOut();
			fn.ResetAllowedParams();
			fn.DeliverData.change({sender: 'fn.ClosePopUp', id: '#popup_box' });
			return true;
		}
		return false;
	};

	fn.ClosePopUp = function() {

		if(fn.CloseLightPopUp()){
			return false;
		}
		if(fn.CloseComplexPopUp()){
			return false;
		}
		Bfn.DeliverData.change({sender: 'fn.ClosePopUp', id: false });
	};

	fn.PreloadPopUpData = function() {
		$.ajax({ type: "GET",
			url: 'xhr/popup.html',
			success: function(d) {
				$("body").append(d);
				fn.DeliverData.change({sender: 'fn.PreloadPopUpData', action: 'Loaded', data: d });
			}
		});
	};


	/******************************
	 POPUP SETTINGS FUNCTION
	 ****************************/

	fn.Settings = function(action, tab) {

		var action = action || '';

		/* Отображение окна настроек */

		if (action == 'view') {
			var tab = tab || 2; DT.UrlParams.settingsPage = parseInt(tab);
			fn.ViewPopUp( 'xhr/settings.html', 'large', true, function(){
				$script('scrypt/settings.interface.js', 'settingsInterface');
				$script.ready('settingsInterface', function(){
					fn.SettingsPopUpLoadHandler();
				});
			});
			return false;
		}

		/* Сохранение настроек */

		var settingsSaved = function(msg) {
			var saved = msg || 'Сохранено!';
			$('#saved_settings').html(saved).fadeIn().delay(1000).fadeOut();
		};
		var afterSaveHandler = function() {
			settingsSaved();
		};

		var one_set = ['horizontal_cell', 'vertical_cell', 'max_table', 'renew_time', 'bg_color', 'bg_image', 'bg_class', 'pn_brightness', 'bk_radius'];
		var contextArguments = arguments;
		var submitSwitch = false, action = action.split(','), Upload = {};

		fn.DeliverData.change({sender: 'fn.Settings', action: 'Save', data: action });

		action.forEach(function(act){

			act = act.trim();

			if(one_set.indexOf(act) !== -1) {
				var p = String($('#'+act).val());
				DT.Setting[act] = Upload[act] = p;
				submitSwitch = true;
			}

			switch(act) {

				case 'bkmkCreationMethod' :
					var p = ($('#'+act+'ThumbInput').is(':checked')) ? 'thumb' : 'screen';
					if(!DT.Setting[act] || DT.Setting[act] != p) {
						DT.Setting[act] = Upload[act] = p;
						submitSwitch = true;
					}
					break;

				case 'isUsedDomainCOM' :
				case 'isOpenInNewTab' :
				case 'isOpenLocalLink' :
				case 'isCreateBookmarkInBg':
				case 'isCreateScreenWithExt':
				case 'isCreateBackUpWithExt':
				case 'isAllowedSendErrorToWeb':
				case 'screenshot' :
				case 'restore' :
				case 'bgsave' :
					var p = {}; p[act] = ($('#'+act).is(':checked')) ? 'yes' : 'no';
					break;
			}
		});

		if(submitSwitch) {
			/* Сохраняем настройки */
			afterSaveHandler();
		}
	};

})(window, jQuery);