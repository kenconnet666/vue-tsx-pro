# 更新记录

每一版对使用方的变化。发版时由 `node scripts/release.mjs` 从 [RELEASE.md](RELEASE.md) 的“下一版对使用方的变化”搬过来；
0.11.0 及更早的版本见 [GitHub Releases](https://github.com/kenconnet666/vue-tsx-pro/releases)。

## 0.11.2（2026-11-07）

- Calendar、DatePicker 的月份、年份视图里用指针点一格，逐级回到日期视图时焦点仍是原来那天（以前会变成那个月的 1 日、那年的 1 月；键盘一直是对的）。
- DataTable 的勾选列、单选列不再把表头和各行撑高（以前有勾选列的表头约高 5px），勾选框在格子里上下居中。
  部件 `selectAll`、`selectCheckbox`、`selectRadio` 的样式与 `data-part` 改加在 Checkbox / Radio 的外层 label 上（以前在里面的 input 上）；
  按 `input[data-part="selectCheckbox"]` 写的选择器要改成 `label[data-part="selectCheckbox"] input`。

## 0.11.1（2026-11-07）

- Checkbox、Radio、Switch（以及表格里的勾选列）的方框、圆、开关轨道按外层文字的字号算：以前原生 input 没继承字体，
  按浏览器的 13.333px 算，和文字、开关滑块的比例对不上，`size` 档位越大差得越多。
- ColorField 的取色器、OtpField 的输入框同样改为继承字体（外观不变）。
