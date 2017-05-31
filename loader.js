'use strict';
if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
  onReady();
}
else {
  document.addEventListener('DOMContentLoaded', onReady);
}

function onReady() {
  var div = document.createElement('div');
  div.style.display = 'none';
  div.innerHTML = `
    <style type="text/css">
    .loader .middler-table {
      display: table;
      width: 100%;
      height: 100%;
    }
    .loader .middler-content {
      display: table-cell;
      text-align: center;
      vertical-align: middle;
    }
    .middler-wrap.loader {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      position: absolute;
    }
    .middler-wrap.loader .middler-content {
      background: rgba(255,255,255,0.85);
      color: #000;
    }
    .loader .title {
      font-size: 2em;
      font-weight: bold;
      text-shadow: 0 0 0.1em #FFF, 0 0 0.1em #FFF, 0 0 0.2em #000;
    }
    progress {
      font-size: 1.5em;
      width: 80%;
      box-shadow: 0 0 0.2em 0.1em #000;
      border-radius: 0.5em;
      overflow: hidden;
      margin: 0.25em;
    }
    progress::-webkit-progress-bar {
      background: #FFF;
      padding: 0.05em;
      box-shadow: inset 0 0 0.2em #07F;
      border-radius: 0.5em
    }
    progress::-webkit-progress-value {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.5) 25%, rgba(0,0,0,0.5)),
        repeating-linear-gradient(45deg, #000 0, #000 0.5em, #07F 0.6em, #07F 1.1em, #000 1.2em);
      border-radius: 0.5em;
      box-shadow: inset 0 0 0.2em #000;
    }
    </style>
  `;
  document.body.appendChild(div);
}

class Loader {
  constructor({ title, text, value=0, max=100 }) {
    var elem = document.createElement('div');
    elem.className = 'middler-wrap loader';
    elem.innerHTML = `
        <div class="middler-table">
          <div class="middler-content">
            <div class="title hidden"></div>
            <div class="text hidden"></div>
            <progress value="0" max="0"></progress>
          </div>
        </div>
      `;
    document.body.appendChild(elem);
    this._ = { element: elem }
    Object.assign(this, { title, text, value, max });
  }

  set title(value) {
    this._.title = value;
    var elem = this._.element.querySelector('.title');
    elem.classList[(value == undefined || value == '') ? 'add' : 'remove']('hidden');
    elem.textContent = value;
  }

  set text(value) {
    this._.text = value;
    var elem = this._.element.querySelector('.text');
    elem.classList[(value == undefined || value == '') ? 'add' : 'remove']('hidden');
    elem.textContent = value;
  }

  set value(value) {
    this._.value = value;
    var elem = this._.element.querySelector('progress');
    elem.value = value;
  }

  set max(value) {
    this._.max = value;
    var elem = this._.element.querySelector('progress');
    elem.max = value;
  }

  get title() { return this._.title; }
  get text() { return this._.text; }
  get value() { return this._.value; }
  get max() { return this._.max; }

  close() {
    var elem = this._.element;
    elem.parentNode.removeChild(elem);
  }
}