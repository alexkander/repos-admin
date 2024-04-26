(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const url = button.dataset['app-Url'];
    const method = button.dataset['app-Method'];
    const options = { method };
    fetch(`${url}`, options)
      .then(async () => {
        AppHelpers.showSuccessMessage('success');
      })
      .catch(() => {
        AppHelpers.showFailsMessage('error');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document.querySelectorAll('.app--buttonRequestAction').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
