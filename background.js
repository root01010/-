
const extensionUrlBase = chrome.runtime.getURL("index.html");
const TITLE_ON_PAGE = "Сделать стоп-кадр";
const TITLE_DEFAULT = "Открыть ROSH Local";

chrome.action.onClicked.addListener(async (tab) => {
	
  if (!tab || typeof tab.windowId !== 'number') {
	     return;
           }

  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(t => t.url && t.url.startsWith(extensionUrlBase));
  const activeTab = tabs.find(t => t.url && t.url.startsWith(extensionUrlBase) && t.active);

  if (existingTab) { // Если существует вкладка расширения
	 if(activeTab){ // Если вкладка расширения активна >> делаем скриншот (Стоп-кадр)
	     try {
          const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
          await chrome.tabs.create({ url: dataUrl });
            } catch (e) {
          console.error('Capture failed:', e);
                  }
	          } else { // Если вкладка расширения неактивна >> переключаемся на неё
       await chrome.tabs.update(existingTab.id, { active: true });
       await chrome.windows.update(existingTab.windowId, { focused: true });
		     }
          } else { // Если не существует вкладка расширения >> открываем её
       await chrome.tabs.update(tab.id, { url: extensionUrlBase });
      }
});

function handleTab(tabId, url) {
	
  let title = TITLE_DEFAULT;
   if (url.startsWith(extensionUrlBase)) {
	     title = TITLE_ON_PAGE;
         chrome.tabs.query({url: url}, (tabs) => {
            if (tabs.length > 1) {
              // Закрываем новую вкладку (последнюю)
                   chrome.tabs.remove(tabId);
              // Можно переключить на уже открытую (например, tabs[0])
                   chrome.tabs.update(tabs[0].id, {active: true});
                 }
            });
       }
   chrome.action.setTitle({ 'title' : title });
}

// Обработка переключений вкладок
chrome.tabs.onActivated.addListener(async (activeTab) => { 
 const tab = await chrome.tabs.get(activeTab.tabId);
  if (tab && tab.url) { 
        handleTab(tab.id, tab.url);
          }
});

// Обработка открытия новой вкладки
chrome.tabs.onCreated.addListener(tab => {
  if (tab.url) {
        handleTab(tab.id, tab.url);
          } 
  });

// Обработка обновления URL в активной вкладке
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
       handleTab(tabId, changeInfo.url);
          }
});
