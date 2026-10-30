// 索引栏：按拼音首字母分组的城市，右边字母栏点或滑动跳转，组标题吸顶
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Cell,
  ConfigProvider,
  IndexAnchor,
  IndexBar,
  showToast,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { demoSettings } from '../settings.ts';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
});

const CITIES: Record<string, string[]> = {
  A: ['安庆', '鞍山', '安阳'],
  B: ['北京', '保定', '包头', '蚌埠', '宝鸡'],
  C: ['成都', '重庆', '长沙', '长春', '常州', '沧州'],
  D: ['大连', '东莞', '德州', '大同'],
  F: ['福州', '佛山', '抚顺'],
  G: ['广州', '贵阳', '桂林', '赣州'],
  H: ['杭州', '合肥', '哈尔滨', '海口', '呼和浩特', '惠州'],
  J: ['济南', '嘉兴', '金华', '江门', '九江'],
  K: ['昆明', '开封'],
  L: ['兰州', '洛阳', '柳州', '临沂', '拉萨'],
  N: ['南京', '宁波', '南昌', '南宁', '南通'],
  Q: ['青岛', '泉州', '秦皇岛'],
  S: ['上海', '深圳', '苏州', '沈阳', '石家庄', '绍兴'],
  T: ['天津', '太原', '台州', '唐山'],
  W: ['武汉', '无锡', '温州', '潍坊', '芜湖'],
  X: ['西安', '厦门', '徐州', '西宁', '襄阳'],
  Y: ['烟台', '扬州', '银川', '宜昌'],
  Z: ['郑州', '珠海', '中山', '淄博', '镇江'],
};

export const CitiesPage = _component(() => () => (
  <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
    <IndexBar>
      {Object.entries(CITIES).flatMap(([letter, cities]) => [
        <IndexAnchor index={letter} />,
        ...cities.map((city) => <Cell title={city} onClick={() => showToast(`选了${city}`)} />),
      ])}
    </IndexBar>
  </ConfigProvider>
));
