import { renderHeader } from './header.js';
import { renderFooter } from './footer.js';

export const renderLayout = (pageRenderer, params = {}) => {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-shell">
      <div id="header-root"></div>
      <main id="page-root" class="page-content"></main>
      <div id="footer-root"></div>
    </div>
  `;

  renderHeader();
  const pageRoot = document.getElementById('page-root');
  const pageView = pageRenderer(params);
  const html = typeof pageView === 'string' ? pageView : pageView.html;
  pageRoot.innerHTML = html;
  if (pageView && typeof pageView.onMount === 'function') {
    pageView.onMount();
  }
  renderFooter();
};
