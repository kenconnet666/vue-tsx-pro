/**
 * 移动端的分组页：每组对应 mobile-demo 的一个演示页（手机外框里运行它的 H5 版，旁边是微信里的截图），
 * 列出这一组的组件。导航（site/nav.ts）与页面（Section.tsx）都从这里取
 */

/** 一组组件 */
export interface MobileSection {
  /** mobile-demo 的页面名：路由 /mobile/<demo>，外框打开 mobile-frame.html#<demo>，截图 /mobile/wx/<demo>.png */
  demo: string;
  title: string;
  description: string;
  /** 组件名与一句话说明 */
  components: [name: string, summary: string][];
}

export const MOBILE_SECTIONS: MobileSection[] = [
  {
    demo: 'index',
    title: 'Basics 基础',
    description: '按钮、单元格、图标、标签、徽标、图片与加载，亮暗主题跟着 ConfigProvider 切换',
    components: [
      [
        'ConfigProvider',
        '主题（light / dark / system）、语言包、组件默认值；最外层的一个负责挂反馈浮层',
      ],
      ['Button', '实心、浅色、描边、幽灵四种样式，色调、尺寸、圆角、加载中、前后图标、整行'],
      ['Cell / CellGroup', '列表行：标题、说明、值、箭头，可点击时按压反馈；分组带标题与圆角卡片'],
      ['Icon', '按名导入 @lucide/icons 的图标数据渲染；filled 填充'],
      ['Tag / Badge', '标签（三种样式、色调、尺寸、可关闭）与角标（红点、数字上限、偏移）'],
      ['Image', '加载中与出错的占位、填充方式、懒加载'],
      ['Loading / Divider / Space', '加载指示（尺寸、文字竖排）、分隔线、间距'],
    ],
  },
  {
    demo: 'form',
    title: 'Form 表单',
    description:
      '表单校验、输入框、开关、单选多选、步进器、评分、滑块、上传，Enter 与提交按钮都能提交',
    components: [
      ['Form / FormItem', '规则：必填、正则、异步校验，失焦 / 变化 / 提交时触发；改值后重新校验'],
      ['Field', '单行与多行、清除、字数、密码、键盘类型；小程序里值随输入写回'],
      ['Search', '圆角搜索框，确认键搜索'],
      ['Switch / Checkbox / Radio', '开关与选择：组、最多选几个、方形与圆形'],
      ['Stepper / Rate / Slider', '步进、评分（半星）、单值与区间滑块'],
      ['Uploader', '选图（宿主的选图能力，小程序里是 chooseMedia）、预览、删除、数量与大小上限'],
    ],
  },
  {
    demo: 'pickers',
    title: 'Pickers 选择器',
    description: '滚轮、日期时间、级联、日历、下拉菜单；省市区数据走子路径 -mobile/area',
    components: [
      ['Picker', '滚轮：惯性、松手对齐、跳过禁用项；多列与联动'],
      ['DatePicker / TimePicker', '建在 Picker 上：范围、分钟步长、换月份时日子修正'],
      ['Cascader', '逐级标签加选项列表，选到最后一级完成'],
      ['Calendar', '单选、区间、多选，一周从周几开始随语言包'],
      ['DropdownMenu / DropdownItem', '面板与遮罩从菜单下沿展开'],
      ['areaOptions()', '@zerodep-dev/vue-tsx-pro-mobile/area：省市区选项树'],
    ],
  },
  {
    demo: 'feedback',
    title: 'Feedback 反馈与浮层',
    description: '弹出层、动作面板、对话框、轻提示、通知、下拉刷新、滑动单元格、骨架屏',
    components: [
      ['Popup / Overlay', '四个方向与居中，圆角、关闭按钮，锁住页面滚动'],
      ['ActionSheet', '动作列表、描述、取消'],
      ['Dialog / showDialog / showConfirmDialog', '组件写法与函数调用两种'],
      ['showToast / showNotify', '文字、成功、失败、加载中的提示；顶部通知'],
      ['PullRefresh', '下拉刷新：下拉、释放、加载中、成功提示'],
      ['SwipeCell', '左右滑出操作按钮，按量出的按钮宽度停住'],
      ['Skeleton', '占位：头像、标题、几行文字'],
    ],
  },
  {
    demo: 'display',
    title: 'Display 展示',
    description: '宫格、折叠面板、步骤条、通知栏、空状态，以及 40 层嵌套（小程序的递归组件）',
    components: [
      ['Grid / GridItem', '宫格：列数、图标与文字、角标'],
      ['Collapse / CollapseItem', '折叠面板，手风琴'],
      ['Steps', '横向与纵向步骤条'],
      ['NoticeBar', '通知栏：放不下时滚动、可关闭、链接'],
      ['Empty', '空状态：默认、搜索、网络、出错几种预设，说明与操作'],
    ],
  },
  {
    demo: 'navigation',
    title: 'Navigation 导航',
    description: '导航栏、标签页、底部标签栏、吸顶、回到顶部',
    components: [
      ['NavBar', '标题、返回箭头、左右两侧，固定在顶部时带占位（含安全区）'],
      ['Tabs / Tab', '标签页：下划线跟随、可滑动、吸顶'],
      ['TabBar / TabBarItem', '底部标签栏：图标、角标'],
      ['Sticky', '吸顶（宿主报告的页面滚动）'],
      ['BackTop', '滚过一屏后出现，点一下回到顶部'],
    ],
  },
  {
    demo: 'shop',
    title: 'Shop 场景：商城',
    description: '列表到详情到下单走一遍：搜索、轮播、宫格、无限列表、规格选择、表单提交',
    components: [
      ['Swiper / SwiperItem', '轮播：自动播放、指示点、跟手滑动'],
      ['List', '滚到底加载下一页，出错重试，加载完'],
      ['IndexBar / IndexAnchor', '城市列表的字母索引（演示页 cities）'],
    ],
  },
];
