function initContactForm() {
  var form = document.getElementById('contact-form');
  var successMsg = document.getElementById('contact-success');
  var errorMsg = document.getElementById('contact-error');
  var submitBtn = document.getElementById('contact-submit');
  if (!form) return;

  var formUrl = form.dataset.formUrl || '';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = 'none';
    if (submitBtn) submitBtn.setAttribute('disabled', '');

    var data = {
      nom: form.querySelector('#contact-nom').value.trim(),
      email: form.querySelector('#contact-email').value.trim(),
      message: form.querySelector('#contact-message').value.trim(),
    };

    if (!data.nom || !data.email || !data.message) {
      if (submitBtn) submitBtn.removeAttribute('disabled');
      return;
    }

    if (!formUrl) {
      if (errorMsg) errorMsg.style.display = 'flex';
      if (submitBtn) submitBtn.removeAttribute('disabled');
      return;
    }

    try {
      var res = await fetch(formUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: data.nom, email: data.email, message: data.message }),
      });

      if (res.ok) {
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'flex';
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (err) {
      if (errorMsg) errorMsg.style.display = 'flex';
    } finally {
      if (submitBtn) submitBtn.removeAttribute('disabled');
    }
  });
}

initContactForm();
document.addEventListener('astro:after-swap', initContactForm);
