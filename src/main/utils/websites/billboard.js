import axios from 'axios'
import * as cheerio from 'cheerio'

const config = {
  method: 'GET',
  url: 'https://www.billboard-japan.com/charts/detail?a=niconico',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  }
};


export async function billboard() {
  const songs_data = []
  try {

    const response = await axios.request(config); // 使用 await 来处理异步请求
    const $ = cheerio.load(response.data);
    const table = $('body').find('tbody')
    const song_datas = table.find('tr')

    song_datas.each((index, element) => {
      const data = $(element)
      const rank = data.find('[headers=rank]')
      const name = data.find('[headers=name]')

      const song_data = {
        current: Number(rank.children().first().text().trim()),
        change: rank.children().eq(1).attr('class'),
        former: Number(rank.children().eq(1).text()),
        image: `https://www.billboard-japan.com${name.find('img').first().attr('src').trim()}`,
        song: data.find('.musuc_title').first().text().trim(),
        link: '',
        artist: name.find('.artist_name').text().trim()
      }

      if (name.find('.musuc_title').first().find('a')) {
        song_data.link = name.find('.musuc_title').find('a').attr('href')
      }

      songs_data.push(song_data)
    })
  } catch (error) {
    console.log('error', error);
  }

  return songs_data
}
