(() => {
  const onFormSubmit = (event) => {
    event.preventDefault();
    const formElement = event.target;
    formElement.disabled = true;
    const formData = new FormData(event.target);
    const payload = {};
    for (var pair of formData.entries()) {
      payload[pair[0]] = pair[1];
    }
    const url = event.target.action;
    const options = {
      method: event.target.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    console.log(options, [url]);
    fetch(url, options)
      .then(() => {
        AppHelpers.showSuccessMessage('success');
      })
      .catch(() => {
        AppHelpers.showFailsMessage('error');
      })
      .finally(() => {
        formElement.disabled = false;
      });
  };

  document.querySelectorAll('.app--formRequestAction').forEach((element) => {
    element.addEventListener('submit', onFormSubmit);
  });
})();
