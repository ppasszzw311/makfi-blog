---
title: "AOD 網路商城網站建置"
slug: aod-ecommerce-site
index: 0
description: "整理商品詳細頁與購物車頁面的頁面架構、欄位定義與對應 API"
category: "作品"
tags: [頁面, 系統架構]
published: 2024-01-04 14:14:08
draft: false
---

## 1商品詳細頁

* Temperate: https://bazaar.ui-lib.com/products/spec-2015

### 網站架構

* Temperate: https://bazaar.ui-lib.com/cart

* 1-1 概略 (api productOverView/:productId)

  * 1-1-1商品照片(images)
  * 1-1-2商品內容
    1. 標題(title)
    2. 評分(rating)
    3. 品牌(brand)
    4. 訂閱週期(subscription cycle)
    5. 支援作業系統(support-operating-system)
    6. 版本資訊(version)
    7. 單價(price)
    8. (元件1-3)加入購物車

* 1-2 商品詳細

  * 1-2-1軟體介紹: 純文字處理
  * 1-2-2評論: 評論內容(api: productCommon/:productId)

    * 使用者名稱(use-name)
    * 使用者頭像(user-avator)
    * 使用者評分(user-rating)
    * 使用者留言(user-common)
    * 評論時間(common-time)

  * 1-2-3系統需求(api: productRequirement/:productId)

    * 最低需求(minimum-requirements)
      * CPU(cpu)
      * 記憶體(memory)
      * 硬碟(hard-drive)
      * GPU(gpu)
      * 作業系統(operating-system)
      * 系統架構(system-architecture)
    * 建議需求(suggestion-requirements)
      * CPU(cpu)
      * 記憶體(memory)
      * 硬碟(hard-drive)
      * GPU(gpu)
      * 作業系統(operating-system)
      * 系統架構(system-architecture)

* 1-3 加入購物車: 點擊可選擇數量+按鈕新增至購物車

## 2購物車頁面(order)

* 2-1購物車清單(orderList) in redux cart.list
  * 2-1-1購物車商品
    * productId(disabled)
    * 商品名稱(name)
    * 商品照片(image)
    * 商品單價(price)
    * 商品數量(count)
    * 商品小計
    * 增加/減少數量
    * 刪除該品項
* 2-2訂單摘要
  * 小計(Subtotal)
  * 運費(Shipping)
  * 稅金(Tax)
  * 折扣(Discount)
  * 合計(Total)
  * 結帳(checkout)
