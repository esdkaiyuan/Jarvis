const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvis', {
  getConfig: () => ipcRenderer.invoke('jarvis:get-config'),
  transcribe: (audioDataUrl) => ipcRenderer.invoke('jarvis:transcribe', audioDataUrl),
  chat: (text) => ipcRenderer.invoke('jarvis:chat', text),
  tryAction: (text) => ipcRenderer.invoke('jarvis:try-action', text),
  speak: (text) => ipcRenderer.invoke('jarvis:speak', text),
  notifyState: (state) => ipcRenderer.send('jarvis:state', state),
  beginDrag: (point) => ipcRenderer.send('jarvis:drag-begin', point),
  moveDrag: (point) => ipcRenderer.send('jarvis:drag-move', point),
  endDrag: () => ipcRenderer.send('jarvis:drag-end'),
  onStartListening: (handler) => {
    const listener = () => handler();
    ipcRenderer.on('jarvis:start-listening', listener);
    return () => ipcRenderer.removeListener('jarvis:start-listening', listener);
  }
});
