import { dialog, OpenDialogReturnValue } from 'electron'
import fs from 'fs'
import path from 'path'

// 递归遍历文件
const loadFilesInDir = (dir) => {
  let fileList: string[] = []
  // 读取目录下全部文件及子目录
  const files: string[] = fs.readdirSync(dir)
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dir, files[i])
    // 获取信息
    const fileData = fs.statSync(filePath)
    // 判断是文件还是目录
    if (fileData.isFile()) {
      // 如果是文件，则记录下来
      fileList.push(filePath)
    } else {
      // 如果是目录，则递归遍历，并拼接结果
      fileList = fileList.concat(loadFilesInDir(filePath))
    }
  }
  return fileList
}

// 打开选择目录对话框并遍历目录里的所有文件
const readDir = (event, arg) => {
  console.log('接收渲染进程传参：', arg)

  interface ExtendedOpenDialogReturnValue extends OpenDialogReturnValue {
    fileList?: string[]
  }
  dialog
    .showOpenDialog({
      // 只允许选择文件夹
      properties: ['openDirectory']
    })
    .then((result) => {
      const extendedResult: ExtendedOpenDialogReturnValue = {
        ...result,
        fileList: result.canceled ? [] : loadFilesInDir(result.filePaths[0])
      }
      // 将处理结果返回给渲染进程
      event.reply('readDir-reply', extendedResult)
    })
    .catch((error) => {
      console.error('读取目录列表失败:', error)
    })
}

export { readDir }
