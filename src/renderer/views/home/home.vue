<script setup>
import { useRouter } from 'vue-router'
import { gotoPath } from '@renderer/api'
import { ElMessageBox } from 'element-plus'
// router钩子，返回路由器实例
const router = useRouter()

const { ipcRenderer } = window.electron

// 登录
const goto = (path) => {
  router.push(path)
}


</script>

<template>
  <div class="P-home">
    <h1>Home Page</h1>
    <div class="ipt-con">
      <el-button type="primary" @click="readDir">读取目录列表</el-button>
    </div>
    <div className="ipt-con">
      <el-button type="primary" @click="getElectronVersion">查看Electron版本</el-button>
    </div>
    <div class="ipt-con">
      <el-button @click="gotoPath('/login')">组件外跳转</el-button>
    </div>
    <div class="ipt-con">
      <el-button @click="goto('/login')">返回登录</el-button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.P-home
    position: absolute
    top: 0
    bottom: 0
    width: 100%
    background: linear-gradient(#f48c8d,#f4c58d)
    text-align: center
    h1
        margin-top: 50px
        color: #fff
        font-size: 28px
    .ipt-con
        margin: 20px auto 0
        text-align: center
</style>
