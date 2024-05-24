# 一周-每天1 小时,学习实现一个简单的mini-React  (二)
## 关于 从0到1实现一个 mini-React 过程
  ### 上周写了相对代码实现第一部分,本片文章接着写!
  
   [崔学社 mini-React](https://learn.cuixueshe.com/p/t_pc/course_pc_detail/camp_pro/course_2aWyh6wtEv0gud4X9CjSKHgSQwz)

### 完整代码 [whoelse666/mini-React](https://github.com/whoelse666/mini-React)


### 过程 --- 
#### ----------  day04 ---------- 
#### 当日目标: 实现事件绑定,更新props

首先要触发更新.那么写一个update函数 
这里我们可以对照一下render()
```js
/*

function render(el, container) { 
nextWorkOfUnit = {
dom: container,
props: { 
children: [el],
},
}; 
root = nextWorkOfUnit; 
}

 
*/
对比React ,在更新的时候是不传el,container 的;
那么在初始化的时候用变量存储
let currentRoot = null;

function commitRoot() {
   commitWork(root.child);
   currentRoot = root; //此处是root 全部处理完成的完整结构
   root = null;
}

//在初始化的时候 nextWorkOfUnit 最后后赋值为null,停止workLoop,这里重新给nextWorkOfUnit赋值,激活workLoop。
function  update(){
    nextWorkOfUnit = {
    dom: currentRoot.dom,
    props: currentRoot.props,
   alternate: currentRoot,//这个属性作用是建立新老节点一一对应的指针,对比是会用到
  };
root = nextWorkOfUnit; 
}

```
#### 图1
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/79d11abf9b304716baa3c27a16e1a024~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1176&h=534&s=81129&e=png&b=f8f8f8)

首先,不考虑整体逻辑,单独对于属性的更新, 之前在updateProps 函数中对于props处理添加到Dom ,这里两步 

1.  更新/删除/添加 props
2.  事件属性处理
```js
//React.js  
// todo 只考虑更新情况 ,要比较新老之间变化,那么久需要拿到新老的两个 nextProps, prevProps
function updateProps(dom, nextProps, prevProps) {
// 之前的代码,只处理了非children 属性,对于类似onClick等特殊的属性未做处理,
// Object.keys(props).forEach((key) => {
 //   if (key !== "children") {
 //     dom[key] = props[key];
 //   }
//  });

分情况处理：
 // 1.  old 有  new 没有 删除
  //循环旧的prevProps ，在新的nextProps,中没有那就删除
  Object.keys(prevProps).forEach((key) => {
    if (key !== "children") {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  });


  // 2. new 有 old 没有 添加 （添加也可以视为更新的一种）
  // 3. new 有 old 有 修改
 // 这里事件绑定也比较简单,在之前基础上,添加判断就可以,事件属性都是以on 开头,那么就过滤这部分属性单独    处理就可以
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
    //这里处理**事件**绑定
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        //这里需要注意的是在每addEventListener 需要删除之前的事件,为添加多个事件
        dom.removeEventListener(eventType, props[key]);
        dom.addEventListener(eventType, props[key]);
      } else {
        //这里处理**非事件**绑定
        dom[key] = props[key];
      }
    }
  });
  }
 

// 添加属性用作判断是update 还是 placement
function initChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    //判断新旧dom type 是否相同，相同就是更新 ， create的时候一定是 isSameType = false;
    const isSameType = oldFiber && oldFiber.type === child.type;
    let newFiber;
    if (isSameType) {
      // update
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "update",//判断
        alternate: oldFiber,
      };
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        effectTag: "placement",
      };
    }

    if (oldFiber) {
    // 处理了child 后，判断child是否有兄弟节点，有的话继续处理
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

```




#### ----------  day05 ---------- 
#### 当日目标:  新旧 dom树对比后 处理 （删除 ： 新的比老的短则删除）

1. 删除可能为多个删除，则用变量deletions= [] 数组存储所有需要删除的节点。
2. 创建一个函数处理 function commitDeletion().

  **那么需要思考的是在哪里给 deletions push节点呢？**
  前面在initChildren （图2 ） 函数中判断了是否为update  ，在isSameType 不同那么就需要删除

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2239abf359ec47c5b808728ea261bd12~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1580&h=1434&s=134576&e=png&b=141623)

```js

function initChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    const isSameType = oldFiber && oldFiber.type === child.type;

    let newFiber;
    if (isSameType) {
      // update
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "update",
        alternate: oldFiber,
      };
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        effectTag: "placement",
      };

      if (oldFiber) {
      //添加进入需要删除的数组中
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function commitDeletion(fiber) {
//删除节点就是找到需要删除节点的父节点然后removeChild
  if (fiber.dom) {
  //函数式组件特殊处理，逐层往上找有有效父节点
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
}


function commitRoot() {
  deletions.forEach(commitDeletion);//循环删除每一个
  commitWork(root.child);
      currentRoot = root;
    root = null;
  deletions = [];//重置待删除的数组
}

```


### 完整代码（部分变量名和函数名字，因为功能变化，有修改，一一对照即可）


```js
//App.js


import React from "./core/React.js";

let showBar = false;
function Counter() {
  // const foo = <div>foo</div>;
  function Foo () {
    return <div>foo</div>
    
  }
  const bar = <p>bar</p>;

  function handleShowBar() {
    showBar = !showBar;
    React.update();
  }

  return (
    <div>
      Counter
 
      <div>{showBar ? bar : <Foo></Foo>}</div>
      <button onClick={handleShowBar}>showBar</button>
    </div>
  );
}
function App() {
  return (
    <div>
      hi-mini-react
      <Counter ></Counter>
    </div>
  );
}

export default App;

```



```js 
//React.js
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
  wipRoot = {
    dom: container,
    props: {
      children: [el],
    },
  };

  nextWorkOfUnit = wipRoot;
}

let wipRoot = null;
let currentRoot = null;
let nextWorkOfUnit = null;
let deletions = [];
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function commitRoot() {
  deletions.forEach(commitDeletion);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  deletions = [];
}

function commitDeletion(fiber) {
  if (fiber.dom) {
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
}

function commitWork(fiber) {
  if (!fiber) return;

  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.effectTag === "update") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  } else if (fiber.effectTag === "placement") {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDom(type) {
  return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom, nextProps, prevProps) {

  // 1. old 有  new 没有 删除
  Object.keys(prevProps).forEach((key) => {
    if (key !== "children") {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  });
  // 2. new 有 old 没有 添加
  // 3. new 有 old 有 修改
  Object.keys(nextProps).forEach((key) => {
    if (key !== "children") {
      if (nextProps[key] !== prevProps[key]) {
        if (key.startsWith("on")) {
          const eventType = key.slice(2).toLowerCase();
          dom.removeEventListener(eventType, prevProps[key]);
          dom.addEventListener(eventType, nextProps[key]);
        } else {
          dom[key] = nextProps[key];
        }
      }
    }
  });
}

function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    const isSameType = oldFiber && oldFiber.type === child.type;

    let newFiber;
    if (isSameType) {
      // update
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "update",
        alternate: oldFiber,
      };
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        effectTag: "placement",
      };

      if (oldFiber) {
        console.log("should delete", oldFiber);
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

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

  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));

    updateProps(dom, fiber.props, {});
  }

  const children = fiber.props.children;
  reconcileChildren(fiber, children);
}

function performWorkOfUnit(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

function update() {
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  };

  nextWorkOfUnit = wipRoot;
}

const React = {
  update,
  render,
  createElement,
};

export default React;

```



 ### Tips  刚开始写这类文章,经验不足,如有不足希望可以留言指正



 

