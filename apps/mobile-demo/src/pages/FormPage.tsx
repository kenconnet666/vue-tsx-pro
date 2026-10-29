// 表单：搜索、输入框（必填、格式、异步校验、验证码倒计时、密码、多行）、开关、单选、多选、步进器、评分、滑块、图片上传；三端同一份页面
import { Lock, Phone, User } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  CellGroup,
  Checkbox,
  CheckboxGroup,
  ConfigProvider,
  Field,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Rate,
  Search,
  Slider,
  Stepper,
  Switch,
  Uploader,
  showDialog,
  showFailToast,
  showSuccessToast,
  showToast,
  type ChoiceValue,
  type SliderValue,
  type UploaderFile,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { onBeforeUnmount } from 'vue';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
  submit: { paddingInline: '_lg', paddingBlockStart: '_xl' },
  budget: { flex: '1 1 auto' },
  budgetText: {
    flex: 'none',
    minWidth: '6.5em',
    textAlign: 'end',
    color: '_textMuted',
    fontSize: '_sm',
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FormPage = _component(() => {
  let keyword = _state('');
  let name = _state('');
  let phone = _state('');
  let code = _state('');
  let password = _state('');
  let notify = _state(true);
  let gender = _state<ChoiceValue>('unknown');
  let tags = _state<ChoiceValue[]>(['coffee']);
  let count = _state(1);
  let score = _state(4.5);
  let budget = _state<SliderValue>([200, 600]);
  let note = _state('');
  let photos = _state<UploaderFile[]>([]);
  let agree = _state(false);
  let countdown = _state(0);

  let timer: ReturnType<typeof setInterval> | undefined;
  onBeforeUnmount(() => clearInterval(timer));
  const sendCode = () => {
    if (!/^1\d{10}$/.test(phone)) return showFailToast('先填手机号');
    countdown = 60;
    timer = setInterval(() => {
      if (--countdown <= 0) clearInterval(timer);
    }, 1000);
    showToast('验证码已发送：1234');
  };
  // 模拟上传：一秒后成功，名字带 fail 的失败
  const upload = (files: UploaderFile[]) => {
    for (const file of files) {
      file.status = 'uploading';
      file.message = '上传中';
      void wait(1000).then(() => {
        file.status = 'done';
        file.message = undefined;
      });
    }
  };

  return () => (
    <ConfigProvider {...css.attrs(styles.page)}>
      <Search _value={keyword} onSearch={(text) => showToast(`搜索：${text || '（空）'}`)} />
      <Form
        onSubmit={(values) =>
          void showDialog({ title: '提交成功', message: JSON.stringify(values, null, 2) })
        }
        onFailed={({ errors }) => showFailToast(errors[0]!.message)}
      >
        <CellGroup title="账户">
          <Field
            name="name"
            label="用户名"
            icon={User}
            _value={name}
            placeholder="字母、数字，4–16 位"
            clearable
            rules={[
              { required: true },
              { pattern: /^\w{4,16}$/, message: '4–16 位字母、数字或下划线' },
              {
                // 模拟查重：admin 已被占用
                validator: (value) => wait(300).then(() => value !== 'admin' || '用户名已被占用'),
              },
            ]}
          />
          <Field
            name="phone"
            label="手机号"
            icon={Phone}
            type="tel"
            maxlength={11}
            _value={phone}
            placeholder="11 位手机号"
            rules={[{ required: true }, { pattern: /^1\d{10}$/, message: '手机号格式不对' }]}
          />
          <Field
            name="code"
            label="验证码"
            type="digit"
            maxlength={6}
            _value={code}
            placeholder="短信验证码"
            center
            rules={[{ required: true }]}
            suffix={
              <Button size="sm" variant="soft" disabled={countdown > 0} onClick={sendCode}>
                {countdown > 0 ? `${countdown} 秒后重发` : '发送验证码'}
              </Button>
            }
          />
          <Field
            name="password"
            label="密码"
            icon={Lock}
            type="password"
            _value={password}
            placeholder="至少 8 位"
            clearable
            rules={[
              { required: true },
              { validator: (value) => String(value).length >= 8 || '至少 8 位' },
            ]}
          />
        </CellGroup>

        <CellGroup title="偏好">
          <FormItem label="消息通知" name="notify" value={notify} center>
            <Switch _checked={notify} aria-label="消息通知" />
          </FormItem>
          <FormItem label="性别" name="gender" value={gender}>
            <RadioGroup _value={gender} direction="horizontal">
              <Radio name="male">男</Radio>
              <Radio name="female">女</Radio>
              <Radio name="unknown">不透露</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem
            label="喜好"
            name="tags"
            value={tags}
            help="最多选 3 个"
            rules={[{ required: true, message: '至少选一个', trigger: 'change' }]}
          >
            <CheckboxGroup _value={tags} direction="horizontal" max={3} shape="square">
              <Checkbox name="coffee">咖啡</Checkbox>
              <Checkbox name="tea">茶</Checkbox>
              <Checkbox name="juice">果汁</Checkbox>
              <Checkbox name="milk">牛奶</Checkbox>
            </CheckboxGroup>
          </FormItem>
          <FormItem label="购买数量" name="count" value={count} center>
            <Stepper _value={count} max={10} />
            <Stepper _value={count} max={10} theme="round" />
          </FormItem>
          <FormItem label="满意度" name="score" value={score} center>
            <Rate _value={score} allowHalf />
          </FormItem>
          <FormItem label="预算（元）" name="budget" value={budget} center>
            <Slider _value={budget} min={0} max={1000} step={50} sx={styles.budget} />
            <span {...css.attrs(styles.budgetText)}>
              {Array.isArray(budget) ? `${budget[0]} – ${budget[1]}` : budget}
            </span>
          </FormItem>
        </CellGroup>

        <CellGroup title="补充">
          <Field
            name="note"
            label="备注"
            labelPosition="top"
            multiline
            autosize
            rows={3}
            maxlength={120}
            showWordLimit
            _value={note}
            placeholder="配送时间、门牌号等"
          />
          <FormItem
            label="照片"
            labelPosition="top"
            name="photos"
            value={photos}
            help="最多 4 张，选图后模拟上传"
          >
            <Uploader _value={photos} maxCount={4} onRead={upload} />
          </FormItem>
          <FormItem
            name="agree"
            value={agree}
            rules={[{ required: true, message: '请先同意用户协议', trigger: 'change' }]}
          >
            <Checkbox _checked={agree}>我已阅读并同意《用户协议》</Checkbox>
          </FormItem>
        </CellGroup>

        <div {...css.attrs(styles.submit)}>
          <Button type="submit" size="lg" fullWidth radius="full">
            提交
          </Button>
        </div>
      </Form>
      <div {...css.attrs(styles.submit)}>
        <Button
          variant="ghost"
          tone="neutral"
          fullWidth
          onClick={() => showSuccessToast('草稿已保存')}
        >
          保存草稿
        </Button>
      </div>
    </ConfigProvider>
  );
});
