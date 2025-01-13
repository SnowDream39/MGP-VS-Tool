import fs from 'fs'
import { dialog } from 'electron'
import { DateTime } from 'luxon'

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

async function makePvs() {
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
  return pvs
}

function translated(category: string) {
  return category
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
    pvs: await makePvs()
  }

  let introduction = `
{{标题替换|{{lj|${data.title}}}}}
{{虚拟歌手歌曲荣誉题头|}}
{{VOCALOID_Songbox
|image = ${data.title}.jpg
|图片信息 = illustration by ${data.illustrators.join("、")}
|颜色 =
|演唱 = [[${data.vocalists.join(']]、[[')}]]
|歌曲名称 = ${data.names.join('<br/>')} <!-- 自己把多余的名字删掉，没有的名字补上 -->
|P主 = [[${data.producers.join(']]、[[')}]]
${ data.pvs.NicoNicoDouga ? "|nnd_id = " + data.pvs.NicoNicoDouga.id : ''}
${ data.pvs.Youtube ? "|yt_id = " + data.pvs.Youtube.id : ''}
${ data.pvs.Bilibili ? "|bb_id = av" + data.pvs.Bilibili.id : ''}
|其他资料 =
${ data.pvs.NicoNicoDouga ? '于'+data.pvs.NicoNicoDouga.upload.setZone('UTC+9').toFormat('yyyy年M月d日')+'投稿至niconico，再生数为{{NiconicoCount|id='+data.pvs.NicoNicoDouga.id+'}}' : '\b' }
${ data.pvs.Youtube ? '于'+data.pvs.Youtube.upload.setZone('UTC+9').toFormat('yyyy年M月d日')+'投稿至YouTube，再生数为{{YoutubeCount|id='+data.pvs.Youtube.id+'}}' : '\b' }
${ data.pvs.Bilibili ? '于'+data.pvs.Bilibili.upload.setZone('UTC+9').toFormat('yyyy年M月d日')+'投稿至bilibili，再生数为{{BilibiliCount|id=av'+data.pvs.Bilibili.id+'}}' : '\b' }
}}

《'''${data.title}'''》是{{lj|}}于XXXX年X月X日投稿至[[某站点]]的[[某引擎]]原创歌曲，由[[某歌姬]]演唱。收录于专辑'''某某某'''。

`;
  let song = `
== 歌曲 ==

{{VOCALOID Songbox Introduction
${ (Object.entries(staff) as [string, string[]][]).map(([category, names]) => "|"+translated(category)+' = '+names.join('、')).join('\n') }
}}

{{BilibiliVideo|id=}}

  `;
  let lyrics = `

== 歌词 ==
*翻译：xxx<ref>翻译转载自xxx</ref>
{{LyricsKai
|lstyle=
|rstyle=
|original=
|translated=
}}

`
  let references = `


== 注释与外部链接 ==
<references/>

[[分类:日本音乐作品]]
[[分类:使用VOCALOID的歌曲]]
[[分类:初音未来歌曲]]
`
  return introduction + song + lyrics + references
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
