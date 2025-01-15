<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../../../../resources/logo.png'

// router钩子，返回路由器实例
const router = useRouter()

const billboard = () => {
  router.push('/billboard')
}

onMounted(() => {
  document.getElementById('logo').src = logo;
})


</script>

<template>
  <div class="P-login">
    <img class="logo" id="logo" />
    <div class="ipt-con">
      <el-button type="primary" style="width: 100%" @click="router.push('/vocadb')">vocadb</el-button>
    </div>
    <div class="ipt-con">
      <el-button type="primary" style="width: 100%" @click="billboard">billboard</el-button>
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
