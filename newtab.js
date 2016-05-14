const OVERLAY_CANVAS_SHIFT = 20;
const IMAGE_CANVAS_SHIFT = 150;
const CANVAS_PADDING = IMAGE_CANVAS_SHIFT - OVERLAY_CANVAS_SHIFT;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message == 'imgData') {
    fetchImage(request.url);
  }
});

rect = function() {
  let tool = this;
  this.started = false;

  this.mousedown = function(ev) {
    tool.started = true;
    tool.x0 = ev._x;
    tool.y0 = ev._y;
  };

  this.mousemove = function(ev, final = false) {
    if (!tool.started) { return; }

    let x = Math.min(ev._x,	tool.x0);
    let y = Math.min(ev._y,	tool.y0);
    let w = Math.abs(ev._x - tool.x0);
    let h = Math.abs(ev._y - tool.y0);

    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

    if (!w || !h) {
      return;
    }

    if (final) {
      if (x < CANVAS_PADDING) {
        w -= CANVAS_PADDING - x;
        x = CANVAS_PADDING;
      }
      if (y < CANVAS_PADDING) {
        h -= CANVAS_PADDING - y;
        y = CANVAS_PADDING;
      }
      if (x + w > CANVAS_PADDING + width) {
        w = CANVAS_PADDING + width - x;
      }
      if (y + h > CANVAS_PADDING + height) {
        h = CANVAS_PADDING + height - y;
      }
    }

    ctxOverlay.strokeStyle="#FF0000";
    ctxOverlay.strokeRect(x, y, w, h);

    selectionX = x - CANVAS_PADDING;
    selectionY = y - CANVAS_PADDING;
    selectionW = w;
    selectionH = h;
  };

  this.mouseup = function(ev) {
    if (tool.started) {
      tool.mousemove(ev, true);
      tool.started = false;
    }
  };
};

// The general-purpose event handler. This function just determines the mouse
// position relative to the canvas element.
function ev_canvas(ev) {
  ev._x = ev.offsetX;
  ev._y = ev.offsetY;

  let func = tool[ev.type];
  if (func) {
    func(ev);
  }
}

let canvas = document.createElement('canvas');
let canvasHide = document.createElement('canvas');
let canvasOverlay = document.createElement('canvas');
let canvasCrop = document.createElement('canvas');
let ctx = canvas.getContext("2d");
let ctxHide = canvasHide.getContext("2d");
let ctxOverlay = canvasOverlay.getContext("2d");
let ctxCrop = canvasCrop.getContext("2d");
let tool = new rect();
let selectionX, selectionY, selectionW, selectionH = 0;
let width = 0;
let height = 0;

function fetchImage(url) {
  let imgTag = document.createElement('img');
  imgTag.onload = function() {
    width = imgTag.width;
    height = imgTag.height;

    canvas.width = width;
    canvasHide.width = width;
    canvasOverlay.width = width * 2 + IMAGE_CANVAS_SHIFT;
    canvas.height = height;
    canvasHide.height = height;
    canvasOverlay.height = height * 2 + IMAGE_CANVAS_SHIFT;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgTag, 0, 0, width, height);
    imgTag.src = '';
  };
  imgTag.src = url;
}

function setCssProperty(tag, propName, propValue) {
  tag.style.setProperty(propName, propValue, 'important');
}

function setCanvasCSS(canvas, padding, zindex) {
  setCssProperty(canvas, 'position', 'absolute');
  setCssProperty(canvas, 'left', padding);
  setCssProperty(canvas, 'top', padding);
  setCssProperty(canvas, 'z-index', zindex);
}

function initDrawer() {
  setCanvasCSS(canvas, IMAGE_CANVAS_SHIFT + 'px', 0);
  setCanvasCSS(canvasHide, IMAGE_CANVAS_SHIFT + 'px', 1);
  setCanvasCSS(canvasOverlay, OVERLAY_CANVAS_SHIFT + 'px', 2);

  canvasOverlay.addEventListener('mousedown', ev_canvas, false);
  canvasOverlay.addEventListener('mousemove', ev_canvas, false);
  canvasOverlay.addEventListener('mouseup',   ev_canvas, false);

  document.body.appendChild(canvas);
  document.body.appendChild(canvasHide);
  document.body.appendChild(canvasOverlay);
}

function upload(base64Img) {
  let img = base64Img.substring(base64Img.indexOf(',') + 1)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/\./g, '=');
  img = '<html><head><title>Google Image</title></head><body><form id="f" method="POST" action="https://www.google.com/searchbyimage/upload" enctype="multipart/form-data"><input type="hidden" name="image_content" value="' + img + '"><input type="hidden" name="filename" value=""><input type="hidden" name="image_url" value=""><input type="hidden" name="sbisrc" value="cr_1_5_1"></form><script>document.getElementById("f").submit();</script></body></html>';
  let f = 'data:text/html;charset=utf-8;base64,' + window.btoa(img);

  chrome.tabs.create({'url': f, 'selected': false});
}

function google() {
  canvasCrop.width = selectionW;
  canvasCrop.height = selectionH;

  ctxCrop.drawImage(
    canvas, selectionX, selectionY, selectionW, selectionH, // source
    0, 0, selectionW, selectionH // dest
  );

  let base64Img = canvasCrop.toDataURL('image/png', 1);
  upload(base64Img);
}

function show() {
  ctxHide.clearRect(selectionX, selectionY, selectionW, selectionH);
}

function hide() {
  ctxHide.fillStyle = '#000';
  ctxHide.fillRect(selectionX, selectionY, selectionW, selectionH);
}

function bindHeader() {
  let button = document.getElementById('search');
  button.onclick = google;
}

function bindShortCuts() {
  document.body.addEventListener('keypress', (e) => {
    switch (e.keyCode) {
      case 1081:
      case 1049:
      case 113:
      case 81:
        google();
        break;
      case 1094:
      case 1062:
      case 119:
      case 87:
        hide();
        break
      case 1091:
      case 1059:
      case 101:
      case 69:
        show();
        break
      default:
        console.log(e.keyCode);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  bindShortCuts();
  bindHeader();
  initDrawer();
});
