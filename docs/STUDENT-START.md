# 学生三步开始

## 1. 注册自己的账号

在 https://github.com/signup 注册 GitHub 个人账号并验证邮箱，密码、验证码及授权由本人完成，不发给 Agent。提交时自己填写课堂组号，不用等待老师建立成员或代表名单；账号由工具读取实际登录结果。

同组可以多人各交个人作品，也可以由代表交一份共同作品，两种可以同时进行；同一账号也可以参加或代表多个组，老师在 PR 中核对。

## 2. 安装 Skill 2.1.0

按 [安装方法](INSTALL.md) 操作。Qoder 项目使用 .qoder/skills/aibt-workshop；WorkBuddy 从技能界面导入 [ZIP](../downloads/aibt-workshop.zip?raw=true)。保留 scripts/references，重新打开对话。需要能读取本机作品目录和调用 GitHub 的 Agent 环境。

## 3. 首次连接测试

```text
使用 aibt-workshop，帮我初始化课程并完成首次连接测试。
确认实际登录账号、Fork，上传生成的文字与 PNG，创建或复用草稿 PR，
读回验证并给我每一步结果。优先已有 Connector，能力不足时启用 CLI。
```

需要时本人完成浏览器授权。只缺 Fork 可先点 [创建自己的 Fork](https://github.com/f3484134/AIBT-WORKSHOP-261107/fork)。测试不扫描作品；文字、图片及草稿 PR 均验证后才算完整成功。

## 正式交作业

作品集中在独立文件夹，根部放 README.md，再选择符合自己的说法：

```text
使用 aibt-workshop，提交练习一第三组的个人作品，作品在当前选中的文件夹。
使用 aibt-workshop，代表第三组提交练习一的小组作品，作品在当前选中的文件夹。
```

也可说当前项目内可定位的文件夹名，或提供完整路径。不必自己安排 GitHub 目录。个人作品放到本组 individual/<账号>/，共同作品放 team/，互不覆盖。

练习必须是老师已开放的练习，组号范围为 1–99。首次出现的组别可直接提交，文件夹由工具安排；请如实填写，老师审核 PR 时确认。更新时说明相同练习、组号和个人/小组类型，复用该作品仍打开的 PR；合并后补交创建新版本。小组共同作品已有其他代表的未关闭 PR 时，先请老师处理。

每份个人/小组作品最多 200 文件、单个 20 MiB、总计 50 MiB，仅提交可公开内容；改名后远端旧文件保留，不自动删除。成功后留存作品和 PR 链接，老师合并后才进入 main。

[提交规则](SUBMISSION-RULES.md) · [Prompt 清单](PROMPTS.md) · [练习三材料](../lessons/lesson-03/README.md)
