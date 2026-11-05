# 老師管理與本地測試

## 課程設定

- 主倉庫：`f3484134/AIBT-WORKSHOP-261107`，Public，預設分支 `main`。
- 學生使用自己的 GitHub 帳號 Fork → 自己的作業分支 → 向老師 main 建 PR。
- 不需要 Organization、團隊、學生名單或逐一邀請 Collaborator。沒有寫入權限的學生不能直接改老師 main。
- 老師檢查 PR 的 Files changed，只接受該生課次目錄，確認後合併。測試 PR 保留草稿即可，無須合併。
- 不要給學生老師的帳號密碼或共用 Token。若 Connector 使用「選定倉庫」授權，新的個人 Fork 可能也需加入學生自己的授權範圍。

目前沒有安裝 GitHub App、自訂伺服器、Actions 自動合併或自動執行學生程式的需求。公開 Fork + PR 已能完成第一堂課的交件。

可選的加強設定：Settings → Branches 或 Rules → 對 `main` 要求經由 PR 才能合併。若啟用 required approvals，只有老師一人時請確定老師仍能合併學生 PR，不要設定需要額外教師才能通過的規則。實際是否已啟用，以 GitHub 設定頁為準；本文件不表示規則已配置。

## 目錄與課次

`lessons/lesson-template/` 是教材格式範本，`templates/submission/` 是學生作品說明範本，沒有預設正式課程內容。正式教材可放 `lessons/lesson-01/`、`lessons/lesson-02/` 等。

學生作品由 Skill 自動放到：

```text
submissions/
  student-github-login/
    lesson-01/
      README.md
      ...作品原始檔案
    lesson-02/
      ...
```

每堂課可以直接對學生說：「交第 2 課作業」，不需要您先建立每位學生的資料夾。學生可用 GitHub 帳號，不收集真名或手機。

## 建議的第一輪測試

1. 在您實際要教學的 WorkBuddy 或 Qoder 中，建立一個空的本地課程專案。
2. 依 [INSTALL.md](INSTALL.md) 匯入 ZIP 或安裝專案 Skill。
3. 貼 [PROMPTS.md](PROMPTS.md) 的「老師本機試跑」Prompt。老師帳號無法 Fork 自己，因此這一步驗證的是老師分支的文字／圖片／草稿 PR。
4. 準備第二個 GitHub 帳號，或請一位學生在自己的電腦重做首次測試。這一步才涵蓋 **學生帳號 Fork 與跨倉庫 PR**。
5. 建立小作品資料夾，放 `README.md`、一張圖片與一份 PDF／PPTX，預覽後提交第 1 課。
6. 同課改一個檔再提交，確認更新同一個仍開啟的 PR。
7. 老師合併後再補交，確認開新的 `-r2` 分支和 PR。
8. 在教室實際網路重測一次，特別確認 `api.github.com`，不只看 GitHub 首頁能否開啟。

驗收表：

| 階段 | 成功證據 |
|---|---|
| Skill 能載入 | Agent 找到並讀取 aibt-workshop，而非臨時猜 Git 操作 |
| 身分正確 | 顯示本人 GitHub login |
| 課程可讀 | 讀取到本課程 main |
| 學生 Fork | 學生帳號下的 Fork parent 指向本課程 |
| 真實上傳 | 文字與 PNG 的遠端 Git blob SHA 與本地一致 |
| PR | 指向老師 main，head 是該生分支，測試為 draft |
| 交件／重交 | 第一次有 PR；重交更新同一個 open PR |
| 觀摩 | 同學可從 PR 或 submissions 取得作品連結 |

## 課堂操作

開課前把 [STUDENT-START.md](STUDENT-START.md) 與 Skill ZIP 發給學生。GitHub 新帳號的註冊／Email 驗證最好提早完成。

學生正式交件後，您可從 [PR 清單](https://github.com/f3484134/AIBT-WORKSHOP-261107/pulls) 檢閱；標題 `[作業]` 是正式交件，`[連線測試]` 是草稿測試。當堂相互觀摩不必等全部合併，PR 本身已公開。

不必每個學生都安裝 gh。優先讓既有 Connector 通過完整測試；僅對能力不足的環境啟用 CLI 備援。不同產品的 Connector 名稱相同，也可能支援不同操作。

## 本地 helper 驗證

維護者可在倉庫根目錄執行 `node --test tests/workshop.test.mjs`。這是模擬 GitHub API 的行為測試，涵蓋內容雜湊、二進位、Fork 重複初始化、重試、重交、併發與路徑隔離；不能代替學生電腦的真實連線測試。
