<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// router钩子，返回路由器实例
const router = useRouter()

const billboard = () => {
  router.push('/billboard')
}
</script>

<template>
  <div class="P-login">
    <img src="./logo.png" class="logo" />
    <div class="ipt-con">
      <el-button type="primary" style="width: 100%" @click="billboard">billboard</el-button>
    </div>
    <div class="ipt-con">
      <el-button type="primary" style="width: 100%" @click="router.push('/vocadb')">vocadb</el-button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.P-login
    text-align: center
    position: absolute
    top: 0
    bottom: 0
    width: 100%
    background: #7adbcb
    .logo
        display: block
        margin: 50px auto 20px
        height: 128px
    .ipt-con
        margin: 0 auto 20px
        width: 400px
        text-align: center
</style>
