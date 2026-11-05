# 验证记录

## 已完成

- 课程 Repo 确认为公开，默认分支为 `main`。
- 已发布的文件包含 Skill、helper、学生安装指引、完整 Prompt 清单、老师测试流程、教材与作品目录范本、可下载 ZIP。
- Skill Creator 的 `quick_validate.py` 格式验证通过。
- Skill ZIP 完整性检查通过，下载目录附 SHA-256。
- 项目安装器已在独立的本地测试目录试装 Qoder 路径成功；这只验证文件安装，未代表 Qoder UI 已载入。
- `node --test tests/workshop.test.mjs`：**11 项全部通过**。涵盖文件筛选、疑似密钥阻挡、Unicode 路径、二进制保真、Fork 初始化、重试、重交、范围隔离、并发、老师模式、错误哈希停止及测试 PNG 的格式／校验码。
- 使用当前已登录的 GitHub Connector，实际创建老师测试分支、上传文字与 PNG、创建 [草稿测试 PR #1](https://github.com/f3484134/AIBT-WORKSHOP-261107/pull/1)，读取文字与 PNG（base64）确认内容一致，并确认 PR 指向 `main` 且为 draft。

## 尚待在上课环境验证

- WorkBuddy、Qoder 或其他学生实际使用的版本能否识别／载入 Skill。
- 各产品 Connector 是否提供 Fork、分支、该作品格式的上传与 PR 工具。
- 学生账号的 Fork 与跨仓库 PR；老师无法 Fork 自己，因此老师分支测试不涵盖这一段。
- CLI helper 的实际 gh 登录及真实 GitHub API 连接；本地行为测试使用模拟 API，真实老师上传测试走 Connector。
- 教室网络下的 GitHub 注册、授权及 `api.github.com` 连接。

请依 [TEACHER.md](TEACHER.md) 完成一轮真实学生角色测试，再将相同步骤发给全班。首次测试 Prompt 会生成小型测试资料，不需先准备正式作业。
