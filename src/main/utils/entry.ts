import fs from 'fs'
import { dialog } from 'electron'

async function selectPath() {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: 'output.wikitext'
  });

  if (canceled) {
    return { success: false, error: '用户取消了保存' };
  }
  return { success: true, filePath: filePath }
}

async function makeWikitext(data): Promise<string> {
  for (let i of data.artists) {

  }
  let wikitext = `
{{VOCALOID_Songbox
|image = ${data.song.name}.jpg
|图片信息 = illustration by
|演唱 =
}}
`
  return wikitext
}


export async function output (data) {
  try {
    const content = await makeWikitext(data)
    const result = await selectPath()
    if (result.success){
      fs.writeFileSync(result.filePath!, content, 'utf-8');
    }
    return { success: true }
  } catch (error) {
    console.error('文件保存失败：', error);
    return { success: false }
  }
}
