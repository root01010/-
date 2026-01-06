
(function(window) {
	
  "use strict";
  
  /***********************************************************************
   ***********************************************************************
     Программный контроллер визуализации параметров
   ***********************************************************************
  ************************************************************************/
	
	DT.control.syncInterval = false;
	DT.control.syncStatus = 'init';
	   
  /**********************************************************
    Расчёт рабочих переменных, исходя из входных параметров
   **********************************************************/	
	   
	fn.control.calculateOutputValues = function(o, outputKey){
		var response = {};
		   outputKey.forEach(function(item){
			 switch(item){
			   case 'starCircleLength':  // Длина окружности верхней и нижней звёзд
			     response[item] = o.stepChain * o.teethNumber; 
				break; 
			   case 'starDiameter': // Диаметр верхней и нижней звезды
			     response[item] = response.starCircleLength / Math.PI;
			    break;
			   case 'floaterDiameter': // Диаметр поплавка
			     response[item] = o.floatDiameter;
			    break;
			   case 'chainTotalLength': // Общая длина цепи
			     response[item] = o.stepChain * o.betweenFloats * o.floatsNumber;
			    break;
			   case 'chainStraightLength': // Длина прямого участка цепи (межосевое расстояние)
			     response[item] = (response.chainTotalLength - response.starCircleLength) / 2;
			    break;
			   case 'tankWidth': // Ширина ёмкости для установки
			     response[item] = response.starDiameter + response.floaterDiameter + 100;
			    break;
			   case 'tankHeight': // Высота ёмкости для установки
			     response[item] = response.chainStraightLength + response.starDiameter + 2 * response.floaterDiameter;
			    break;
			      }
		  if(['starCircleLength', 'floaterDiameter'].indexOf(item) == -1){
			   let span = document.getElementById(item);
			       span.textContent = parseInt(response[item]);
		             }
		       });
		    let input = document.getElementById('teethNumber-input');
			    input.setAttribute("step", o.betweenFloats);
				input.setAttribute("min", (2 * o.betweenFloats));
		  
		  return response;
  	   };
	   
  /********************************************************
    Пересчёт переменных, исходя из масштаба визуализации
   ********************************************************/
	   
	fn.control.applyScaleToOutputValues = function(o, outputKey, scale){
		 var response = {};
		   outputKey.forEach(function(item){
			 response[item] = o[item] / scale;
		       });
		  return response;
	   };
	   
		  
 /*******************************************************************************
    Применение входных параметров при загрузке или изменении модели визуализации
  *******************************************************************************/
		  
	fn.control.applyInputParameters = function(is_db = false){ 
	
	 if(is_db === true){
		fn.control.replaceInputValues();		
	       } else {
		cfg.configName = document.getElementById('configName-input').value;	
        cfg.input = fn.control.parseInputValues(DT.control.inputKey);	   
		   }
		
		cfg.output = fn.control.calculateOutputValues(cfg.input, DT.control.outputKey);
	    dt = fn.control.applyScaleToOutputValues(cfg.output, DT.control.outputKey, scale);
		
        p.centerX = dt.tankWidth / 2;
        p.leftX = p.centerX - dt.starDiameter / 2;
        p.rightX = p.centerX + dt.starDiameter / 2;
        p.topY = dt.floaterDiameter + dt.starDiameter / 2;
        p.bottomY = dt.tankHeight - dt.floaterDiameter - dt.starDiameter / 2;
	
	const waterLevel = p.topY - (dt.starDiameter/2) - (dt.floaterDiameter/3);
	const root = document.documentElement;
	      root.style.setProperty('--tank_width', dt.tankWidth+'px');
		  root.style.setProperty('--tank_height', dt.tankHeight+'px');
		  root.style.setProperty('--floaterDiameter', dt.floaterDiameter+'px');
		  root.style.setProperty('--starDiameter', dt.starDiameter+'px');
		  root.style.setProperty('--waterLevel', waterLevel+'px');
	
		p.track = document.getElementById('track');
		p.track.innerHTML = '';
        p.floaters = [];
		
	      fn.control.createStar(p.track, 'topStar', {top: p.topY, left: p.centerX}, cfg.input.teethNumber);
		  fn.control.createStar(p.track, 'bottomStar', {top: p.bottomY, left: p.centerX}, cfg.input.teethNumber);

    for (let i = cfg.input.floatsNumber; i > 0; i--) {
	
	  const fillLayer = document.createElement('div');
            fillLayer.classList.add('fill-layer');
			
      const el = document.createElement('div');
            el.classList.add('floater');
            el.textContent = 1 + cfg.input.floatsNumber - i;
			el.setAttribute('data-number', el.textContent);
            el.appendChild(fillLayer);

            p.track.appendChild(el);
            p.floaters.push({ el, fillLayer, offset: i / cfg.input.floatsNumber, fill: airFilingEnd });
			
	          }
	  };
	  
		 
  /***********************************************************************
   ***********************************************************************
     Набор функций для управления Программным контроллером визуализации параметров
   ***********************************************************************
  ************************************************************************/
  
    fn.control.mode = function(defMode = 'visualization'){
	    let mode = (!localStorage.controllerMode) ? defMode : localStorage.controllerMode;
	  return mode;
	   };
	   
	fn.control.status = function(defStatus = 'init'){
	    let status = (!sessionStorage.controllerStatus) ? defStatus : sessionStorage.controllerStatus;
	  return status;
	   };
  
    fn.control.dysplayStatus = function(s, t){
	  let timeout = t || 10;
	  let status = s || fn.control.status();
	  let controllerStatus = document.getElementById('controllerStatus');
	  
	  setTimeout(function(){
	      controllerStatus.className = '';
		  controllerStatus.classList.add(status);
		  controllerStatus.innerHTML = DT.control.status[status].name;
		  DT.control.dysplayStatus = status;
	       }, timeout);
 	   };
	   
  /*************************************************************************************************
    Обработчик отображения набора кнопок для того или иного режима Визуализации
	Обработчик отображения статуса кнопок для того или иного действия в текущем режиме Визуализации
  ****************************************************************************************************/
	   
	fn.control.dysplayButton = function(a){
		
	  let mode = fn.control.mode();
	  let controlButtons = document.getElementById('controlButtons');
	  let buttons = controlButtons.querySelectorAll('div');
	  let action = a || 'stop';
	      action = (action == 'init') ? 'stop' : action;
		  
		    controlButtons.className = 'data-box ' + mode;	  
            buttons.forEach(button => {
				
			let label = button.id;
			    label = label.replace('button', '');
				label = label.toLowerCase();
				
				button.style.display = (DT.control.html[mode].buttons.indexOf(label) == -1) ? 'none' : 'block';
				
				if(label == action){
					button.classList.add('active');
					       } else {
                    button.classList.remove('active');
					    }
				 });
	   };
	   
   /*******************************************************************************
     Пост-Обработка кликов по пункту выбора того или иного режима Визуализации
	 ****************************************************************************/
  
    fn.control.changeMode = function(m, s){
		
	  let mode = m || fn.control.mode();
	  let status = s || fn.control.status();
	  let prevMode = fn.control.mode(false);
	  let prevStatus = fn.control.status(false);
	  
	  // Запуск динамической индикации статуса соединения с контроллером при необходимости
	  
	  if(!DT.control.connectionStatusInterval) {
	       DT.control.connectionStatusInterval = setInterval(function(){
			 let statusButton = document.getElementById('buttonConnectStatus');
		       if(DT.ws.o) {
				   statusButton.classList.add('connect'); 
			          } else {
				   statusButton.classList.remove('connect');	
				   }
	          }, 500);
	     }
	  
	  // Визуальная обработка списка режимов
	  
	  let controllerMode = document.getElementById('controllerMode');
	      controllerMode.innerHTML = DT.control.html[mode].name;
	  let controllerChangeMode = document.getElementById('controllerChangeMode');
	  let items = controllerChangeMode.querySelectorAll('li');
                    items.forEach(item => {
					   if(item.getAttribute('data-mode') == mode){
						    item.classList.remove('active');
					           } else {
                            item.classList.add('active');
							   }
                          });
						  
	 // Проверка предыдущего состояния режима
	  
	  if(prevMode){ 
	  
	    if(prevMode != mode){ // Если переход с одного режима на другой
		      if(prevStatus && prevStatus != 'stop'){
			       fn.control.visualisation('stop', prevMode);
		              }
					  
	              } else { // Если режим тот, что и был
			// И например, надо восстановить сценарий после перезагрузки страницы
			  if(prevStatus && ['init, stop'].indexOf(prevStatus) == -1 && prevStatus == status){ 
			      let hahdle = () => fn.control.visualisation(prevStatus, prevMode); 
			       if(mode == 'synchronization' && ['play', 'record'].indexOf(prevStatus) != -1) {
					 if(DT.ws.o) { hahdle(); } else { fn.ws.onOpenHandle = hahdle; } 
			             } else {
			         hahdle();
					   }
				  return false;
		              }				  
			     }
	       } 
		  
	  localStorage.setItem('controllerMode', mode);
	  sessionStorage.setItem('controllerStatus', status);
	  
	  fn.control.visualisation(status);
	    };
		 
    fn.prepareParametersForVisualisation = function(action, mode){
		
	    };
		
  /***********************************************************
     Непосредственное управление резными режимами визуализации 
	   и конкретными действиями в выбранном режиме
	*******************************************************/
	
    fn.control.visualisation = function(a, m){
		
	   let IP = localStorage.getItem('websocket_IP');
	   let mode = m || fn.control.mode();
	   let action = a || 'init';
	   
	   fn.control.dysplayStatus(action);
	   fn.control.dysplayButton(action);
	   
	   console.log(mode, action);
	
      const timer = document.getElementById('timer'); // Управление таймером	
	    let timerUpdate = function(startSeconds){
			   let intervalUID = setInterval(function(){
	                    const nowSeconds = Math.floor((Date.now() - startSeconds) / 1000); 
                              timer.textContent = fn.printFormatTime(nowSeconds);	  
	                             }, 1000);
			return intervalUID;
		     };
		
	   switch(mode){
		   
		  case 'visualization':
		  
		     sessionStorage.setItem('controllerStatus', action);
		  
		    break;
			
		  case 'synchronization': 
		  
		    let disconnectStatus = function(){
				      setTimeout(function(){
				         fn.control.visualisation('stop', 'synchronization');
						        }, 50);
					  setTimeout(function(){
						 fn.control.dysplayStatus('disconnect');  
							    }, 750);
				             };								 
		  
		       switch(action){
				   
				 case 'init':
				 
				  // Подключение к контроллеру
				  
				  if(DT.ws.o) { // Если есть подключение, сообщаем о готовности
						
					  fn.control.dysplayStatus('ready', 750);
					  DT.control.syncStatus = 'init';
								
				        } else // Если нет подключения, но сохранён IP, инициируем соединение
							   
                    if(IP) { 
						  
                      fn.ws.connect(true, IP);
					  fn.control.dysplayStatus('connect', 250);  
					  fn.ws.onOpenHandle = () => fn.control.dysplayStatus('ready', 750); // При подключении, сообщаем о готовности
					  fn.ws.onCloseHandle = () => disconnectStatus(); // При ошибке подключения выкидываем статус - нет соединения / стоп
					  
					      } else {  // Если нет IP, выкидываем статус - нет соединения / стоп
						  
					  disconnectStatus();
						  
					 }
				 
				   break;
				   
				 case 'play':
				 
				  sessionStorage.setItem('controllerStatus', action);
				 
				  if(DT.ws.o) { // Базовая проверка на открытое WebSocket соединение
				  
				      DT.control.syncInterval = setInterval(function(){
						  
						// Интервальная проверка на открытое WebSocket соединение
						if(!DT.ws.o){
							  disconnectStatus();  
							 return false;
						        }
									
					    let statDelayLength = parseInt(DT.settings.controller.timing.visualizationDelay/200);
						
						// Если ещё нет флага начала проигрывания и данных недостаточно, ожидаем данные
						if(DT.control.syncStatus != 'play' && DT.STATISTIC.length < (statDelayLength + 1)){
							 if(fn.control.status() == 'play'){
							     fn.control.dysplayStatus('wait');
							         }	
                             return false;									 
						      }
							  
						let delFirstElementsCount = DT.STATISTIC.length - (statDelayLength + 1);
						
						// Защита от переизбытка данных в моменте
						if(delFirstElementsCount > 0){
						   // Смещаем элементы массива "влево", удаляя первые delFirstElementsCount элементов
						      console.log("fn.control.visualisation :: Избыточное кол-во записей статистики! >> ", DT.STATISTIC.length);
				              DT.STATISTIC = DT.STATISTIC.slice(delFirstElementsCount);
							  console.log("fn.control.visualisation :: Избыточные записи удалены. >> ", DT.STATISTIC.length);
						        } else 						
						// Защита от недостатка данных в моменте (проверка переменной из Оп. памяти)
						if(DT.control.syncStatus == 'play' && DT.STATISTIC.length < 1){
							// fn.control.visualisation('stop', 'synchronization');
							  console.log("fn.control.visualisation :: Все записи обработаны. >> ", DT.STATISTIC.length, "Ожидание новых данных");
						     fn.control.dysplayStatus('databreak');  
							return false;
						      }
						
						let first = DT.STATISTIC.shift(); 
						    first = fn.applyUserVariables(first);
							
						// Меняем статус на мониторе в случае если ранее был другой	
					     if(fn.control.status() == 'play' && DT.control.dysplayStatus != 'play'){
							   fn.control.dysplayStatus('play');
							       }
							
							// Старт новой сессии при необходимости
							
						 let startSeconds = Date.now();
							
						  if(!sessionStorage.visualStartTime){ 
						        sessionStorage.setItem('visualStartTime', String(startSeconds));
								sessionStorage.setItem('statisticStartTime', String(first.time));
						             } else {
								startSeconds = parseInt(sessionStorage.visualStartTime);		   
								  }
									   
						  if(!DT.control.timerInterval){
								  DT.control.timerInterval = timerUpdate(startSeconds);
								  DT.control.syncStatus = 'play';
								        }
						  
						  // Если в настройках включён режим вращения, то обрабатываем данные из настроек
						  
                          if(DT.settings.controller.rotation.isEnable == 'on') {
							  
		                     let rotationValue = fn.evaluateExpression(DT.settings.controller.rotation.value, first);
                         
		                       if(rotationValue != DT.emptyValue){
				                    rotationValue = rotationValue * parseFloat(DT.settings.controller.rotation.reduction);
					                   } else {
									rotationValue = 0;	   
									      }
                                 p.starRotationSpeed = rotationValue;
						             } else {
                                 p.starRotationSpeed = 0;
								  }	

                          // Обновляем данные генераторного динамического блока

                           fn.control.visualGeneratorBlock('play', first);						  
						  
						  // Обновляем данные датчиков в динамике
										
						  let sensors = fn.sensors.sort(); 
							
                          if(sensors){	// Обновляем данные датчиков из текущего элемента статистики first					
							    fn.sensors.updateFrontEndValues(sensors, first); 
							           }
							 
				                }, 200);
					   
				             } else {  // Если WebSocket закрыт, останавливаем визуализацию	
						  
						 disconnectStatus();								
							 
						}
				 
				  break;
				  
				 case 'stop':
				 
				  sessionStorage.setItem('controllerStatus', action);
				  DT.control.syncStatus = 'stop';
				  
				  sessionStorage.removeItem('visualStartTime');
				  sessionStorage.removeItem('statisticStartTime');
				  
			//	  fn.control.requestTDC(); // Синхронизация 1-го поплавка в ВМТ
				  p.starRotationSpeed = 0; // Остановка визуализации поплавков
				  fn.control.visualGeneratorBlock('stop'); // Сброс значений динамического блока
				  
				  let sensors = fn.sensors.sort(); // Актуальный список датчиков
				  
				  if(sensors){
				      fn.sensors.updateFrontEndValues(sensors, 'clear');
				        }
				 
				  if(DT.control.syncInterval){
				      clearInterval(DT.control.syncInterval);
				      DT.control.syncInterval = false;
				         }
						 
				  if(DT.control.timerInterval){
					  clearInterval(DT.control.timerInterval);
				      DT.control.timerInterval = false;
					  timer.textContent = fn.printFormatTime(0);
				        }
				 
				  break;
				  
				  case 'record':
				 
					  sessionStorage.setItem('controllerStatus', action);
					  
					  setTimeout(function(){
						     fn.control.visualisation('stop', 'synchronization');
					     }, 750);				       
				 
				  break;
				   
			      }
		  
		    break;
			
		  case 'statistic':
		  
		    if(action != 'x2'){
		        sessionStorage.setItem('controllerStatus', action);
			       } else {
				sessionStorage.setItem('controllerStatus', 'xN');
				   }
		  
		    break;
		   
	      }
	  };
  
  
  })(window);