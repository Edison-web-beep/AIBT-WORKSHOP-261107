# 按练习、组别与提交类型归档作品

## 目标与约束

课程有 4 个练习，至少约 5 组但数量和账号未确定。文案用简体中文，Qoder 项目安装与 WorkBuddy ZIP 使用同一份 Skill。由 yuhsiuli 创建维护 PR，老师另一个账号审阅，不自动合并。用户要求同时支持同组多人个人提交和代表提交共同作品，同一账号可以参加或代表多个组。

## 最终提交契约

- 个人：submissions/lesson-NN/group-NN/individual/<login>/，需要在该组 members 中。
- 小组共同作品：submissions/lesson-NN/group-NN/team/，需要在该组 representatives 中。
- 课程 course.json version=2 预置练习01–04、组别01–05，members/representatives 都为空数组，不擅自登记测试账号。名单可扩充、同账号可获多个组和角色权限，代表不必同时为成员。
- 练习、组别均01–99。提交类型必须明确 individual 或 team，不能猜测。缺少信息只补问缺少项，IDE已给目录不重复问路径。
- 分支 aibt/<login>/lesson-NN/group-NN/<kind>，关闭/合并后递增 -r2。标题 [练习NN][第NN组][个人/小组] <login>。
- 个人每账号每组每练习一个未关闭 PR；小组共同作品每组每练习一个未关闭 PR。不同成员可并行，个人和小组互不阻挡。创建前后复查；多人代表同时创建时保留编号较早单，只关闭本次新建的较晚重复单，保留上传分支。远端查询不是原子锁，重复仍存在或关闭无法确认时不报告成功，提示查询和协调；不关闭他人或复用的原单。
- 每份作品根部 README.md，最多200文件、单个20MiB、总计50MiB；保留相对路径和二进制，验证SHA。不删除、强推、自动合并或修改其他作品范围。
- 连接测试不依赖名单，保留 connection-tests/<login>/ 和草稿测试PR。

## 权限、检查和总览

helper 从老师 main 读取登记，检查器从可信PR base读取。验证实际作者、来源、角色、练习/组号/类型、路径、重命名、删除、README、链接、数量/大小、重复PR和并发。

course-maintenance 是老师明确的维护豁免标签；维护PR不计入作业、不阻挡正式提交，也不能复用为正式作业。

检查/总览使用可信代码、只读权限，不执行学生作品。课程测试由 tools/run-tests.mjs 只发现根 tests/ 内课程测试，不执行 submissions 下的测试。总览读取固定main SHA、完整树和所有分页PR，按练习/组别/类型/账号排列，分别显示个人和小组状态与链接；在Actions Summary发布，可本地输出Markdown，不推送main。

## 分发与验收

保留Node20+且无npm运行依赖，不要求学生本地Git。Skill版本2.0.0，ZIP完整包含scripts/references，打包可重复且提供SHA-256。安装器报告版本并拒绝覆盖；旧目录、已安装Skill和测试PR不自动迁移。Qoder/WorkBuddy UI、实际授权和课堂网络仍需现场验收。

自动测试覆盖混合角色/跨组授权、个人隔离、代表排他、二进制、重试/版本/并发、可信登记、PR检查、维护豁免、限定测试发现范围、完整分页总览、Qoder中文路径与WorkBuddy独立ZIP。正式PR合并前不宣称新工作流或正式分组上传已在老师main运行成功。
