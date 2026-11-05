# 选择 GitHub 连接方式

## 连接器优先，但要查实际工具

需要以下能力，不可仅凭「已连接 GitHub」判断：

| 操作 | 常见工具名或等效能力 |
|---|---|
| 确认本人身分、读课程 | get_me / get_user_login、get_repository / fetch |
| 创建或确认 Fork | fork_repository，或学生在 GitHub 网页完成一次 Fork |
| 读分支、创建分支 | get_branch / list_branches、create_branch |
| 上传与更新文件 | push_files / create_or_update_file（确认格式）；或 Git blob/tree/commit/ref API |
| PR 与重试 | list_pull_requests、create_pull_request、get_pull_request |
| 验证内容 | get_file_contents 或 Git tree/blob SHA |

工具名称、参数与授权以当前宿主 schema 为准，不猜测不存在的工具。GitHub 官方 MCP 的文字工具 content 为原始文字；不要把图片的 base64 当文字文件提交。若有 create_blob(encoding=base64) 搭配 tree/commit/ref，可无损上传二进制。若只有文字工具，文字作品可走 connector，图片、PDF、演示文稿等改走 CLI；不宣称二进制测试通过。

缺 Fork 工具但其余能力齐全时，让学生先在 https://github.com/f3484134/AIBT-WORKSHOP-261107/fork 按 Create fork。这只做一次；然后继续同一个 Skill。不要为缺一个工具强迫安装全部工具。

## 连接器执行流程

1. 读实际登录账号和课程资料。若已有 `<login>/AIBT-WORKSHOP-261107`，确认它的 parent 是课程仓库；同名不相关 repo 不覆盖。
2. 初始化／试交／正式提交时才创建 Fork。GET 404 与权限不足要区分；Fork 创建后最多检查 6 次，每次约 2 秒，逾时留待稍后重试。
3. 选择分支规则与 helper 相同。先查对应 PR。打开的 PR 重用；关闭／已合并用下一个 `-rN`。未开 PR 的已有分支先检查差异只在本人课次内，不冒然覆盖。
4. 新分支从老师 main 创建。若 fork API 不能使用最新 upstream SHA，不 reset Fork；提示在 GitHub Sync fork 更新，遇冲突停止处理。
5. 用来源文件扫描结果上传，只改固定目录。Git tree 的 base_tree 必须是目标分支当前 tree，commit parent 必须是当前 head。更新 ref 前再读 head，拒绝并发覆盖，不 force。
6. 测试内容：`connection-tests/<login>/connection.md`（不含本机绝对路径、Email、电脑信息）与 `pixel.png`。分支 `aibt/<login>/connection-test`，PR 标题 `[连接测试] <login> / connection-test`，draft=true。没能力创建草稿就使用 CLI，不能把普通 PR 说成草稿。
7. 正式提交 PR 标题 `[作业] <login> / lesson-NN`，base=main，head=`<login>:<branch>`，draft=false。内容简述作品与课次，不贴本机路径或环境资料。已存在的 PR 不重复开。
8. 验证文件内容／SHA 及 PR metadata。报告验证涵盖文字、图片、Fork、PR 哪些阶段。测试 PR 保留为草稿，不自动合并或删除。

## CLI 备用

连接器能力不足或无法读取本地文件时，用 `scripts/workshop.mjs`；只需 Node.js 20+、GitHub CLI，不需 Git。先检查是否已安装，只有缺少时才提供官方安装入口：

- GitHub CLI：https://cli.github.com/
- Node.js LTS：https://nodejs.org/
- Windows 可使用官方 winget 软件包 `GitHub.cli` 和 `OpenJS.NodeJS.LTS`，由 IDE 协助安装；若宿主不允许执行安装，给学生一个明确点选步骤。

登录由学生完成：`gh auth login --hostname github.com --web --git-protocol https`。在浏览器完成 device flow。不要请学生粘贴 Token、密码、device code 到公开 repo。`gh auth status` 只看是否登录，不印 Token。Connector 的登录与 gh 的登录彼此独立。

Helper 通过 `gh api` 调用 GitHub API，因此能保留文字与二进制文件。正式提交不读用户的 Git 暂存区、不切换工作目录分支、不改 remote。故已有项目是否用 Git 管理不影响上传。

## 有限重试

网络中断可能已成功写入；先读 Fork、分支、文件与 PR 再重试相同操作。不要无限回圈。401 登录、403 检查权限／频率、新 Fork 不在 connector 授权范围、404 确认名称与授权、422 检查已有 Fork／分支／PR 或上游 commit。中国境内可读 github.com 不保证 api.github.com 可连，首次测试需在实际上课的网络执行。不要绕过凭证错误或关闭安全检查。
