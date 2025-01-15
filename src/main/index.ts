import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import * as billboard from './utils/websites/billboard'
import * as vocadb from './utils/websites/vocadb'
import * as entry from './utils/entry/entry'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 620,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 为了安全，不要解除同源限制
      webSecurity: true,
      // 开源软件，可以用 DevTools
      devTools: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = details.url;

    // 判断 URL 是否是可信域名
    if (url.startsWith('https://trusted.com')) {
      return { action: 'allow' }; // 允许打开窗口
    } else {
      shell.openExternal(url); // 在默认浏览器中打开非可信域名
      return { action: 'deny' }; // 阻止在 Electron 内部打开
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // set DevTools shortcut
  globalShortcut.register('CommandOrControl+Shift+i', function () {
    mainWindow.webContents.openDevTools()
  })
  return mainWindow
}

// 程序单例模式
let myWindow: BrowserWindow | null = null
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  // 如果已经有同样的该程序正在运行，则不启动
  app.quit()
}

// 如果检测到有同样的该程序正在试图启动……
app.on('second-instance', (_event, _commandLine, _workingDirectory, _additionalData) => {
  if (myWindow) {
    dialog.showMessageBox({
      message: '此程序已经在运行'
    })
    if (myWindow.isMinimized()) myWindow.restore()
    myWindow.focus()
  }
})

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 这里设置主进程要监听和处理的事件
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('billboard', async (_event, _requestData) => {
    const data = await billboard.billboard()
    return data
  })
  ipcMain.handle('vocadb', async (_event, request) => {
    if (request.type === "search-songs"){
      return await vocadb.search_songs(request.data.keyword)
    } else if (request.type === "song") {
      return await vocadb.get_song_info(request.data.id)
    } else if (request.type === "lyrics") {
      return await vocadb.get_lyrics(request.data.id)
    } else {
      return { success: false, error: "No such request" }
    }
  })
  ipcMain.handle('to-entry', async (_event, content) => {
    const result = await entry.output(content)
    return result
  })
  ipcMain.on('open-external', async (_event, url) => {
    await shell.openExternal(url);
  })


  myWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

