# 老师管理与本地测试

## 课程设置

- 主仓库：`f3484134/AIBT-WORKSHOP-261107`，Public，默认分支 `main`。
- 学生使用自己的 GitHub 账号 Fork → 自己的作业分支 → 向老师 main 建 PR。
- 不需要 Organization、团队、学生名单或逐一邀请 Collaborator。没有写入权限的学生不能直接改老师 main。
- 老师检查 PR 的 Files changed，只接受该生课次目录，确认后合并。测试 PR 保留草稿即可，无须合并。
- 不要给学生老师的账号密码或共用 Token。若 Connector 使用「选定仓库」授权，新的个人 Fork 可能也需加入学生自己的授权范围。

当前没有安装 GitHub App、自订伺服器、Actions 自动合并或自动执行学生程式的需求。公开 Fork + PR 已能完成第一堂课的提交。

可选的加强设置：Settings → Branches 或 Rules → 对 `main` 要求经由 PR 才能合并。若启用 required approvals，只有老师一人时请确定老师仍能合并学生 PR，不要设置需要额外教师才能通过的规则。实际是否已启用，以 GitHub 设置页为准；本文件不表示规则已配置。

## 目录与课次

`lessons/lesson-template/` 是教材格式范本，`templates/submission/` 是学生作品说明范本，没有默认正式课程内容。正式教材可放 `lessons/lesson-01/`、`lessons/lesson-02/` 等。

学生作品由 Skill 自动放到：

```text
submissions/
  student-github-login/
    lesson-01/
      README.md
      ...作品原始文件
    lesson-02/
      ...
```

每堂课可以直接对学生说：「交第 2 课作业」，不需要您先创建每位学生的文件夹。学生可用 GitHub 账号，不收集真名或手机。

## 建议的第一轮测试

1. 在您实际要教学的 WorkBuddy 或 Qoder 中，创建一个空的本地课程项目。
2. 依 [INSTALL.md](INSTALL.md) 导入 ZIP 或安装项目 Skill。
3. 粘贴 [PROMPTS.md](PROMPTS.md) 的「老师本机试跑」Prompt。老师账号无法 Fork 自己，因此这一步验证的是老师分支的文字／图片／草稿 PR。
4. 准备第二个 GitHub 账号，或请一位学生在自己的电脑重做首次测试。这一步才涵盖 **学生账号 Fork 与跨仓库 PR**。
5. 创建小作品文件夹，放 `README.md`、一张图片与一份 PDF／PPTX，预览后提交第 1 课。
6. 同课改一个文件再提交，确认更新同一个仍打开的 PR。
7. 老师合并后再补交，确认开新的 `-r2` 分支和 PR。
8. 在教室实际网络重测一次，特别确认 `api.github.com`，不只看 GitHub 首页能否打开。

验收表：

| 阶段 | 成功证据 |
|---|---|
| Skill 能载入 | Agent 找到并读取 aibt-workshop，而非临时猜 Git 操作 |
| 身分正确 | 显示本人 GitHub login |
| 课程可读 | 读取到本课程 main |
| 学生 Fork | 学生账号下的 Fork parent 指向本课程 |
| 真实上传 | 文字与 PNG 的远端 Git blob SHA 与本地一致 |
| PR | 指向老师 main，head 是该生分支，测试为 draft |
| 提交／重交 | 第一次有 PR；重交更新同一个 open PR |
| 观摩 | 同学可从 PR 或 submissions 取得作品链接 |

## 课堂操作

开课前把 [STUDENT-START.md](STUDENT-START.md) 与 Skill ZIP 发给学生。GitHub 新账号的注册／Email 验证最好提早完成。

学生正式提交后，您可从 [PR 清单](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls) 审阅；标题 `[作业]` 是正式提交，`[连接测试]` 是草稿测试。当堂相互观摩不必等全部合并，PR 本身已公开。

不必每个学生都安装 gh。优先让已有 Connector 通过完整测试；仅对能力不足的环境启用 CLI 备用方案。不同产品的 Connector 名称相同，也可能支持不同操作。

## 本地 helper 验证

维护者可在仓库根目录执行 `node --test tests/workshop.test.mjs`。这是模拟 GitHub API 的行为测试，涵盖内容哈希、二进制、Fork 重复初始化、重试、重交、并发与路径隔离；不能代替学生电脑的真实连接测试。
