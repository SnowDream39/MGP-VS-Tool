import fs from 'node:fs'
import { dialog } from 'electron'
import { DateTime } from 'luxon'
import * as ejs from 'ejs'
import entryTemplateUrl from './templates/entry.ejs?asset'
import categoryNames from './templates/categories.json'
import synthesizerNames from './templates/synthesizers.json'
import baseVoicebanks from '../../../../resources/vocalists/baseVoicebanks.json'
import vocalistOriginalNames from '../../../../resources/vocalists/originalNames.json'
import vocalistTranslatedNames from '../../../../resources/vocalists/translatedNames.json'
import { app } from 'electron'
import { get_lyrics } from '../websites/vocadb'
import { join } from './wikitext'
import Kuroshiro from "Kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

interface Service {
  abbr: String
  name: string
}

interface Pv {
  service: Service
  id: String
  upload: DateTime
  view: Number
  sameDay: Boolean
}

interface UploadGroup {
  upload: DateTime
  services: Service[]
}

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

var pvs: Pv[] = []
var uploadGroups: UploadGroup[] = []













function addToGroup(obj: any, key: string, value: unknown) {
  if (!obj[key]) {
    obj[key] = []
  }
  obj[key].push(value)
}

function sanitizePath(filePath: string) {
  const invalidChars = /[<>:"/\\|?*]/g // 常见非法字符
  return filePath.replace(invalidChars, '')
}

async function selectPath() {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: sanitizePath(makeTitle()) + ( app.isPackaged ? '.txt' : '.wikitext' ) // 一般用户还是用 txt 吧
  })

  if (canceled) {
    return { success: false, error: '用户取消了保存' }
  }
  return { success: true, filePath: filePath }
}

function makeTitle() {
  return songData.song.name
}

function makeAllTitles() {
  return [songData.song.name] + songData.additionalNames.split(', ')
}


function getVocalistName(artist, translated: boolean) {
  let baseId: string
  if (artist.id in baseVoicebanks){
    baseId = baseVoicebanks[artist.id]
  } else {
    baseId = artist.id
  }
  if (translated && baseId in vocalistTranslatedNames){
    return vocalistTranslatedNames[baseId]
  } else if (translated && !(baseId in vocalistTranslatedNames) && baseId in vocalistOriginalNames){
    return vocalistOriginalNames[baseId]
  } else if (translated && !(baseId in vocalistOriginalNames)) {
    // 可以弹出一个提示
    return artist.name
  } else if (baseId in vocalistOriginalNames) {
    return vocalistOriginalNames[baseId]
  } else {
    // 可以弹出一个提示
    return artist.name
  }
}



async function makeStaff() {
  let roles: string
  let staff: any = {}
  for (const artist of songData.artists) {
    if (artist.categories === 'Other') {
      roles = artist.effectiveRoles
    } else if (artist.categories === 'Vocalist') {
      roles = 'Vocalist'
      artist.name = getVocalistName(artist.artist, true)
    } else if (artist.categories.includes('Producer')) {
      producers.push(artist.name)
      if (artist.effectiveRoles === 'Default') {
        roles = 'Producer' // 词·曲
      } else {
        roles = artist.effectiveRoles
      }
    } else {
      roles = artist.categories
    }
    for (const role of roles.split(', ')) {
      addToGroup(staff, role, artist.name)
    }
  }
  staff.Vocalist = Array.from(new Set(staff.Vocalist))
  return staff
}

function makeDisplayStaff() {
  // todo
  const displayStaff = { ...staff }
  for (const category in displayStaff) {
    displayStaff[categoryNames[category]] = displayStaff[category]
    delete displayStaff[category]
  }
  return displayStaff
}

function makeType() {
  const type = songData.song.songType
  if(type === "Original"){
    return "原创"
  } else {
    return "翻唱"
  }
}

function makeProducers() {
  return producers
}

function makeVocalists() {
  let vocalists: string[] = []
  for(const artist of songData.artists){
    if(artist.categories === "Vocalist" && !artist.isSupport)
      vocalists.push(getVocalistName(artist.artist, true))
  }
  return Array.from(new Set(vocalists))
}

function makeSynthesizers() {
  for (const artist of songData.artists) {
    if (artist.categories.includes('Vocalist')) {
      const type = artist.artist.artistType
      const synthesizer = (type in synthesizerNames) ? synthesizerNames[type] : type
      if (!['OtherVoiceSynthesizer'].includes(synthesizer)) synthesizers.push(synthesizer)
    }
  }
  return Array.from(new Set(synthesizers))
}

