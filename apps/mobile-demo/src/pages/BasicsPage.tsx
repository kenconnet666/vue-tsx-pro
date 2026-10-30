// 基础组件：按钮、单元格、标签、徽标、图片、分隔线、间距、加载指示；三端（H5、微信、支付宝）用同一份页面
import { Bell, Heart, MapPin, MessageCircle, Plus, Settings, Trash2, User } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Button,
  Cell,
  CellGroup,
  ConfigProvider,
  Divider,
  Icon,
  Image,
  Radio,
  RadioGroup,
  Loading,
  Space,
  Tag,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { demoSettings } from '../settings.ts';
import { go } from '../nav.ts';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
  section: { paddingInline: '_lg', paddingBlock: '_md' },
  count: { color: '_textMuted', fontSize: '_sm' },
});

/** 示例图（小图，从公共图床取） */
const PHOTO = 'https://picsum.photos/id/1062/240/240';

export const BasicsPage = _component(() => {
  let count = _state(0);
  let loading = _state(false);
  let liked = _state(false);
  let tags = _state(['新品', '包邮', '限时折扣']);

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <CellGroup title="主题">
        <div {...css.attrs(styles.section)}>
          <RadioGroup _value={demoSettings.theme} direction="horizontal">
            <Radio name="light">亮色</Radio>
            <Radio name="dark">暗色</Radio>
            <Radio name="system">跟随系统</Radio>
          </RadioGroup>
        </div>
      </CellGroup>
      <CellGroup title="真实场景">
        <Cell
          title="商城"
          description="列表（触底加载、失败重试）→ 商品详情 → 确认订单提交"
          arrow
          onClick={() => go('shop')}
        />
        <Cell
          title="城市列表"
          description="索引栏：点字母或在字母栏上滑动"
          arrow
          onClick={() => go('cities')}
        />
      </CellGroup>
      <CellGroup title="更多演示">
        <Cell
          title="浮层与反馈"
          description="弹出层、对话框、轻提示、滑动单元格、下拉刷新"
          arrow
          onClick={() => go('feedback')}
        />
        <Cell
          title="表单"
          description="输入框、校验、开关、单选多选、步进器、评分、滑块、上传"
          arrow
          onClick={() => go('form')}
        />
        <Cell
          title="展示"
          description="通知栏、宫格、步骤条、折叠面板、空状态"
          arrow
          onClick={() => go('display')}
        />
        <Cell
          title="导航"
          description="导航栏、吸顶标签页（可滑动）、底部标签栏、回到顶部"
          arrow
          onClick={() => go('navigation')}
        />
        <Cell
          title="选择"
          description="下拉菜单、滚轮、省市区、日期时间、级联、日历"
          arrow
          onClick={() => go('pickers')}
        />
      </CellGroup>
      <CellGroup title="按钮">
        <div {...css.attrs(styles.section)}>
          <Space>
            <Button onClick={() => count++}>主要 {count}</Button>
            <Button variant="soft" onClick={() => count++}>
              浅色
            </Button>
            <Button variant="outline" tone="neutral">
              描边
            </Button>
            <Button variant="ghost">文字</Button>
          </Space>
        </div>
        <div {...css.attrs(styles.section)}>
          <Space>
            <Button size="xs">极小</Button>
            <Button size="sm" icon={Plus}>
              小号
            </Button>
            <Button tone="danger" variant="outline" icon={Trash2} size="sm">
              删除
            </Button>
            <Button
              size="sm"
              tone="danger"
              variant={liked ? 'solid' : 'soft'}
              icon={Heart}
              aria-pressed={liked}
              onClick={() => (liked = !liked)}
            >
              {liked ? '已收藏' : '收藏'}
            </Button>
          </Space>
        </div>
        <div {...css.attrs(styles.section)}>
          <Space direction="vertical" fill>
            <Button
              size="lg"
              fullWidth
              radius="full"
              loading={loading}
              loadingText="提交中…"
              onClick={() => (loading = true)}
            >
              提交订单
            </Button>
            <Space>
              <Button size="sm" variant="soft" tone="neutral" onClick={() => (loading = !loading)}>
                切换加载
              </Button>
              <Button size="sm" disabled onClick={() => count++}>
                禁用
              </Button>
              <span class="count" {...css.attrs(styles.count)}>
                点击次数：{count}
              </span>
            </Space>
          </Space>
        </div>
      </CellGroup>

      <CellGroup title="单元格" inset>
        <Cell icon={User} title="个人资料" value="莱恩" arrow onClick={() => count++} />
        <Cell icon={MapPin} title="收货地址" description="上海市浦东新区世纪大道 100 号" arrow />
        <Cell icon={Bell} title="消息通知" value={<Badge content={12} max={9} />} arrow />
        <Cell icon={Settings} title="设置" required value="必填项" />
      </CellGroup>

      <CellGroup title="标签">
        <div {...css.attrs(styles.section)}>
          <Space>
            <Tag>默认</Tag>
            <Tag tone="accent">品牌</Tag>
            <Tag tone="success">已付款</Tag>
            <Tag tone="warning" variant="outline">
              待发货
            </Tag>
            <Tag tone="danger" variant="solid" radius="full">
              热卖
            </Tag>
            {tags.map((tag) => (
              <Tag
                key={tag}
                tone="info"
                closable
                onClose={() => (tags = tags.filter((item) => item !== tag))}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      </CellGroup>

      <CellGroup title="徽标与图标">
        <div {...css.attrs(styles.section)}>
          <Space gap="xl">
            <Badge content={5}>
              <Icon icon={MessageCircle} size={28} />
            </Badge>
            <Badge content={128} max={99}>
              <Icon icon={Bell} size={28} />
            </Badge>
            <Badge dot>
              <Icon icon={User} size={28} />
            </Badge>
            <Badge content="新" tone="success" />
          </Space>
        </div>
      </CellGroup>

      <CellGroup title="图片">
        <div {...css.attrs(styles.section)}>
          <Space gap="md">
            <Image src={PHOTO} width={72} height={72} fit="cover" radius="md" />
            <Image src={PHOTO} width={72} height={72} fit="cover" round />
            <Image src="https://example.invalid/none.png" width={72} height={72} radius="md" />
          </Space>
        </div>
      </CellGroup>

      <Divider>分隔线</Divider>
      <Divider align="start" dashed>
        靠左的虚线
      </Divider>

      <CellGroup title="加载">
        <div {...css.attrs(styles.section)}>
          <Space gap="xl">
            <Loading />
            <Loading>加载中…</Loading>
            <Loading vertical size={24}>
              正在同步
            </Loading>
          </Space>
        </div>
      </CellGroup>
    </ConfigProvider>
  );
});
