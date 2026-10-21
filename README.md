# DURAS · Coffee & All Things

台灣獨樂思與中國大陸龍津壕的雙地區咖啡網站。

- [品牌入口](https://xieyaozhong.github.io/DURAS/)
- [台灣網站](https://xieyaozhong.github.io/DURAS/tw/)
- [大陸網站](https://xieyaozhong.github.io/DURAS/cn/)

## 網站內容

每站包含首頁、精品咖啡、品牌與服務、咖啡日常、社群匯聚、聯絡及隱私說明。提供產地／風味／關鍵字篩選、商品規格、詢價清單與文字整理。手機與桌面皆可使用。

社群入口預留台灣 11 個、大陸 12 個，未提供帳號的入口標示即將開放。沒有假帳號或自動同步貼文。詢價內容由訪客確認後自行聯繫，不自動寄送；付款素材不等同線上收款或訂單系統。

## 維護

網站是純 HTML、CSS 與 JavaScript，無需安裝套件。

| 檔案 | 用途 |
|---|---|
| `index.html` | 地區入口 |
| `tw/`、`cn/` | 繁體／簡體網站 |
| 各站 `site-config.js` | 公司、聯絡方式、社群連結、跨站入口 |
| 各站 `catalog.js` | 豆單、規格、參考價格 |
| 各站 `app.js` | 頁面範本與互動 |
| 各站 `site.css`、`premium.css` | 基礎與第二版視覺樣式 |
| `scripts/prerender.mjs` | 更新 HTML 的靜態內容，方便搜尋引擎讀取 |

在 `platforms` 的對應項目填入官方 HTTPS `url`，或放入 `assets/` 圖片並填寫 `qr`。未填入的項目保持停用。跨平台內容可手動加入 `socialPosts`；自動同步需另行整合官方 API，公開檔案不可存放密碼或 Token。

修改資料或頁面範本後，在儲存庫根目錄執行：

```sh
node scripts/prerender.mjs
```

公司名稱、電話、地址或網域變更時，還應同步更新 HTML head 中的結構化資料、canonical、hreflang，以及 sitemap。兩站內容獨立維護；共同互動／樣式修改時請同步兩站。

## 預覽與部署

```sh
python -m http.server 8080
```

開啟 http://localhost:8080/。GitHub Pages 從 `main` 分支根目錄發布，推送更新後可在 Actions 檢查 `pages build and deployment`。

## 資料與影像

商品與聯絡資訊依提供的品牌素材整理。價格為參考，幣別依區域標示，供貨、運費、代烘計價及實際報價由品牌確認。公司地址沒有被誤標為門市。

咖啡情境照片與商品標籤示意不宣稱為實物拍攝。影像來源見 `image-sources.json`。既有 LICENSE 保留；品牌標誌、肖像、原始商業素材及第三方攝影依各自權利與授權使用。
