(function(window, $) {
	"use strict";

	/********** ГЛОБАЛЬНЫЕ ОБЪЕКТЫ **********/
	const fn = window.fn = window.fn || {};
	const DT = window.DT = window.DT || {};
	DT.storage = DT.storage || {};
	DT.settings = DT.settings || {};
	DT.STATISTIC = DT.STATISTIC || [];
	DT.PostErr = DT.PostErr || '';
	DT.emptyValue = DT.emptyValue || null;
	DT.allowedGetParams = DT.allowedGetParams || [];

	/********** ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ JQUERY **********/
	$.fn.exists = function() { return this.length > 0; };
	$.fn.CSSanimate = function(keyFramesName, callback) {
		$(this).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(e) {
			if ($(this).hasClass(keyFramesName)) {
				$(this).removeClass(keyFramesName + ' animated');
				if (callback) callback(e);
			}
		});
		$(this).addClass(keyFramesName + ' animated');
		return $(this);
	};

	/********** Поддержка dataTransfer в старых версиях jQuery **********/
	if ($.event && $.event.props && $.event.props.indexOf('dataTransfer') === -1) {
		$.event.props.push('dataTransfer');
	}

	/********** НАСТРОЙКА AJAX **********/
	$.ajaxSetup({
		cache: false,
		timeout: 10000,
		type: "POST",
		url: "/post.php",
		beforeSend: function() {
			$('input[type=button], input[type=submit], .submit_button').attr('disabled', 'disabled');
		},
		complete: function() {
			setTimeout(() => {
				$('input[type=button], input[type=submit], .submit_button').removeAttr('disabled');
			}, 500);
		},
		error: function(d, e, m) {
			if (m) DT.PostErr += ' [' + m + ']';
			console.log(DT.PostErr);
		}
	});

	/********** ОЧЕРЕДЬ ОБРАБОТЧИКОВ **********/
	Object.defineProperty(fn, "QueueHandlers", { value: [] });
	Object.defineProperty(fn.QueueHandlers, "Load", {
		value: function LoadQueueHandlers() {
			const queue = fn.QueueHandlers || [];
			if (!$.isArray(queue) || queue.length === 0) return fn.QueueHandlers;

			const func = queue.shift();
			if (func && $.isFunction(func)) func();
			if (queue.length) fn.QueueHandlers.Load();
		}
	});

	/********** ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ **********/
	fn.IsNumeric = s => !isNaN(parseFloat(s)) && isFinite(s); // Проверка числа
	fn.ObjLength = obj => Object.keys(obj || {}).length; // Количество свойств объекта
	fn.WindowWidth = () => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth; // Ширина окна
	fn.WindowHeight = () => window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; // Высота окна
	fn.IsClickAllowed = () => ($.type(DT.LastClickTime) !== 'undefined' && (Date.now() - DT.LastClickTime) < 500) ? false : true; // Проверка быстрого клика
	fn.disableMouseEvents = () => $('body').addClass('disableMouseEvents'); // Отключить мышь
	fn.enableMouseEvents = () => $('body').removeClass('disableMouseEvents'); // Включить мышь

	/********** OBSERVABLE **********/
	fn.Observable = function() {
		this.deliverData = false; // Данные для передачи
		this.observers = []; // Список наблюдателей
	};
	fn.Observable.prototype.deliver = function(deliverData) {
		this.observers.forEach(item => {
			if (typeof item === 'object' && typeof item.func === 'function') {
				item.func.call(item.context, deliverData); // Вызов функции в нужном контексте
			}
		});
	};
	fn.Observable.prototype.change = function(data) {
		this.deliverData = data;
		this.deliver(this.deliverData); // Сообщаем всем наблюдателям
	};
	fn.DeliverData = new fn.Observable();
	fn.DeliverData.onChange = fn.DeliverData; // Для совместимости со старым кодом

	/********** LOCAL / SESSION STORAGE **********/
	fn.getStorageData = function(type, name) {
		if (!type || !name || (type != 'localStorage' && type != 'sessionStorage')) {
			console.log('Bd.getStorageData: не указан тип или имя');
			return false;
		}
		try {
			let data = window[type][name];
			if (!data || !(data = JSON.parse(data))) {
				console.log(`Bd.getStorageData: ${type}.${name} не найден, возможно плохой JSON`);
				return false;
			}
			return data;
		} catch (e) {
			console.log(`Bd.getStorageData: ${type}.${name} ошибка, возможно плохой JSON`);
			return false;
		}
	};

	/********** PARSE URL **********/
	fn.decodeURIComponent = function(str) {
		let out = '', arr = str.split(/(%(?:D0|D1)%.{2})/);
		for (let i = 0, l = arr.length; i < l; i++) {
			let x;
			try { x = decodeURIComponent(arr[i]); } catch(e) { x = arr[i]; }
			out += x;
		}
		return out;
	};

	fn.ParseUrl = function(str, component) {
		let data;
		try { data = new URL(str); }
		catch(e) { data = {protocol:'http',hostname:'error.host',port:80,username:'',password:'',pathname:'/',search:'',hash:''}; }

		switch(component) {
			case 'URL_SCHEME': return data.protocol;
			case 'URL_HOST': return data.hostname;
			case 'URL_PORT': return data.port;
			case 'URL_USER': return data.username;
			case 'URL_PASS': return data.password;
			case 'URL_PATH': return data.pathname;
			case 'URL_QUERY': return data.search;
			case 'URL_FRAGMENT': return data.hash;
			default:
				const response = {};
				const mask = { scheme:'protocol', host:'hostname', port:'port', user:'username', password:'password', path:'pathname', query:'search', fragment:'hash' };
				for(let key in mask){
					if(data[mask[key]] !== '') response[key] = data[mask[key]];
				}
				return response;
		}
	};

	fn.ParseUrlQuery = function(url) {
		const data = {};
		url = (!url) ? window.location.search : fn.ParseUrl(url, 'URL_QUERY');
		if(url){
			const pair = url.replace('?', '').split('&');
			pair.forEach(paramStr => {
				const param = paramStr.split('=');
				data[param[0]] = (param[1] && typeof param[1]==='string') ? fn.decodeURIComponent(param[1]) : '';
			});
		}
		return data;
	};

	DT.UrlParams = fn.ParseUrlQuery();

	/********** ФУНКЦИИ РАБОТЫ С БАЗОЙ ДАННЫХ И WEBSOCKET **********/

	fn.db = {};
	fn.settings = {};
	fn.variables = {};
	fn.sensors = {};
	fn.ws = {};

// -------------------- БАЗА ДАННЫХ --------------------
	fn.db.open = function() {
		// Открытие IndexedDB с названием 'rosh_db' и версией 3
		const request = indexedDB.open('rosh_db', 3);

		request.onupgradeneeded = e => {
			const db = e.target.result;
			fn.db.resource = db;

			// Создание таблицы настроек
			if (!db.objectStoreNames.contains('settings')) {
				const store = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
				store.createIndex('chapter', 'chapter', { unique: false });
				store.createIndex('section', 'section', { unique: false });
				store.createIndex('name', 'name', { unique: false });
				store.createIndex('chapter_section_name', ['chapter', 'section', 'name'], { unique: true });
			}

			// Создание других таблиц
			['configList', 'sensors', 'variables', 'statistics'].forEach(tbl => {
				if (!db.objectStoreNames.contains(tbl)) db.createObjectStore(tbl, { keyPath: 'id', autoIncrement: true });
			});
		};

		request.onsuccess = e => {
			fn.db.resource = e.target.result;
			fn.db.read(false, fn.db.readHandler); // Чтение всех таблиц
		};

		request.onerror = e => console.error('Ошибка DB', e);
	};

// Чтение таблиц из базы
	fn.db.read = function(table = false, callback = () => {}) {
		const tables = table ? [table] : ['settings', 'configList', 'variables', 'sensors', 'statistics'];
		const db = fn.db.resource;
		if (!db) return false;

		const tx = db.transaction(tables, 'readonly');

		tables.forEach(key => {
			const store = tx.objectStore(key);
			const req = store.getAll();
			req.onsuccess = () => callback(key, req.result);
		});
	};

// Запись или обновление записи
	fn.db.set = function(table, data, callback = () => {}) {
		const db = fn.db.resource;
		if (!db) return false;

		const tx = db.transaction(table, 'readwrite');
		const store = tx.objectStore(table);
		if (!data.id || data.id === 0) store.add(data);
		else store.put(data);

		tx.oncomplete = callback;
	};

// Удаление записи
	fn.db.delete = function(table, data, callback = () => {}) {
		const db = fn.db.resource;
		if (!db) return false;

		const tx = db.transaction(table, 'readwrite');
		const store = tx.objectStore(table);
		store.delete(data.id);

		tx.oncomplete = callback;
	};

// -------------------- НАСТРОЙКИ --------------------
	fn.settings.dbHandler = function(data) {
		data.forEach(item => {
			if (!DT.settings[item.chapter]) DT.settings[item.chapter] = {};
			if (!DT.settings[item.chapter][item.section]) DT.settings[item.chapter][item.section] = {};
			DT.settings[item.chapter][item.section][item.name] = item.value;
		});
	};

// Сохранение настроек
	fn.settings.save = function(update, indexName = 'chapter_section_name', callback = () => {}) {
		const db = fn.db.resource;
		if (!db) return false;

		const tx = db.transaction('settings', 'readwrite');
		const store = tx.objectStore('settings');
		const index = store.index(indexName);

		update = Array.isArray(update) ? update : [update];
		update.forEach(item => {
			const req = index.get([item.chapter, item.section, item.name]);
			req.onsuccess = e => {
				const record = e.target.result;
				if (record) record.value = item.value, store.put(record);
				else store.add(item);
			};
		});

		tx.oncomplete = callback;
	};

// -------------------- ПОЛЬЗОВАТЕЛЬСКИЕ ПЕРЕМЕННЫЕ --------------------
	fn.variables.sort = function(data) {
		if (data) DT.storage.variables.response = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		return DT.storage.variables?.response || false;
	};

	fn.variables.load = function() {
		fn.db.read('variables', (key, data) => {
			if (key === 'variables') fn.variables.sort(data);
		});
	};

	fn.variables.save = function(variable) {
		const variables = fn.variables.sort();
		if (!variable.id || variable.id === 0) delete variable.id, variable.order = variables?.length || 0;
		fn.db.set('variables', variable, fn.variables.load);
	};

// -------------------- ДАТЧИКИ --------------------
	fn.sensors.sort = function(data) {
		if (data) DT.storage.sensors.response = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		return DT.storage.sensors?.response || false;
	};

	fn.sensors.load = function() {
		fn.db.read('sensors', (key, data) => {
			if (key === 'sensors') fn.sensors.sort(data);
		});
	};

	fn.sensors.save = function(sensor) {
		const sensors = fn.sensors.sort();
		if (!sensor.id || sensor.id === 0) delete sensor.id, sensor.order = sensors?.length || 0;
		fn.db.set('sensors', sensor, fn.sensors.load);
	};

// -------------------- WEBSOCKET --------------------
	DT.ws.o = null;
	DT.ws.lastMessageTime = null;
	DT.ws.maxTimeout = 12;
	DT.ws.isSettingsPageOpened = false;

	fn.ws.connect = function(ip = false) {
		if (DT.ws.o) return console.log('WebSocket уже открыт');

		ip = ip || localStorage.getItem('websocket_IP') || '127.0.0.1';
		DT.ws.o = new WebSocket('ws://' + ip + ':81/');

		DT.ws.o.onopen = () => {
			console.log('Соединение WebSocket установлено');
			DT.ws.lastMessageTime = Date.now();
		};

		DT.ws.o.onmessage = e => {
			try {
				const data = JSON.parse(e.data);
				console.log('Получены данные:', data);
				DT.ws.lastMessageTime = Date.now();
			} catch {
				console.error('Ошибка парсинга WebSocket данных');
			}
		};

		DT.ws.o.onclose = () => {
			console.log('WebSocket закрыт');
			DT.ws.o = null;
		};

		DT.ws.o.onerror = () => console.error('Ошибка WebSocket');
	};

	fn.ws.onLoad = function() {
		// ... код инициализации ...

		// Запуск таймаута проверки WebSocket
		if (typeof fn.ws.checkInactivity === 'function') {
			setInterval(fn.ws.checkInactivity, 2000);
		}
	};

})(window, jQuery);

