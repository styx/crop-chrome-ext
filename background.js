function msgReceived(info, tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('newtab.html'), 'selected': true}, function(tab) {
    console.log('In create: ', tab);
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {message: 'imgData', url: info.srcUrl});
    });
  });
}

chrome.contextMenus.create({'title': 'Crop', 'contexts': ['image'], 'onclick': msgReceived});
