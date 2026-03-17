// auth.js — session guard for app.html
(function() {
  const session = JSON.parse(localStorage.getItem('d4vault_session') || 'null');
  if (!session || session.expires < Date.now()) {
    window.location.href = 'index.html';
    return;
  }
  // Refresh session on activity
  document.addEventListener('click', () => {
    const s = JSON.parse(localStorage.getItem('d4vault_session') || 'null');
    if (s) {
      s.expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('d4vault_session', JSON.stringify(s));
    }
  }, { passive: true });
})();

function signOut() {
  localStorage.removeItem('d4vault_session');
  window.location.href = 'index.html';
}
