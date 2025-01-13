import fs from 'fs'
import { dialog } from 'electron'

var songData: any = {}


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

function makeTitle() {
  return songData.song.name;
}

function makeNames() {
  const names: string[] = [songData.song.name]
  for (const additionalName of songData.additionalNames.split(', '))
    names.push(additionalName)
  return names
}

async function makeStaff() {
  const staff: any = {}
  for(const artist of songData.artists) {
    for(const role of artist.effectiveRoles.split(', ')) {
      if (role in staff){
        staff[role] = [staff.name]
      } else {
        staff[role].push(staff.name)
      }
    }
  }
  console.log(staff)
  return staff
}

function makeProducers() {
  const producers: string[] = []
  for (const artist of songData.artists)
    if (artist.categories === "Producer")
      producers.push(artist.name)
  return producers
}


function makePvs() {
  class Pvs {
    NicoNicoDouga: string | null = null;
    Youtube: string | null = null;
    Bilibili: string | null = null;
  }
  const pvs = new Pvs();
  for(const pv of songData.pvs){
    if(pv.pvType === "Original" && pvs[pv.service] === null)
      pvs[pv.service] = pv.pvId
  }
  return pvs
}

async function makeWikitext(): Promise<string> {
  const staff = await makeStaff()
  const data = {
    title: makeTitle(),
    names: makeNames(),
    producers: makeProducers(),
    vocalists: ["v flower"],
    illustrators: ["unknown"],
    staff: staff,
    pvs: makePvs()
  }
  let wikitext = `{{标题替换|${data.title}}}
{{VOCALOID_Songbox
|image = ${data.title}.jpg
|图片信息 = illustration by ${data.illustrators.join("、")}
|颜色 =
|演唱 = [[${data.vocalists.join(']]、[[')}]]
|歌曲名称 = ${data.names.join('<br/>')} <!-- 自己把多余的名字删掉，没有的名字补上 -->
|P主 = [[${data.producers.join(']]、[[')}]]
${ data.pvs.NicoNicoDouga ? "|nnd_id = " + data.pvs.NicoNicoDouga : '\b'}
${ data.pvs.Youtube ? "|yt_id = " + data.pvs.Youtube : '\b'}
${ data.pvs.Bilibili ? "|bb_id = " + data.pvs.Bilibili : '\b'}
}}
`
  return wikitext
}


export async function output (data) {
  songData = data
  try {
    const content = await makeWikitext()
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
