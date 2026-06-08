function initPasswordToggles() {
  document.querySelectorAll<HTMLButtonElement>('.toggle-pw').forEach((btn) => {
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';
    btn.addEventListener('click', () => {
      const inp = btn.previousElementSibling as HTMLInputElement | null;
      if (!inp) return;
      const shown = inp.type === 'text';
      inp.type = shown ? 'password' : 'text';
      btn.setAttribute('aria-label', shown ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
      const eyeOn = btn.querySelector<HTMLElement>('.eye-on');
      const eyeOff = btn.querySelector<HTMLElement>('.eye-off');
      if (eyeOn) eyeOn.style.display = shown ? 'block' : 'none';
      if (eyeOff) eyeOff.style.display = shown ? 'none' : 'block';
    });
  });
}

initPasswordToggles();
document.addEventListener('astro:page-load', initPasswordToggles);
