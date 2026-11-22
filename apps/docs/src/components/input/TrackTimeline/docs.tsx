import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TrackTimelineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Cutscene from './demo/Cutscene.tsx?demo';

export const meta = {
  title: 'TrackTimeline 轨道时间轴',
  description:
    '剪辑、动画、过场编辑的时间轴：左边轨道名，右边时间尺和每条轨道上的关键帧、片段、标记，一根播放头；拖着定位、改关键帧的时刻，按帧吸附。',
  order: 22,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TrackTimeline } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <Example id="cutscene" title="过场" demo={Cutscene}>
        轨道的项有三种：<Code>key</Code>（菱形，拖着改时刻）、<Code>clip</Code>（一段时间的条，没有{' '}
        <Code>end</Code> 时按名字的宽度）、<Code>marker</Code>（竖线加名字）。<Code>_time</Code>{' '}
        是播放头，<Code>frameRate</Code> 决定吸附到哪一帧；拖关键帧经 <Code>onItemMove</Code>{' '}
        交出新的时刻（拖动中 <Code>move</Code>、松开 <Code>end</Code>）。给了 <Code>detail</Code>{' '}
        时轨道区换成它（选中轨道的曲线编辑器），时间尺和播放头照旧。
      </Example>
    </Examples>
    <KeyboardReference
      keys={[
        ['← / →', '播放头往前、往后一帧'],
        ['Shift + ← / →', '一次一秒'],
        ['Home / End', '到开头、结尾'],
        ['Alt + ← / →', '选中的关键帧挪一帧'],
      ]}
    >
      拖时间尺或空白处定位播放头，点轨道名选中轨道，按下关键帧、片段、标记选中它。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
