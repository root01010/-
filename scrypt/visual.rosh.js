/*********************
 Исходные данные для расчёта установки в калькуляторе
 Шаг цепи, мм
 Количество звеньев цепи между поплавками, шт
 Количество зубьев на звезде, шт
 Количество поплавков, шт
 Диаметр поплавка, мм
 ********************/

(function (window) {
	"use strict";

	/* ================== КОНСТАНТЫ ================== */

	const SCALE = 4.1; // Масштаб
	const AIR_FILLING_END = 90;   // % наполнения в верхней точке
	const AIR_FILLING_START = 72; // % наполнения в нижней точке

	const MAX_INTERFACE_LOAD_ATTEMPTS = 20;
	const INTERFACE_RETRY_DELAY_MS = 50;

	window.scale = SCALE;
	window.airFilingEnd = AIR_FILLING_END;
	window.airFilingStart = AIR_FILLING_START;

	/* ================== ИНИЦИАЛИЗАЦИЯ ================== */

	const configList = fn.getStorageData('localStorage', 'configList');
	const currentConfig = localStorage.currentConfig || null;

	if (configList && currentConfig && configList[currentConfig]) {
		window.cfg = configList[currentConfig];
		fn.control.applyInputParameters(true);
	} else {
		fn.control.applyInputParameters();
	}

	fn.control.updateVisualisation();

	/* ================== ПРОВЕРКА ЗАГРУЗКИ ЗАВИСИМОСТЕЙ ================== */

	let loadAttempts = 0;

	function checkLoadedObjectsAndRunInterface() {
		const dependencies = {
			jQuery: typeof window.jQuery !== 'undefined',
			poshytip:
				typeof window.jQuery !== 'undefined' &&
				typeof window.jQuery.fn.poshytip !== 'undefined',
			scriptLoader: typeof window.$script !== 'undefined',
			JsHttpRequest: typeof window.JsHttpRequest !== 'undefined'
		};

		for (const name in dependencies) {
			if (!dependencies[name]) {
				loadAttempts++;

				if (loadAttempts > MAX_INTERFACE_LOAD_ATTEMPTS) {
					showInterfaceLoadError(name);
					return;
				}

				setTimeout(checkLoadedObjectsAndRunInterface, INTERFACE_RETRY_DELAY_MS);
				return;
			}
		}

		runInterface();
	}

	/* ================== ЗАПУСК ИНТЕРФЕЙСА ================== */

	function runInterface() {
		fn.QueueHandlers.unshift(
			fn.db.open,
			fn.windowEventHandler,
			fn.BodyClickHandler,
			fn.elementClickHandler,
			fn.PreloadPopUpData,
			fn.control.changeMode
		);

		fn.QueueHandlers.Load();

		$script('/scrypt/subscribeHandler.js', 'subscribeHandler');
	}

	/* ================== ОШИБКА ЗАГРУЗКИ ================== */

	function showInterfaceLoadError(dependencyName) {
		console.error('Ошибка загрузки интерфейса. Не загружено:', dependencyName);

		const body = document.body;
		if (!body) return;

		body.innerHTML = '';

		const wrapper = document.createElement('div');
		wrapper.className = 'fatal-error';

		const title = document.createElement('h2');
		title.textContent = 'Ошибка загрузки интерфейса';

		const text = document.createElement('p');
		text.textContent = `Не удалось загрузить компонент: ${dependencyName}`;

		const btn = document.createElement('button');
		btn.textContent = 'Обновить страницу';
		btn.addEventListener('click', () => location.reload());

		wrapper.append(title, text, btn);
		body.appendChild(wrapper);
	}

	document.addEventListener('DOMContentLoaded', checkLoadedObjectsAndRunInterface);

})(window);
