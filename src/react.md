# 一周-每天1 小时,学习实现一个简单的mini-React 
## 关于 从0到1实现一个 mini-React 过程
  ### 起因 --- 为什么会有这篇文章还得从前几天加入了一个十分"内卷"的群聊开始
   [崔学社 mini-React](https://learn.cuixueshe.com/p/t_pc/course_pc_detail/camp_pro/course_2aWyh6wtEv0gud4X9CjSKHgSQwz).偶然看到朋友圈一叫mini-React 的游戏副本课程,对这觉得这个课程听起来好像挺有意思的,大概看了一下课程内容,觉得很有意思,就果断加入了.然后就开始了一周的"内卷"生活.


### 过程 --- 下面我分享一下这一周"内卷"具体过程和内容, 课程目标是通过每天花1 小时左右,对照 React API 从 0-1,实现基本的功能. 根据我个人的划分难易程度,我会分成 --- 3篇文章来写;有兴趣的朋友可以访问我的github [https://github.com/whoelse666/mini-React](https://github.com/whoelse666/mini-React)
#### ----------  day01 ---------- 
#### 当日目标:实现静态js dom 挂载渲染.
1.  第一天就很基础的 js dom 操作,以及安装 vite 环境实用 jsx 不多讲,直接上代码,需要注意的是 main.js里面 script  type='module'
代码如下:
```js
/* 
 main.js
*/

function createElement(type, props, children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        if (typeof child === 'string') {
          return createTextNode(child);
        } else {
          return child;
        }
      })
    }
  };
}

function createTextNode(nodeValue) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue
      // children: []
    }
  };
}

function render(el, container) {
  const dom = el.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(el.type);
  Object.keys(el.props).forEach(key => {
    if (key !== 'children') {
      dom[key] = el.props[key];
    }
  });
  const children = el.props.children;
  children && children.forEach(child => render(child, dom));
  container.appendChild(dom);
}

const App = createElement('div', { id: 'app' }, ['hello ', 'world']);
const App1 = createTextNode('world');
const root = document.querySelector('#root');
render(App, root);


```


```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>day01</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
```



2.   安装vite 实用 jsx 通过以下命令创建/运行

```js
npm init vite@latest
yarn create vite  或者  pnpm create vite

cd  project_name
pnpm  i
pnpm dev 
```
按照以下目录创建对应文件
App.jsx
main.jsx
core/React.js
core/ReactDom.js

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/761dcbccec7145ef9df4756e3eb8a17e~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=514&h=772&s=74556&e=png&a=1&b=21222b)


#### ----------  day02 ---------- 
#### 当日目标: 实现任务调度器 和 fiber 架构.
 利用了 requestIdleCallback  API 实现任务调度,这个函数主要作用:函数将在浏览器空闲时期被调用 " ,防止 dom 很大情况下造成阻塞卡顿;对requestIdleCallback 不清楚的可以 到 查看文档:[ requestIdleCallback ](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)".  fiber这里依旧是模仿 React 使用链表结构将 vDom 进行处理;

 代码如下:(  index.html 和上面相同)
 
