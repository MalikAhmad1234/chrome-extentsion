document.getElementById('start-scraping-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js']
    });
  });
});
document.addEventListener('DOMContentLoaded', function () {
  newURL = "https://www.google.com/maps/@51.4893323,-0.0881552,12.5z";
  chrome.tabs.create({ url: newURL });
  window.close();
});