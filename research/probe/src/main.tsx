import './main.css'
import { createApp, ref } from 'vue'
import * as stylex from '@stylexjs/stylex'
import { component } from './component'
import { Toggle } from './Toggle'
import { Card } from './Card'
import { TextField } from './TextField'

const page = stylex.create({
  danger: {
    color: { default: 'crimson', ':hover': 'white' },
    backgroundColor: { default: 'transparent', ':hover': 'crimson' },
    borderColor: 'crimson',
  },
})

const App = component(() => {
  // 状态由页面持有，直接把 Ref 交给子组件
  const notify = ref(true)
  const name = ref('')

  return () => (
    <Card title="设置" width={360}>
      <TextField value={name} placeholder="名字" aria-label="名字" />
      <Toggle checked={notify}>通知：{notify.value ? '开' : '关'}</Toggle>
      <Toggle sx={page.danger} onChange={(v) => console.log('危险开关', v)}>危险开关</Toggle>
      <p>你好，{name.value || '匿名'}</p>
    </Card>
  )
})

createApp(App).mount('#app')
