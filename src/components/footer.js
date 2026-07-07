export const renderFooter = () => {
  const root = document.getElementById('footer-root');
  root.innerHTML = `
    <footer class="bg-dark text-light py-2 mt-auto">
      <div class="container text-center small text-secondary">
        <span>© Survivor. All rights reserved.</span>
      </div>
    </footer>
  `;
};
