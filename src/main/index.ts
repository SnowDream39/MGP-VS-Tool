import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { billboard } from './utils/websites/billboard'
import * as vocadb from './utils/websites/vocadb'

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
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

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
    const data = await billboard()
    return data
  })
  ipcMain.handle('vocadb-search', async (_event, requestData) => {
    const data = await vocadb.search_songs(requestData.keyword)
    return data
  })
  ipcMain.handle('vocadb-get', async (_event, requestData) => {
    const data = await vocadb.get_song_info(requestData.id)
    return data
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

