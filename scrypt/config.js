
(function(window) {
	
  "use strict";
				 
	window.cfg = {};
	window.dt = {};		
	window.p = { 'starRotationSpeed' : 0 /* Скорость вращения ведущей звезды, об/мин. */ }; 
	
	window.fn = {
		    control: {},
			db: {},
			sensors: {},
			settings: {},
			variables: {}
	        };
	window.DT = {
		    storage: {},
			sensors: {},
			control: {},
			generator: {},
			STATISTIC: [],
			emptyValue: '--'
	        };
	
	DT.allowedGetParams = [ 
	   'settingsPage', 
	   'editSensorsForm', 
	   'editGraphForm'
	    ];    

   /* Настройки по умолчанию и для режима Визуализации */	
	
    DT.settings = {
		   controller : {
			     rotation : {
				       isEnable : 'on',
					   value: 10,
					   reduction: 1
				          },
					  tdp : {
					    isEnable : 'off',
						value : 0
					      },
			   compressor :	{
				        isEnable : 'off',
                        air : 0,
						energy : 250
			              },
				generator : {
                        rotation : 300,
                        energy : 175
				          },
                   timing : {
					    dataFrequencyInterval : 5,
						dataReceiptPeriod : 3000,
						visualizationDelay : 10000
				          }
		              }
	            };
				
     /* Массив входных полей */
				
	 DT.control.inputKey = [
	           'configName', 
			   'stepChain', 
			   'betweenFloats', 
			   'teethNumber',  
			   'floatsNumber', 
			   'floatDiameter'
			      ];
				  
	  /* Массив выходных полей */
				  
	 DT.control.outputKey = [
	           'starCircleLength', 
			   'starDiameter', 
			   'floaterDiameter', 
			   'chainTotalLength', 
			   'chainStraightLength', 
			   'tankWidth', 
			   'tankHeight'
			     ];
				
	 DT.control.html = {
		        'visualization': {
					name: 'Визуализация',
					buttons: ['stop', 'pause', 'play']
				      },
				'synchronization': {
					name: 'Синхронизация',
					buttons: ['stop', 'play', 'record']
				      },
				'statistic': {
					name: 'Статистика',
					buttons: ['stop', 'pause', 'play', 'x2']
				      }  
	           };
	 
	 DT.control.status = {
		        'init' : {
					name: 'Инициализация'
				   },
				'ready' : {
					name: 'Готов'
				   },
				'stop' : {
					name: 'Стоп'
				   },
				'pause' : {
					name: 'Пауза'
				   },
				'wait' : {
					name: 'Ожидание данных'
				   },
				'databreak' : {
					name: 'Обрыв данных'
				   },
				'play' : {
					name: 'Воспроизведение'
				   },
                'record' : {
					name: 'Запись'
				   },
				'connect' : {
					name: 'Соединение с контроллером'
				   },
				'disconnect' : {
					name: 'Нет соединения'
				   },
                 'x2' : {
					name: 'Ускорение x2'
				   }				   
	            };
		
 })(window);