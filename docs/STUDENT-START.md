# 学生三步开始

## 1. 注册账号

到 https://github.com/signup 注册个人账号并验证 Email。记住自己的账号名称。密码、验证码、邮件验证与登录授权请自己完成，不要发给 Agent 或老师。

## 2. 安装一次 Skill

下载 [aibt-workshop.zip](../downloads/aibt-workshop.zip?raw=true)，依 [安装方法](INSTALL.md) 导入自己的工具。WorkBuddy 可从「技能」上传 ZIP；Qoder 可请 Agent 帮忙放进项目。

这不是浏览器版 ChatGPT 上传附件；要在能读取作品文件夹、使用 Skills 与 GitHub 工具的 Agent 环境操作。

## 3. 第一次就测到能提交

在 Agent 中粘贴：

```text
使用 aibt-workshop，帮我初始化 AIBT-WORKSHOP-261107 课程并完成首次连接测试。
优先使用已连接的 GitHub；能力不足时引导我完成最少的必要设置。
请确认实际登录账号，创建或确认我的 Fork，实际上传测试文字与图片，
创建草稿测试 PR，读取并验证后给我 PR 链接及每一步的通过状态。
```

首次可能出现两种本人操作：

- 连接器／GitHub CLI 打开 GitHub 授权页，请自己完成。
- 连接器没有 Fork 工具时，点 [创建自己的 Fork](https://github.com/f3484134/AIBT-WORKSHOP-261107/fork)，按 Create fork 后回来告诉 Agent「Fork 已完成，继续测试」。

收到 **草稿测试 PR 链接**，而且文字、图片、PR 都验证通过，才算完整成功。只显示「可连 GitHub」仍未完成测试。测试文件是 Agent 生成的小文件，不会扫描或上传你的作品。

## 取得练习三材料

前往 [练习三：访谈笔记分析](../lessons/lesson-03/README.md)，下载 Word 原文件，或复制页面上的 Prompt 让 Agent 准备材料。页面也提供方便 Agent 读取的 Markdown 文字版。

## 正式交作业

把这次要公开的作品放在一个独立文件夹，然后说：

```text
提交第 2 课作业，作品在这个文件夹：〈选取或粘贴作品文件夹路径〉。
```

不用自己建学生目录、不用每次 Fork、不用记 Git 指令。想改进后重交，就说「更新第 2 课作业，作品在……」。

提交完成后留存 PR 链接。老师还没合并时，在 [Pull requests](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls) 看作品；合并后在 [submissions](../submissions/) 看。

一次最多 200 个文件、单个文件 20 MiB、合计 50 MiB。大型音视频文件可改放自己的公开分享链接，并写入作品 README。文件重新命名后旧文件会保留；需要移除时要另行指定。

更多情境见 [完整 Prompt 清单](PROMPTS.md)。
