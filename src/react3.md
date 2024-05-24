# 一周-每天1 小时,学习实现一个简单的mini-React  (三)

## 关于 从0到1实现一个 mini-React 过程
  ### 上周写了相对代码实现第一部分,本片文章接着写!
  
   [崔学社 mini-React](https://learn.cuixueshe.com/p/t_pc/course_pc_detail/camp_pro/course_2aWyh6wtEv0gud4X9CjSKHgSQwz)

### 完整代码 [whoelse666/mini-React](https://github.com/whoelse666/mini-React)


### 过程 --- 
#### ----------  day05 ---------- 
#### 当日目标: 实现React.useState

 对照React的API
 ```
 //一个count++ 的例子
    const [count, setCount] = React.useState(1);
    setCount(c => c + 1)} //setCount参数是一个函数（也可以是一个值） 执行一次count + 1
 ```
 我们可以得知useState 方法返回了一个包含一个值和一个函数的数组，那么首先第一步我们可以先去实现一个这样结构的函数
 
```js
/*
//React.js
function useState(initial) { 
  const stateHook = {
    state: nitial,
  }; 
  
  function setState(fn){}
  return [stateHook.state, setState];
}

```
然后先对state 下手，我们可以先想想再使用React。useState的时候state,经历了什么，
1.先初始化一个值，
2.在setState的时候修改state，并且修改后的值在保存下来，在下次useState

那么和之前一样
我们可以利用fiber存储

```js
/*
//React.js
function useState(initial) { 
//获取之前的fiber节点
  const oldHook = currentFiber.alternate?.stateHook


//判断是否有oldHook，区分初始化，还是更新
  const stateHook = {
     state: oldHook ? oldHook.state : initial,
  }; 
    currentFiber.stateHooks = stateHooks;
  function setState(action){
  stateHook.state = action(stateHook.state)
  
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot;
  }
  return [stateHook.state, setState];
}
```
到这里呢就可以实现useState的跟个更新了；但是，如果同时存在多个useState ,上面的代码运行就会出现问题了，什么问题呢？就是所有state 共用了一个Hook，会相互影响。
多个问题，第一时间想到的那么是不是可以通过数组将多个hook存起来，然后再对应的hook执行呢。。。



```js
/*
//React.js
let  stateHooks= [],stateHookIndex=0
function useState(initial) { 
//获取之前的fiber节点
  const oldHook = currentFiber.alternate?.stateHooks[stateHookIndex];


//判断是否有oldHook，区分初始化，还是更新
  const stateHook = {
     state: oldHook ? oldHook.state : initial,
  }; 
      stateHooks.push(stateHook);
    currentFiber.stateHooks = stateHooks;
     
  function setState(action){
  stateHook.state = action(stateHook.state)
  stateHookIndex++;
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot;
  }
  return [stateHook.state, setState];
}
```


 进一步优化： 我们都知道在React中，useState是异步的，而我们这里是同步的，就会出现重复执行，非必要的变化，导致性能浪费。 所以我们需要收集action，然后统一执行。  
 
 

```js
/*
//React.js
let  stateHooks= [],stateHookIndex=0
function useState(initial) { 
   let currentFiber = wipFiber;
  const oldHook = currentFiber.alternate?.stateHooks[stateHookIndex];
  const stateHook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue : [] //统一批量处理useState里的action
  };
  stateHook.queue.forEach(action => {
    stateHook.state = action(stateHook.state);
  });
   stateHook.queue = [];
   stateHookIndex++;
  stateHooks.push(stateHook);
  currentFiber.stateHooks = stateHooks;
  
  
  function setState(action){
      // 对不是function的在action 进行处理
    const eagerState = typeof action === 'function' ? action(stateHook.state) : action;
    if (eagerState === stateHook.state) {
      return;   
    }
    stateHook.queue.push(action);
  stateHook.state = action(stateHook.state)
  stateHookIndex++;
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot;
  }
  return [stateHook.state, setState];
}
```
 下面是完整代码
 
 ```js
 let wipRoot = null;
let currentRoot = null;
let nextWorkOfUnit = null;
let deletions = [];
let wipFiber = null;
let stateHooks = [],
  stateHookIndex = 0;
function createTextNode(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        const isTextNode = typeof child === 'string' || typeof child === 'number';
        return isTextNode ? createTextNode(child) : child;
      })
    }
  };
}

function render(el, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [el]
    }
  };

  nextWorkOfUnit = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = undefined;
    }
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

  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  } else if (fiber.effectTag === 'placement') {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDom(type) {
  return type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(type);
}

function updateProps(dom, nextProps, prevProps) {
  // 1. old 有  new 没有 删除
  Object.keys(prevProps).forEach(key => {
    if (key !== 'children') {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  });
  // 2. new 有 old 没有 添加
  // 3. new 有 old 有 修改
  Object.keys(nextProps).forEach(key => {
    if (key !== 'children') {
      if (nextProps[key] !== prevProps[key]) {
        if (key.startsWith('on')) {
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
    const isSameType = oldFiber && oldFiber.type === child?.type;

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
        effectTag: 'update',
        alternate: oldFiber
      };
    } else {
      if (child) {
        newFiber = {
          type: child.type,
          props: child.props,
          child: null,
          parent: fiber,
          sibling: null,
          dom: null,
          effectTag: 'placement'
        };
      }

      if (oldFiber) {
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

    if (newFiber) {
      prevChild = newFiber;
    }
  });

  while (oldFiber) {
    deletions.push(oldFiber);

    oldFiber = oldFiber.sibling;
  }
}

function updateFunctionComponent(fiber) {
  stateHooks = [];
  stateHookIndex = 0;
  effectHooks = [];
  wipFiber = fiber;
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
  const isFunctionComponent = typeof fiber.type === 'function';
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
  let currentFiber = wipFiber;
  return () => {
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot;
  };
}

function useState(initial) {
  let currentFiber = wipFiber;
  const oldHook = currentFiber.alternate?.stateHooks[stateHookIndex];
  const stateHook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue : [] //统一批量处理useState里的action
  };
  stateHook.queue.forEach(action => {
    stateHook.state = action(stateHook.state);
  });
  stateHook.queue = [];
  stateHookIndex++;
  stateHooks.push(stateHook);
  currentFiber.stateHooks = stateHooks;
  function setState(action) {
    // 对不是function的在action 进行处理
    const eagerState = typeof action === 'function' ? action(stateHook.state) : action;
    if (eagerState === stateHook.state) {
      return;
    }
    stateHook.queue.push(action);
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot;
  }
  return [stateHook.state, setState];
}

 

const React = {
  update,
  render,
  useState,
  createElement
};

export default React;

 ```
 
 ### Tips  刚开始写这类文章,经验不足,如有不足希望可以留言指正



 