function makeIllustrators() {
  // to be improved
  const illustrators = 'Illustrator' in staff ? staff.Illustrator : staff.Animator
  return illustrators
}

const serviceFormat = (service: "NicoNicoDouga" | "Youtube" | "Bilibili") => {
  return {
    NicoNicoDouga: { abbr: 'nnd', name: 'niconico' },
    Youtube: { abbr: 'yt', name: 'YouTube' },
    Bilibili: { abbr: 'bb', name: 'bilibili' }
  }[service]
}

function makePvs() {
  const pvs: Pv[] = []
  for (const pv of songData.pvs) {
    if (pv.pvType === 'Original'
      && ["NicoNicoDouga", "Youtube", "Bilibili"].includes(pv.service)
      && !pvs.map((pv)=>pv.service.abbr).includes(serviceFormat(pv.service).abbr)) {
      pvs.push({
        service: serviceFormat(pv.service),
        id: (pv.service == 'Bilibili' ? 'av' : '') + pv.pvId,
        upload: DateTime.fromISO(pv.publishDate),
        view: 0,
        sameDay: false,
      })
    }
  }

  pvs.sort((a, b) => a.upload - b.upload)
  for (let i = 1; i < pvs.length; i++) {
    if (pvs[i].upload.toMillis() == pvs[i - 1].upload.toMillis()) {
      pvs[i].sameDay = true
    }
  }

  const uploadGroups: UploadGroup[] = []
  for(const pv of pvs){
    if(pv.sameDay === false){
      uploadGroups.push({upload: pv.upload, services:[pv.service]})
    } else {
      uploadGroups[uploadGroups.length-1].services.push(pv.service)
    }
  }
  return { pvs, uploadGroups }
}

function makeBiliVideo() {
  for(const pv of pvs) {
    if(pv.service.abbr === "bb"){
      return pv.id
    }
  }
  return ''
}

async function toPhotranse(lyrics: string) {
  const kuroshiro = new Kuroshiro()
  await kuroshiro.init(new KuromojiAnalyzer())
  const rubyLyrics = await kuroshiro.convert(lyrics, {mode:"furigana", to:"hiragana"})
  const photransLyrics = rubyLyrics.replace(
    /<ruby>(.*?)<rp>\(<\/rp><rt>(.*?)<\/rt><rp>\)<\/rp><\/ruby>/g,
    (_match, kanji, reading) => `{{Photrans|${kanji}|${reading}}}`
  );
  return photransLyrics
}

async function makeLyrics(type: 'Original' | 'Translation') {
  for (const lyricInfo of songData.lyricsFromParents) {
    if (type === 'Original') {
      if (lyricInfo.translationType === 'Original') {
        let lyrics = await get_lyrics(lyricInfo.id)
        lyrics.value = await toPhotranse(lyrics.value)
        return lyrics
      }
    } else {
      if (lyricInfo.translationType === 'Translation' && lyricInfo.cultureCodes[0] == 'zh') {
        return await get_lyrics(lyricInfo.id)
      }
    }
  }
  return ''
}

async function makeWikitext(): Promise<string> {
  const data = {
    staff: makeDisplayStaff(),
    title: makeTitle(),
    allTitles: makeAllTitles(),
    type: makeType(),
    producers: makeProducers(),
    vocalists: makeVocalists(),
    synthesizers: makeSynthesizers(),
    illustrators: makeIllustrators(),
    pvs: pvs,
    uploadGroups: uploadGroups,
    biliVideo: await makeBiliVideo(),
    originalLyrics: await makeLyrics('Original'),
    translatedLyrics: await makeLyrics('Translation'),
    join: join
  }

  const template = fs.readFileSync(entryTemplateUrl, { encoding: 'utf-8' })
  return ejs.render(template, data)
}

export async function output(data) {
  songData = data
  staff = {}
  producers = []
  synthesizers = []
  pvs = []
  uploadGroups = []
  try {
    staff = await makeStaff();
    ({ pvs, uploadGroups } = makePvs())
    const content = await makeWikitext()
    const result = await selectPath()
    if (result.success) {
      fs.writeFileSync(result.filePath!, content, 'utf-8')
    }
    return { success: true }
  } catch (error) {
    console.error('文件保存失败：', error)
    return { success: false }
  }
}
