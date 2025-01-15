import axios from 'axios'
import * as fzstd from 'fzstd'

const headers = {
  'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  'Accept': "application/json, text/plain, */*",
  'Accept-Encoding': "gzip, deflate, br, zstd",
  'sec-ch-ua-platform': "\"Windows\"",
  'sec-ch-ua': "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
  'sec-ch-ua-mobile': "?0",
  'sec-fetch-site': "same-origin",
  'sec-fetch-mode': "cors",
  'sec-fetch-dest': "empty",
  'referer': "https://vocadb.net/S/1000",
  'accept-language': "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,ja;q=0.5,zh-TW;q=0.4",
  'priority': "u=1, i",
};

/**
 * @param {string} name 歌名或别名
 * @param {number} [page=0] 页码，每页10个
 */

async function getData(url, params){
    const response = await axios.get(url, {
      params: params,
      headers: headers,
      responseType: 'arraybuffer'
    });
    const compressedData = new Uint8Array(response.data);  // 从响应中获取压缩数据
    const decompressedData = fzstd.decompress(compressedData);  // 使用 fzstd 解压缩
    const decodedString = new TextDecoder().decode(decompressedData);
    const jsonData = JSON.parse(decodedString);
    return jsonData;
}

async function fetch_songs(name) {

  const url = "https://vocadb.net/api/songs"
  const params = {
    start: 0,
    getTotalCount: true,
    maxResults: 10,
    query: name,
    fields: 'AdditionalNames,MainPicture', // 是请求什么，不是根据什么搜索
    lang: 'Default',
    nameMatchMode: 'Auto',
    sort: 'RatingScore',
    childTags: false,
    artistParticipationStatus: 'Everything',
    onlyWithPvs: false
  }
  return getData(url, params)
}

async function fetch_song(id) {
  const url = `https://vocadb.net/api/songs/${id}/details`;
  const params = {}
  return getData(url, params)
}

async function fetch_lyrics(id) {
  const url = `https://vocadb.net/api/songs/lyrics/${id}`
  const params = {}
  return getData(url, params)
}

async function fetch_vocalist(id) {
  const url = `https://vocadb.net/api/artists/${id}/details`
  const params = {}
  return getData(url, params)
}


export async function search_songs(name) {
  try {
    const data = await fetch_songs(name)
    return data
  } catch (error) {
    console.log("Error:", error)
  }
}

/**
 * 获取歌曲信息
 * @param {number} id 歌曲id
 */
export async function get_song_info(id) {
  try {
    const data = await fetch_song(id)
    delete data.alternateVersions, data.tags
    return data
  } catch (error) {
    console.log("Error:", error)
  }
}

export async function get_lyrics(id) {
  try{
    return await fetch_lyrics(id)
  } catch (error) {
    console.log("Error:", error)
  }
}

export async function get_vocalist(id) {
  try {
    return await fetch_vocalist(id)
  } catch (error) {
    console.log("Error", error)
  }
}
