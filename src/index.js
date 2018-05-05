import 'lodash';
// import printMe from './print.js';
import './styles.css';
import {
  square
} from './math.js';
import _ from 'lodash'

if (process.env.NODE_ENV !== 'production') {
  console.log('Looks like we are in development mode!', process.env.NODE_ENV);
}

function component() {
  var element = document.createElement('div');
  var btn = document.createElement('button');

  element.innerHTML = _.join(['Hello', 'web', 'pack', square(3)], ' ');

  btn.innerHTML = 'Click me and check the console!';
  btn.onclick = e =>
    import ( /* webpackChunkName: "print" */ './print').then(module => {
      var print = module.default;

      print();
    });
  element.appendChild(btn);

  return element;
}

// document.body.appendChild(component());
let element = component(); // 当 print.js 改变导致页面重新渲染时，重新获取渲染的元素
document.body.appendChild(element);

if (module.hot) {
  module.hot.accept('./print.js', function () {
    console.log('Accepting the updated printMe module!');

    document.body.removeChild(element);
    element = component(); // 重新渲染页面后，component 更新 click 事件处理
    document.body.appendChild(element);
  })
}