# 课程笔记 Markdown 规范

`/courses/` 下的笔记都按本规范书写。将来的 ElegantBook → Markdown 转换工具以本规范为输出目标。

## 文件位置

```
_courses/<course>.md              # 一门课：front matter + 课程说明（正文留空则显示"说明待补充"）
_notes/<course>/<NN>-<slug>.md    # 该课的一篇笔记，<course> 必须与 _courses/ 下的文件名一致
images/notes/<course>/            # 笔记图片
```

笔记网址：`/courses/<course>/<NN>-<slug>/`。

## 课程 front matter（`_courses/<course>.md`）

```yaml
title: "高等代数"               # 中文名（自学课用课程代号，如 CS61A）
title_en: "Advanced Algebra"    # 英文名
shelf: math                     # 书架 id，见 _data/course_shelves.yml
order: 1                        # 书架内排序，同时是 VOL. 编号
repo: "https://github.com/..."  # 可选：GitHub 仓库入口
coding: true                    # 可选：有编程/大作业但还没有 repo 时，显示"仓库即将上线"
```

## 笔记 front matter（`_notes/<course>/<NN>-<slug>.md`）

```yaml
title: "第一章 线性方程组"
order: 1                        # 课程内排序
updated: 2026-10-21             # 可选：显示"更新于"
```

## 公式

站点用 kramdown + MathJax。**行内公式和行间公式都写 `$$...$$`**，kramdown 按上下文判断：

- 与文字同一段落内 → 行内公式：`设 $$A \in M_n(\mathbb{F})$$，则……`
- 单独成段（前后各空一行）→ 行间公式：

  ```
  
  $$
  \begin{pmatrix} a & b \\ c & d \end{pmatrix}
  $$
  
  ```

不要用单个 `$...$`：kramdown 会把其中的 `_`、`*`、`\\` 当成 Markdown 语法处理，导致公式出错。

## 定理类环境（对应 ElegantBook）

用带 `markdown="1"` 的 `div`，第一行加粗写环境名和编号：

```html
<div class="env env--theorem" markdown="1">
**定理 1.2**（Cayley–Hamilton）设 $$A$$ 为 $$n$$ 阶方阵，则 $$f_A(A) = 0$$。
</div>
```

| class | ElegantBook 环境 | 颜色 |
|---|---|---|
| `env--definition` | definition | 绿 |
| `env--theorem` `env--lemma` `env--proposition` `env--corollary` `env--axiom` | theorem 等 | 蓝 |
| `env--example` `env--exercise` `env--problem` | example 等 | 橙 |
| `env--proof` `env--solution` | proof / solution | 灰虚线，结尾自动加 ∎ |
| `env--remark` `env--note` `env--introduction` | remark / note / introduction | 灰 |

环境内部照常写 Markdown 和公式；环境不能嵌套。

## 代码

用带语言名的 fenced code block（` ```cpp `、` ```python `），站点自带语法高亮。

## 图片

`![说明](/images/notes/<course>/<file>.png)`
