(function(window) {
    "use strict";

    /********************** ПЕРСОНАЛИЗАЦИЯ CSS БОКОВОЙ ПАНЕЛИ *****************************/
    const root = document.documentElement;

    // Получаем сохранённую ширину боковой панели из localStorage
    const resizableArea_width = localStorage.getItem('resizableArea_width');

    // Если значение есть, применяем его к CSS переменной
    if(resizableArea_width) {
        root.style.setProperty('--resizableArea_width', resizableArea_width + 'px');
        console.log('Применена ширина боковой панели:', resizableArea_width + 'px');
    }

})(window);
