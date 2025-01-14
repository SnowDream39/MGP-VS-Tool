import fs from 'node:fs'
import { dialog } from 'electron'
import { DateTime } from 'luxon'
import * as ejs from 'ejs'
import entryTemplateUrl from './templates/entry.ejs?asset'
import categoryNames from './templates/categories.json'
import { app } from 'electron'
import { get_lyrics, get_vocalist_name } from '../websites/vocadb'
/**
 * 来自 vocadb 的原始数据
 */
var songData: any = {}

/**
 * 键的名称与 vocadb 上的名称相同，首字母大写，单数形式
 */
var staff: any = {}
var producers: string[] = []
var synthesizers: string[] = []

function addToGroup(obj: any, key: string, value: unknown) {
  if (!obj[key]) {
    obj[key] = [];
  }
  obj[key].push(value)
}


async function selectPath() {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: app.isPackaged ? 'output.txt' : 'output.wikitext' // 一般用户还是用 txt 吧
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
  let roles: string

  for(const artist of songData.artists) {
    if (artist.categories === "Other"){
      roles = artist.effectiveRoles;
    } else if (artist.categories === "Vocalist") {
      roles = "Vocalist"
      const artistDetail = await get_vocalist_name(artist.artist.id)
      if("baseVoicebank" in artistDetail)
        artist.name = artistDetail.baseVoicebank.name
    } else if (artist.categories.includes('Producer')) {
      producers.push(artist.name)
      if (artist.effectiveRoles === "Default") {
        roles = "Producer"  // 词·曲
      } else {
        roles = artist.effectiveRoles
      }
    } else {
      roles = artist.categories
    }
    for(const role of roles.split(', ')) {
      addToGroup(staff, role, artist.name)
    }
  }

}

function makeFormattedStaff() {  // todo
  const formattedStaff = { ...staff};
  for(const category in formattedStaff){
    formattedStaff[categoryNames[category]] = formattedStaff[category];
    delete formattedStaff[category]
  }

  return formattedStaff
}

function makeProducers() {
  return producers
}

function makeVocalists() {           // to be improved
  return staff.Vocalist
}

function makeSynthesizers() {
  for (const artist of songData.artists) {
    if( artist.categories.includes("Vocalist")) {
      let synthesizer = artist.artist.artistType === "Vocaloid" ? "VOCALOID" : artist.artist.artistType
      if (!["OtherVoiceSynthesizer"].includes(synthesizer))
        synthesizers.push(synthesizer)
    }
  }
  return synthesizers
}

function makeIllustrators() {        // to be improved
  const illustrators = "Illustrator" in staff ? staff.Illustrator : staff.Animator
  return illustrators
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
    if (pvs[service]){
      formattedPvs.push({
        service: serviceFormat(service)!,
        id: ( service == "Bilibili" ? "av" : "" ) + pvs[service].id,
        upload: pvs[service].upload,
        view: pvs[service].view,
        sameDay: false
      })
    }
  }

  formattedPvs.sort((a, b) => a.upload - b.upload)
  for (let i=1; i<formattedPvs.length; i++){
    if (formattedPvs[i].upload.toMillis() == formattedPvs[i-1].upload.toMillis()){
      formattedPvs[i].sameDay = true
    }
  }
  return formattedPvs
}

async function makeLyrics(){
  for(const lyricInfo of songData.lyricsFromParents){
    if (lyricInfo.translationType === "Original") {
      return (await get_lyrics(lyricInfo.id)).value;
    }
  }
  return ''
}

function comma(items: string[]) {
  return items ? items.join('、') : ''
}


async function makeWikitext(): Promise<string> {
  const data = {
    staff: makeFormattedStaff(),
    title: makeTitle(),
    names: makeNames(),
    producers: makeProducers(),
    vocalists: makeVocalists(),
    synthesizers: makeSynthesizers(),
    illustrators: makeIllustrators(),
    pvs: await makePvs(),
    biliid: '',
    originalLyrics: await makeLyrics(),
    translatedLyrics: '',
    comma: comma
  }

  const template = fs.readFileSync(entryTemplateUrl, { encoding: 'utf-8'})
  return ejs.render(template, data)
}


export async function output (data) {
  songData = data
  staff = {}
  producers = []
  synthesizers = []
  try {
    await makeStaff()
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
