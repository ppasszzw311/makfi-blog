---
title: "React 面試題"
slug: react-interview-questions
index: 0
description: "整理 React 基礎、Hooks 與進階面試常見問題的參考資料與筆記"
category: "求職"
tags: [React, 前端面試]
published: 2024-01-05 23:47:20
draft: false
---

## React 基礎

- [什麼是純函式 (pure function)？為什麼 React 的函式元件需要是純函式？](https://www.explainthis.io/zh-hant/swe/react-pure-function)

  純函式代表有以下兩種特點－1. 只要有相同的輸入就會有相同的輸出; 她不會改變函式以外的存在，也就是不會有副作用(side effect)

  確保在渲染的時候可以有相同的產出，使用strict mode可以更快地避免這樣問題的產生

- [什麼是 JSX？為什麼要用 JSX？](https://www.explainthis.io/zh-hant/swe/what-is-jsx)

- [請解釋 React 生命週期？](https://www.explainthis.io/zh-hant/swe/react-lifecycle)

- [什麼是 Virtual DOM？](https://www.explainthis.io/zh-hant/swe/react-virtual-dom)

## React Hooks

- [React Hooks 是什麼？](https://www.explainthis.io/zh-hant/swe/what-is-react-hook)
- [為什麼只能在最頂端層呼叫 Hook？從 useState 實作原理來回答](https://www.explainthis.io/zh-hant/swe/why-call-react-hook-top-level)
- [請解釋 useEffect？與 useLayoutEffect 的區別？](https://www.explainthis.io/zh-hant/swe/use-effect-vs-use-layout-effect)

## React 進階

- [為什麼 React 渲染列表時需要加上 key？](https://www.explainthis.io/zh-hant/swe/react-why-key)
- [為什麼更新 React 中的 state 要用 immutable 的寫法？什麼是 immutable？該如何寫才會是 immutable？](https://www.explainthis.io/zh-hant/swe/react-why-immutable)

## 概念篇

### 元件

函式元件：function Component

純函式
