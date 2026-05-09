---
title: Mermaid 图表示例
date: 2026-05-06
summary: 展示 Astro 博客支持的 Mermaid 图表类型，包含代码和渲染效果对照
category: 教程
tags: [Mermaid, 图表, 教程]
---

## Mermaid 图表功能演示

本文展示博客支持的 Mermaid 图表类型。每个示例包含**源码**和**渲染效果**对照。

---

### 流程图 (Flowchart)

**源码**：

````
```mermaid
graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[显示仪表盘]
    B -->|否| D[跳转登录页]
    C --> E[加载数据]
    E --> F{数据有效?}
    F -->|是| G[渲染图表]
    F -->|否| H[显示错误]
    G --> I[完成]
    H --> I
```
````

**渲染效果**：

```mermaid
graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[显示仪表盘]
    B -->|否| D[跳转登录页]
    C --> E[加载数据]
    E --> F{数据有效?}
    F -->|是| G[渲染图表]
    F -->|否| H[显示错误]
    G --> I[完成]
    H --> I
```

---

### 时序图 (Sequence Diagram)

**源码**：

````
```mermaid
sequenceDiagram
    participant U as 用户
    participant B as 浏览器
    participant S as 服务器

    U->>B: 访问页面
    B->>S: HTTP 请求
    S-->>B: 返回 HTML
    B->>U: 渲染页面
```
````

**渲染效果**：

```mermaid
sequenceDiagram
    participant U as 用户
    participant B as 浏览器
    participant S as 服务器

    U->>B: 访问页面
    B->>S: HTTP 请求
    S-->>B: 返回 HTML
    B->>U: 渲染页面
```

---

### 类图 (Class Diagram)

**源码**：

````
```mermaid
classDiagram
    class BlogPost {
        +String title
        +Date date
        +String content
        +render() String
    }

    class Renderer {
        -String code
        +render() void
        +retry() void
    }

    BlogPost --> Renderer : uses
```
````

**渲染效果**：

```mermaid
classDiagram
    class BlogPost {
        +String title
        +Date date
        +String content
        +render() String
    }

    class Renderer {
        -String code
        +render() void
        +retry() void
    }

    BlogPost --> Renderer : uses
```

---

### 状态图 (State Diagram)

**源码**：

````
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: 检测图表
    Loading --> Success: 渲染成功
    Loading --> Error: 渲染失败
    Error --> Loading: 重试
    Success --> [*]: 完成
```
````

**渲染效果**：

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: 检测图表
    Loading --> Success: 渲染成功
    Loading --> Error: 渲染失败
    Error --> Loading: 重试
    Success --> [*]: 完成
```

---

### 甘特图 (Gantt Chart)

**源码**：

````
```mermaid
gantt
    title 开发计划
    dateFormat  YYYY-MM-DD

    section 基础
    项目搭建     :done, 2026-05-01, 3d
    核心功能     :active, 2026-05-04, 5d

    section 增强
    Mermaid 支持 :2026-05-09, 3d
    性能优化     :2026-05-12, 2d
```
````

**渲染效果**：

```mermaid
gantt
    title 开发计划
    dateFormat  YYYY-MM-DD

    section 基础
    项目搭建     :done, 2026-05-01, 3d
    核心功能     :active, 2026-05-04, 5d

    section 增强
    Mermaid 支持 :2026-05-09, 3d
    性能优化     :2026-05-12, 2d
```

---

### ER 图 (Entity Relationship)

**源码**：

````
```mermaid
erDiagram
    POST ||--o{ TAG : contains
    POST {
        string id PK
        string title
        text content
    }

    TAG {
        string name PK
    }
```
````

**渲染效果**：

```mermaid
erDiagram
    POST ||--o{ TAG : contains
    POST {
        string id PK
        string title
        text content
    }

    TAG {
        string name PK
    }
```

---

### 饼图 (Pie Chart)

**源码**：

````
```mermaid
pie title 文章分类占比
    "教程" : 40
    "分享" : 25
    "随笔" : 20
    "项目" : 15
```
````

**渲染效果**：

```mermaid
pie title 文章分类占比
    "教程" : 40
    "分享" : 25
    "随笔" : 20
    "项目" : 15
```

---

### 思维导图 (Mindmap)

**源码**：

````
```mermaid
mindmap
  root((博客))
    功能
      文章管理
      主题切换
      评论系统
    技术
      Astro
      React
      Tailwind
    内容
      Mermaid
      代码高亮
      数学公式
```
````

**渲染效果**：

```mermaid
mindmap
  root((博客))
    功能
      文章管理
      主题切换
      评论系统
    技术
      Astro
      React
      Tailwind
    内容
      Mermaid
      代码高亮
      数学公式
```

---

### 用户旅程 (User Journey)

**源码**：

````
```mermaid
journey
    title 用户访问路径
    section 发现
      搜索引擎: 5: 用户
      社交媒体: 3: 访客
    section 阅读
      浏览列表: 4: 用户
      筛选标签: 3: 访客
    section 交互
      切换主题: 5: 用户
      复制代码: 4: 开发者
```
````

**渲染效果**：

```mermaid
journey
    title 用户访问路径
    section 发现
      搜索引擎: 5: 用户
      社交媒体: 3: 访客
    section 阅读
      浏览列表: 4: 用户
      筛选标签: 3: 访客
    section 交互
      切换主题: 5: 用户
      复制代码: 4: 开发者
```

---

## 使用方法

在 Markdown 中创建 Mermaid 图表：

````
```mermaid
graph TD
    A[开始] --> B[结束]
```
````

图表会在页面加载时自动渲染，支持：

- **主题适配**：自动跟随博客明暗主题
- **复制源码**：悬停右上角点击复制
- **缩放图表**：右下角 +/- 按钮缩放
- **错误处理**：渲染失败时显示错误信息和重试按钮

更多语法参考 [Mermaid 官方文档](https://mermaid.js.org/intro/)
