# 驗證紀錄

## 已完成

- 課程 Repo 確認為公開，預設分支為 `main`。
- 已發布的檔案包含 Skill、helper、學生安裝指引、完整 Prompt 清單、老師測試流程、教材與作品目錄範本、可下載 ZIP。
- Skill Creator 的 `quick_validate.py` 格式驗證通過。
- Skill ZIP 完整性檢查通過，下載目錄附 SHA-256。
- 專案安裝器已在獨立的本地測試目錄試裝 Qoder 路徑成功；這只驗證檔案安裝，未代表 Qoder UI 已載入。
- `node --test tests/workshop.test.mjs`：**11 項全部通過**。涵蓋檔案篩選、疑似金鑰阻擋、Unicode 路徑、二進位保真、Fork 初始化、重試、重交、範圍隔離、併發、老師模式、錯誤雜湊停止及測試 PNG 的格式／校驗碼。
- 使用目前已登入的 GitHub Connector，實際建立老師測試分支、上傳文字與 PNG、建立 [草稿測試 PR #1](https://github.com/f3484134/AIBT-WORKSHOP-261107/pull/1)，讀回文字與 PNG（base64）確認內容一致，並確認 PR 指向 `main` 且為 draft。

## 尚待在上課環境驗證

- WorkBuddy、Qoder 或其他學生實際使用的版本能否識別／載入 Skill。
- 各產品 Connector 是否提供 Fork、分支、該作品格式的上傳與 PR 工具。
- 學生帳號的 Fork 與跨倉庫 PR；老師無法 Fork 自己，因此老師分支測試不涵蓋這一段。
- CLI helper 的實際 gh 登入及真實 GitHub API 連線；本地行為測試使用模擬 API，真實老師上傳測試走 Connector。
- 教室網路下的 GitHub 註冊、授權及 `api.github.com` 連線。

請依 [TEACHER.md](TEACHER.md) 完成一輪真實學生角色測試，再將相同步驟發給全班。首次測試 Prompt 會生成小型測試資料，不需先準備正式作業。
