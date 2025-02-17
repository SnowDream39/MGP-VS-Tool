<script setup>
import { ref, computed, onMounted, toRaw } from 'vue';
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const { vocadbGet, toEntry, openExternal } = window.electron;

const searchTitle = ref();
const songsData = ref([]);  // 将 songsData 声明为响应式数据
const selectedSongData = ref({})
const songStatus = computed(() => {
  const status = {
    hasOriginalLyric: false,
    pvs: []
  }

  let lyrics = selectedSongData.value.lyricsFromParents;
  for(var i=0; i<lyrics.length; i++){
    if (lyrics[i].translationType == "Original") status.hasOriginalLyric = true;
  }
  let pvs = selectedSongData.value.pvs;
  const services = ["NicoNicoDouga", "Youtube", "Bilibili"];
  for (let service of services) {  // 使用 for...of 遍历 services 数组
    for (let j = 0; j < pvs.length; j++) {  // 使用 j 遍历 pvs 数组
      let pv = pvs[j];
      if (pv.pvType == "Original" && pv.service == service) {
        status.pvs.push(pv.pvId);
        break;  // 找到匹配项后跳出内层循环
      }
    }
  }

  return status
})

let hasSelectedSong = ref(false);
let selectedSongId;

async function selectSong(id) {
  songStatus.value = {
    hasOriginalLyric: false,
    pvs: []
  }
  selectedSongData.value = undefined
  selectedSongId = id
  selectedSongData.value = await vocadbGet('song', {id: id})
  console.log(toRaw(selectedSongData.value))

  hasSelectedSong.value = true;
}

async function output() {
  const result = await toEntry(toRaw(selectedSongData.value))
  return result
}

async function searchSong() {
  try {
    const response = await vocadbGet("search-songs", { keyword: toRaw(searchTitle.value), page: 1});  // 获取数据
    console.log(response);  // 打印返回的数据
    songsData.value = response.items;  // 将数据赋值给响应式变量
  } catch (error) {
    console.error('数据加载失败', error);
  }
}

function openVocadb() {
  openExternal(`https://vocadb.net/S/${selectedSongData.value.song.id}`)
}

</script>

<template>
  <h1>vocadb搜索</h1>
  <span class="noRefererConfig" style="display: none;"></span>
  <el-button type="primary" @click="router.push('/menu')">返回目录</el-button>
  <div class="search-box">
    <el-input v-model="searchTitle" placeholder="歌名" @keyup.enter="searchSong" >
      <template #append>
        <el-button :icon="Search" @click="searchSong"/>
      </template>
    </el-input>
  </div>
  <el-table :data="songsData">
    <el-table-column label="封面" width="200">
      <template #default="scope">
        <img :src="scope.row.mainPicture.urlThumb" alt="image" />
      </template>
    </el-table-column>
    <el-table-column prop="name" label="歌名" />
    <el-table-column prop="artistString" label="作者" />
    <el-table-column prop="songType" label="类型" width="100" />
    <el-table-column label="操作" width="120">
      <template #default="scope">
        <el-button type="primary" @click="selectSong(songsData[scope.$index].id)">选择歌曲</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog v-model="hasSelectedSong" title="选择歌曲" close="console.log(hasSelectedSong)" width="800">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <h2>歌曲信息</h2>
        <div>歌名： {{ selectedSongData.song.name }}</div>
        <div>作者： {{ selectedSongData.song.artistString }}</div>
        <div>类型： {{ selectedSongData.song.songType }}</div>
        <div>歌词： {{ songStatus.hasOriginalLyric ? "有" : "无" }}</div>
        <div>视频： {{ songStatus.pvs.join("、") }}</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center;">
        <img :src="selectedSongData.song.mainPicture.urlThumb" alt="image" />
        <el-button type="primary" @click="output" style="margin-top: 10px;">生成条目</el-button>
        <el-button type="primary" @click="openVocadb" style="margin-top: 10px;">打开网页</el-button>
      </div>
    </div>
    <h2>STAFF</h2>
    <el-table :data="selectedSongData.artists">
      <el-table-column prop="categories" label="categories" />
      <el-table-column prop="roles" label="roles" />
      <el-table-column prop="name" label="name" />
    </el-table>
  </el-dialog>
</template>


<style scoped lang="stylus">
h1
  text-align: center;
img
  height 100px
.search-box
  width 80%
  margin 0 auto


</style>
