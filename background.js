function msgReceived(info, tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('newtab.html'), 'selected': true}, function(tab) {
    setTimeout(()=>{
      chrome.tabs.sendMessage(tab.id, {message: 'imgData', url: info.srcUrl});
    }, 500);
  });
}

chrome.contextMenus.create({'title': 'Crop', 'contexts': ['image'], 'onclick': msgReceived});
