import { createRoot } from 'react-dom/client';
import App from './App';
import { getModal } from './assets';

export default defineContentScript({
  matches: [
    'https://prolodev.prologistics.info/shop_banners.php*',
    'https://www.prologistics.info/shop_banners.php*',
    'https://prolodev.prologistics.info/shop_banner.php*',
    'https://www.prologistics.info/shop_banner.php*',
  ],
  main() {
    // message listener for modals
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showModal') {
        console.log('Showing modal: ', message.status, message.text);
        getModal(message.status, message.text);
        sendResponse({ received: true });
      }
      return true; // Keep the message channel open for async response
    });

    const fullBody = document.body;

    const reactContainerExt = document.createElement('div');
    reactContainerExt.className = 'main-cgb';

    fullBody.append(reactContainerExt);

    initReactApp(reactContainerExt);
  },
});

export const initReactApp = container => {
  const root = createRoot(container).render(<App />);
};
