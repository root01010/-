// Обработчик событий в ядре сайта

(function (window, $) {
	"use strict";

	const DEBUG = false;

	const EVENTS = {
		PRELOAD_USER_DATA: 'fn.PreloadUserData',
		VIEW_POPUP: 'fn.ViewPopUp',
		CLOSE_POPUP: 'fn.ClosePopUp',
		SETTINGS_SAVE: 'fn.settings.save'
	};

	fn.subscribeHandler = function (event) {
		if (!event || !event.sender) {
			console.warn('subscribeHandler: invalid event', event);
			return;
		}

		if (DEBUG) {
			console.log(
				'fn.subscribeHandler =>',
				event.sender,
				event.action ? `[${event.action}]` : ''
			);
		}

		switch (event.sender) {

			case EVENTS.PRELOAD_USER_DATA: {
				const root = document.documentElement;
				if (root) {
					root.style.setProperty('--theme_transition', '0.3s');
				}
				break;
			}

			case EVENTS.VIEW_POPUP:
				if (window.DT?.ws) {
					DT.ws.isSettingsPageOpened = true;
				}
				break;

			case EVENTS.CLOSE_POPUP:
				if (window.DT?.ws) {
					DT.ws.isSettingsPageOpened = false;
				}
				break;

			case EVENTS.SETTINGS_SAVE:
				if (fn.control?.visualisation) {
					fn.control.visualisation('stop');
				}
				break;

			default:
				if (DEBUG) {
					console.warn('subscribeHandler: unknown event', event.sender);
				}
		}
	};

	if (fn.DeliverData?.onChange) {
		fn.subscribeHandler.subscribe(fn.DeliverData.onChange);
	} else {
		console.error('DeliverData.onChange not found');
	}

})(window, jQuery);
