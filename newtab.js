chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message == 'imgData') {
    fetchImage(request.url);
  }
});

const OVERLAY_CANVAS_SHIFT = 50;
const IMAGE_CANVAS_SHIFT = 150;
const CANVAS_PADDING = IMAGE_CANVAS_SHIFT - OVERLAY_CANVAS_SHIFT;

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
        w = w - (CANVAS_PADDING - x);
        x = CANVAS_PADDING;
      }
      if (y < CANVAS_PADDING) {
        h = h - (CANVAS_PADDING - y);
        y = CANVAS_PADDING;
      }
      if (x + w > CANVAS_PADDING + width) {
        w = CANVAS_PADDING + width - x;
      }
      if (y + h > CANVAS_PADDING + height) {
        h = CANVAS_PADDING + height - y;
      }
    }

    ctxOverlay.strokeRect(x, y, w, h);

    selectionX = x;
    selectionY = y;
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
let canvasOverlay = document.createElement('canvas');
let canvasCrop = document.createElement('canvas');
let ctx = canvas.getContext("2d");
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
    canvasOverlay.width = width * 2 + IMAGE_CANVAS_SHIFT;
    canvas.height = height;
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
  setCanvasCSS(canvasOverlay, OVERLAY_CANVAS_SHIFT + 'px', 1);

  canvasOverlay.addEventListener('mousedown', ev_canvas, false);
  canvasOverlay.addEventListener('mousemove', ev_canvas, false);
  canvasOverlay.addEventListener('mouseup',   ev_canvas, false);

  document.body.appendChild(canvas);
  document.body.appendChild(canvasOverlay);
}

function google() {
  console.log(selectionX, selectionY, selectionW, selectionH);
  return;

  // TODO
  let cropWidth = 0;
  let cropHeight = 0;

  canvasCrop.width = cropWidth;
  canvasCrop.height = cropHeight;

  let base64Img = canvasCrop.toDataURL('image/png', 1);
  upload(base64Img);
}

function bindHeader() {
  let button = document.getElementById('search');
  button.onclick = google;
}

document.addEventListener('DOMContentLoaded', function() {
  bindHeader();
  initDrawer();
});
