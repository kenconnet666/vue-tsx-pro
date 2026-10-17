<script setup lang="ts">
import { useUserStore } from '../stores/user';

const user = useUserStore();
</script>

<template>
  <section class="home">
    <h1>首页（SFC）</h1>
    <p class="home-name">当前用户：{{ user.name }}</p>
  </section>
</template>