```js
/* 
React.js
*/

/* 
vdom 结构
vdom: {
  type,
  props:{
  ...more,
  children:[]
  }
}
*/

function createElement(type, props, children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        if (typeof child === "string") {
          return createTextNode(child)
        } else {
          return child
        }
      })
    }
  }
}

function createTextNode(nodeValue) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue
      // children: []
    }
  }
}

 
requestIdleCallback(workLoop)

let nextWorkOfUnit = null

function workLoop(deadline) {
  let shouldYield = false
  const remainingTime = deadline.timeRemaining()
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performUnitOfWork(nextWorkOfUnit)
    shouldYield = remainingTime < 1
  }


  requestIdleCallback(workLoop)
}

//  vDom 转换成 真实的Dom node 节点
function createDom(type) {
  return type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type)
}

// 设置 dom props 属性
function setDomProps(dom, props) {
  Object.keys(props).forEach(key => {
    if (key !== "children") {
      dom[key] = props[key]
    }
  })
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    //   todo 1. 创建 dom
    const dom = createDom(fiber.type)
    //  todo 2.处理 props
    setDomProps(dom, fiber.props)
    fiber.dom = dom
    fiber.parent.dom.append(dom)
  }

  // todo 3. 转换成链表
  const children = fiber.props.children
  let prevChild = null
  children &&
    children.forEach((child, index) => {
      if (index === 0) {
        // #root 下 第一个dom 是有 dom =( id='app'的 div) 的 dom特殊处理
        // 父子关系互相连接 parent ,child
        fiber.child = child
        child.parent = fiber
      } else {
        // 同一个 fiber 下的 child 满足都在同一级,所以用 sibling链接
        prevChild.sibling = child
        child.parent = prevChild.parent
      }
      prevChild = child
    })
  // todo 4. 处理当前任务后，返回下一个任务
  if (fiber.child) {
    return fiber.child
  }
  if (fiber.sibling) {
    return fiber.sibling
  }
  return fiber.parent?.sibling
}

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el]
    }
  }
}
export default {
  render,
  createElement
}


```


```js
 // ReactDom.js
import React from "./React.js";
const ReactDom = {
  createRoot(container) {
    return {
      render(rootDom) {
        React.render(rootDom, container);
      }
    };
  }
};

export default ReactDom;

```


```js

//App.jsx

import React from './core/React.js';
const App = React.createElement("div", { id: "app" }, ["hello ", "world"]);

export default App;

```

```js

//main.jsx

import React from "./core/React.js";
import ReactDOM from "./core/ReactDom.js";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(App);

```



#### ----------  day03 ---------- 
#### 当日目标: 实现 function component 和 dom 挂载/更新的合并提交
在之前的代码中,频繁挂载 dom,引起页面的重绘,回流等问题,性能浪费,在今天
内容中主要是讲 Dom 结构整理完成后,统一一次性挂载到页面根节点;
然后是实现了对  
```js
function Counter(){return <div>666</div>}
```
这样的function 组件渲染的逻辑处理
 代码如下: 
 
```js
/* 
React.js
*/

/* 
vdom 结构
vdom: {
  type,
  props:{
  ...more,
  children:[]
  }
}
*/
function createTextNode(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode =
          typeof child === "string" || typeof child === "number";
        return isTextNode ? createTextNode(child) : child;
      }),
    },
  };
}

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };

  root = nextWorkOfUnit;
}

let root = null;
let nextWorkOfUnit = null;
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && root) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function commitRoot() {
  commitWork(root.child);
  root = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.dom) {
    fiberParent.dom.append(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom, props) {
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      dom[key] = props[key];
    }
  });
}

function initChildren(fiber, children) {
  let prevChild = null;
  children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      props: child.props,
      child: null,
      parent: fiber,
      sibling: null,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];

  initChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));

    updateProps(dom, fiber.props);
  }

  const children = fiber.props.children;
  initChildren(fiber, children);
}

function performWorkOfUnit(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if(isFunctionComponent){
    updateFunctionComponent(fiber)
  }else{
    updateHostComponent(fiber)
  }

  // 4. 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
};

export default React;


```


 


```js

//App.jsx
import React from "./core/React.js";
function Counter({ num }) {
  return <div>count: {num}</div>;
}

function App() {
  return (
    <div>
      hi-mini-react
      <Counter num={10}></Counter>
      <Counter num={20}></Counter>
    </div>
  );
}


export default App;


```

```js

//main.jsx

import React from "./core/React.js";
import ReactDOM from "./core/ReactDom.js";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(App);

```

### 告一段落 
 以上内容是我个人觉得,相对比较简单的部分,使用过 React 开发的同学应该问题都不大.,后续我会继续完成后面部分的内容.觉得有用希望可以支持关注,当然也希望各位同学和大佬,可以多多提建议.
 
 ### Tips 刚开始写这类文章,经验不足,如有不足希望可以留言指正




 

