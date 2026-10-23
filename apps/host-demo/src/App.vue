<template>
  <nav>
    <RouterLink to="/">首页</RouterLink>
    |
    <RouterLink to="/profile/42">资料（TSX）</RouterLink>
    |
    <RouterLink to="/integration">集成验证</RouterLink>
    |
    <RouterLink to="/base">基础组件</RouterLink>
    |
    <RouterLink to="/date">日期</RouterLink>
  </nav>
  <RouterView />
</template>
