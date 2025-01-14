import fs from 'node:fs'
import { dialog } from 'electron'
import { DateTime } from 'luxon'
import * as ejs from 'ejs'
import entryTemplate from '../templates/main.ejs?asset'
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
        staff[role].push(artist.name)
      } else {
        staff[role] = [artist.name]
      }
    }
  }
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
  interface Pv {
    id: String;
    upload: DateTime;
    view: Number;
  }
  class Pvs {
    NicoNicoDouga: Pv | null = null;
    Youtube: Pv | null = null;
    Bilibili: Pv | null = null;
  }
  const pvs = new Pvs();
  for(const pv of songData.pvs){
    if(pv.pvType === "Original" && pvs[pv.service] === null) {
      pvs[pv.service] = {
        id: pv.pvId,
        upload: DateTime.fromISO(pv.publishDate)
      }
    }
  }
  const serviceFormat = (service: string) => { return {
    NicoNicoDouga: { abbr: 'nnd', name: 'niconico'},
    Youtube: { abbr: 'yt', name: 'YouTube'},
    Bilibili: { abbr: 'bb', name: 'bilibili'}
    }[service]
  }

  interface formattedPv {
    service: {
      abbr: String;
      name: String
    };
    id: String;
    upload: DateTime;
    view: Number;
    sameDay: Boolean;
  }

  const formattedPvs: formattedPv[] = [];
  for (const service in pvs) {
    formattedPvs.push({
      service: serviceFormat(service)!,
      id: ( service == "Bilibili" ? "av" : "" ) + pvs[service].id,
      upload: pvs[service].upload,
      view: pvs[service].view,
      sameDay: false
    })
  }

  formattedPvs.sort((a, b) => a.upload - b.upload)
  for (let i=1; i<formattedPvs.length; i++){
    console.log(formattedPvs[i].upload.toMillis())
    if (formattedPvs[i].upload.toMillis() == formattedPvs[i-1].upload.toMillis()){
      formattedPvs[i].sameDay = true
    }
  }
  console.log(formattedPvs)
  return formattedPvs
}

function comma(items: string[]) {
  return items.join('、')
}


async function makeWikitext(): Promise<string> {
  const data = {
    staff: await makeStaff(),
    title: makeTitle(),
    names: makeNames(),
    producers: makeProducers(),
    vocalists: ["v flower"],
    illustrators: ["unknown"],
    pvs: await makePvs(),
    biliid: '',
    originalLyrics: '',
    translatedLyrics: '',
    comma: comma
  }

  const template = fs.readFileSync(entryTemplate, { encoding: 'utf-8'})
  return ejs.render(template, data)
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
