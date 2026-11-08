# P12 候选（scripts/structure/p12-candidates.mjs 生成）

逐条看：能换成基础组件的换；子组件该转发部件属性的加 `propsXxx`（mergePartProps 合并）；内部节点补标记或改成配方。
有理由保留的（几百个格子为性能直接写、语义不同）在旁边注明，不必改。

## 手写的基础节点（37）

- packages/ui/src/navigation/NavBar.tsx:163 <a href>
- packages/ui/src/input/Cascader.tsx:702 <button>
- packages/ui/src/input/PeoplePicker.tsx:162 <button>
- packages/ui/src/input/Select.tsx:498 <button>
- packages/ui/src/input/SignaturePad.tsx:247 <svg>
- packages/ui/src/input/ToggleGroup.tsx:281 <button>
- packages/ui/src/input/TreeSelect.tsx:440 <button>
- packages/ui/src/feedback/Progress.tsx:385 <svg>
- packages/ui/src/display/Checklist.tsx:255 <button>
- packages/ui/src/display/Ellipsis.tsx:155 <button>
- packages/ui/src/display/Gauge.tsx:211 <svg>
- packages/ui/src/display/Image.tsx:228 <button>
- packages/ui/src/display/QRCode.tsx:209 <svg>
- packages/ui/src/display/Sparkline.tsx:150 <svg>
- packages/ui/src/display/Timeline.tsx:52 <time>
- packages/ui/src/display/Timeline.tsx:330 <time>
- packages/ui/src/diagram/Diagram.tsx:1333 <svg>
- packages/ui/src/diagram/Diagram.tsx:1382 <svg>
- packages/ui/src/diagram/DiagramMinimap.tsx:137 <svg>
- packages/ui/src/diagram/DiagramNode.tsx:243 <svg>
- packages/ui/src/date/CalendarBoard.tsx:365 <button>
- packages/ui/src/date/CalendarBoard.tsx:444 <button>
- packages/ui/src/date/CalendarView.tsx:350 <button>
- packages/ui/src/date/CalendarView.tsx:576 <button>
- packages/ui/src/date/DateTime.tsx:49 <time>
- packages/ui/src/date/QuarterCalendar.tsx:250 <button>
- packages/ui/src/date/RelativeTime.tsx:80 <time>
- packages/ui/src/date/RelativeTime.tsx:78 format.relative
- packages/ui/src/charts/ChordChart.tsx:185 <svg>
- packages/ui/src/charts/DonutChart.tsx:210 <svg>
- packages/ui/src/charts/GraphChart.tsx:684 <svg>
- packages/ui/src/charts/MapChart.tsx:578 <svg>
- packages/ui/src/charts/RadarChart.tsx:160 <svg>
- packages/ui/src/charts/SankeyChart.tsx:173 <svg>
- packages/ui/src/charts/TimelineChart.tsx:274 <svg>
- packages/ui/src/charts/TreemapChart.tsx:202 <svg>
- packages/ui/src/charts/XYChart.tsx:1027 <svg>

## 没转发部件属性的子组件（0）

（无）

## 没有部件标记的内部节点（按文件计数）（26）

- packages/ui/src/table/DataTableView.tsx：3
- packages/ui/src/input/Rating.tsx：2
- packages/ui/src/input/TreeSelect.tsx：2
- packages/ui/src/display/Tree.tsx：2
- packages/ui/src/date/CalendarView.tsx：2
- packages/ui/src/config/Provider.tsx：2
- packages/ui/src/charts/GraphChart.tsx：2
- packages/ui/src/table/TreeDataTable.tsx：1
- packages/ui/src/patterns/AppShell.tsx：1
- packages/ui/src/navigation/NavBar.tsx：1
- packages/ui/src/input/Cascader.tsx：1
- packages/ui/src/input/Listbox.tsx：1
- packages/ui/src/input/PeoplePicker.tsx：1
- packages/ui/src/input/Select.tsx：1
- packages/ui/src/display/Checklist.tsx：1
- packages/ui/src/display/FieldCompare.tsx：1
- packages/ui/src/display/ItemList.tsx：1
- packages/ui/src/display/JsonViewer.tsx：1
- packages/ui/src/display/ProportionBar.tsx：1
- packages/ui/src/display/Stat.tsx：1
- packages/ui/src/display/Timeline.tsx：1
- packages/ui/src/date/QuarterCalendar.tsx：1
- packages/ui/src/code-editor/CodeEditor.tsx：1
- packages/ui/src/charts/ChordChart.tsx：1
- packages/ui/src/charts/RadarChart.tsx：1
- packages/ui/src/charts/TimelineChart.tsx：1
