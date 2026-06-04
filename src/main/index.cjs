const path = require('node:path');
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  session
} = require('electron');
const { createMiMoClient } = require('./mimoClient.cjs');
const { loadDotEnv, resolveJarvisConfig, resolveMiMoConfig } = require('./config.cjs');
const { createDefaultActionRouter } = require('./actionRouter.cjs');

const localEnv = loadDotEnv();
const env = { ...localEnv, ...process.env };
const jarvisConfig = resolveJarvisConfig(env);
let mimoClient;
let actionRouter;
let mainWindow;
let mousePassthrough = jarvisConfig.mousePassthrough;
let dragSession = null;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  createWindow();
  registerIpc();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const size = jarvisConfig.windowSize;
  const workArea = primaryDisplay.workArea;

  mainWindow = new BrowserWindow({
    width: size,
    height: size,
    x: workArea.x + workArea.width - size - 48,
    y: workArea.y + Math.round(workArea.height * 0.2),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(mousePassthrough, { forward: true });
  mainWindow.once('ready-to-show', () => mainWindow.showInactive());

  if (env.JARVIS_DEV_SERVER === '1') {
    mainWindow.loadURL('http://127.0.0.1:5173/index.html');
  } else {
    mainWindow.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  }
}

function registerIpc() {
  ipcMain.handle('jarvis:get-config', () => ({
    particleCount: jarvisConfig.particleCount,
    windowSize: jarvisConfig.windowSize,
    wakeWordEnabled: jarvisConfig.wakeWordEnabled,
    wakeWords: jarvisConfig.wakeWords,
    shortcuts: {
      start: jarvisConfig.startShortcut,
      mouse: jarvisConfig.mouseShortcut,
      quit: jarvisConfig.quitShortcut
    }
  }));

  ipcMain.handle('jarvis:transcribe', async (_event, audioDataUrl) => {
    return getMiMoClient().transcribe(audioDataUrl);
  });

  ipcMain.handle('jarvis:chat', async (_event, text) => {
    return getMiMoClient().chat(text);
  });

  ipcMain.handle('jarvis:try-action', async (_event, text) => {
    return getActionRouter().tryHandleAction(text);
  });

  ipcMain.handle('jarvis:speak', async (_event, text) => {
    return getMiMoClient().speak(text);
  });

  ipcMain.on('jarvis:state', (_event, state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(state === 'idle' ? true : true, 'screen-saver');
    }
  });

  ipcMain.on('jarvis:drag-begin', (_event, point) => {
    if (!mainWindow || mainWindow.isDestroyed() || mousePassthrough || !isPoint(point)) {
      return;
    }

    dragSession = {
      startPoint: point,
      startBounds: mainWindow.getBounds()
    };
  });

  ipcMain.on('jarvis:drag-move', (_event, point) => {
    if (!mainWindow || mainWindow.isDestroyed() || !dragSession || !isPoint(point)) {
      return;
    }

    const dx = Math.round(point.screenX - dragSession.startPoint.screenX);
    const dy = Math.round(point.screenY - dragSession.startPoint.screenY);
    mainWindow.setBounds({
      ...dragSession.startBounds,
      x: dragSession.startBounds.x + dx,
      y: dragSession.startBounds.y + dy
    });
  });

  ipcMain.on('jarvis:drag-end', () => {
    dragSession = null;
  });
}

function registerShortcuts() {
  globalShortcut.register(jarvisConfig.startShortcut, () => {
    mainWindow?.webContents.send('jarvis:start-listening');
  });

  globalShortcut.register(jarvisConfig.mouseShortcut, () => {
    mousePassthrough = !mousePassthrough;
    mainWindow?.setIgnoreMouseEvents(mousePassthrough, { forward: true });
  });

  globalShortcut.register(jarvisConfig.quitShortcut, () => {
    app.quit();
  });

  for (const [accelerator, dx, dy] of [
    ['CommandOrControl+Shift+Left', -36, 0],
    ['CommandOrControl+Shift+Right', 36, 0],
    ['CommandOrControl+Shift+Up', 0, -36],
    ['CommandOrControl+Shift+Down', 0, 36]
  ]) {
    globalShortcut.register(accelerator, () => moveWindow(dx, dy));
  }
}

function moveWindow(dx, dy) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    ...bounds,
    x: bounds.x + dx,
    y: bounds.y + dy
  });
}

function isPoint(point) {
  return Number.isFinite(point?.screenX) && Number.isFinite(point?.screenY);
}

function getMiMoClient() {
  if (!mimoClient) {
    mimoClient = createMiMoClient(resolveMiMoConfig(env));
  }
  return mimoClient;
}

function getActionRouter() {
  if (!actionRouter) {
    actionRouter = createDefaultActionRouter({ env });
  }
  return actionRouter;
}
