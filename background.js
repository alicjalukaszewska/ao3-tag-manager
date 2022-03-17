chrome.runtime.onMessage.addListener((msg, sender) => {
  if (
    chrome.pageAction &&
    msg.from === "content" &&
    msg.subject === "showPageAction"
  ) {
    chrome.pageAction.show(sender.tab.id);
  }
});
