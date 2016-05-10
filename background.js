function imageUpload(img) {
  let imgTag = document.createElement('img');
  imgTag.onload = function() {
    let width = imgTag.width;
    let height = imgTag.height;

    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgTag, 0, 0, width, height);

    var base64Img = canvas.toDataURL('image/png', 1);
    imgTag.src = "";

    sendMsg(base64Img);
  };
  imgTag.src = img;
}

function getImg(url) {
  if (0 == url.indexOf('data:')) {
    return url;
  } else {
    return imageUpload(url);
  }
}

function sendMsg(imgData) {
  let x = imgData.split(',')[1].toString();
  chrome.runtime.sendNativeMessage(
    'by.styx.run', { data: x, bin: 'pinta' }
  );
}

function msgReceived(info, tab) {
  getImg(info.srcUrl);
}

chrome.contextMenus.create({'title': 'Open with Pinta', 'contexts': ['image'], 'onclick': msgReceived});
