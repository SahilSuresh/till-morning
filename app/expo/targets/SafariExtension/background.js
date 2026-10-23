// Relays the page script's questions to the app's native handler (wait rule, park).
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  browser.runtime
    .sendNativeMessage('com.andrej.tillmorning', message)
    .then((reply) => sendResponse(reply))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});
