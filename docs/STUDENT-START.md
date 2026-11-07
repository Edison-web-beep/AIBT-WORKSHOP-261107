# 学生三步开始

## 1. 注册自己的账号

到 https://github.com/signup 注册 GitHub 个人账号并验证邮箱。密码、验证码、授权由本人完成，不发给 Agent 或老师。小组共同制作作品，每组指定一名提交代表，并请老师将代表 GitHub 账号登记到 course.json。

## 2. 安装 Skill 2.0.0

按 [安装方法](INSTALL.md) 操作。Qoder IDE 安装到课程项目 `.qoder/skills/aibt-workshop/`；WorkBuddy 从技能界面导入 [aibt-workshop.zip](../downloads/aibt-workshop.zip?raw=true)。保留 scripts 与 references，重新打开对话加载。

这需要能读取作品文件夹、使用 Skills 和 GitHub 工具的 Agent 环境，不是普通聊天窗口上传附件。

## 3. 完成首次连接测试

```text
使用 aibt-workshop，帮我初始化 AIBT-WORKSHOP-261107 课程并完成首次连接测试。
请确认实际登录账号，创建或确认自己的 Fork，实际上传生成的文字与 PNG，
创建或复用草稿测试 PR，读回文件和 PR 验证，给我每一步结果及链接。
优先使用当前 GitHub Connector，能力不足时启用 CLI 备用方案。
```

需要时本人完成浏览器授权。若 Connector 只缺 Fork，先点 [创建自己的 Fork](https://github.com/f3484134/AIBT-WORKSHOP-261107/fork)，再回来继续。测试无需登记小组，也不会扫描作品；文字、图片及草稿 PR 都通过才算完整成功。

## 正式交作业

把本组本练习要公开的文件放入一个独立文件夹，根部包含 README.md，然后说：

```text
使用 aibt-workshop，提交练习一第三组，作品在当前选中的文件夹。
```

没有选中目录时，也可以说「作品在当前项目的 lesson-01-group-03 文件夹」，或提供完整路径。Skill 会自动归档到 submissions/lesson-01/group-03/，无需自己创建 GitHub 目录或记 Git 指令。

未登记代表时先请老师填写名单；账号与代表不符时由代表提交。改进后说「更新练习一第三组，作品在……」，会更新仍打开的 PR。老师合并后再补交会创建新版本 PR。

提交成功应收到作品和 PR 链接，以及远端文件验证结果。老师未合并时从 [PR 清单](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls)查看，合并后从 [submissions](../submissions/)查看。

每组本练习最多 200 文件、单个 20 MiB、总计 50 MiB；仅提交可公开内容。改名后远端旧文件保留，不自动删除。完整规则见 [统一提交规则](SUBMISSION-RULES.md)，更多情境见 [Prompt 清单](PROMPTS.md)。

## 练习三材料

[练习三材料页](../lessons/lesson-03/README.md)提供 Word 原文件和 Markdown 文字版，按课堂要求完成后仍按本组身份提交练习三。
