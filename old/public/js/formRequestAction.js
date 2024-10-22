(() => {
  const onFormSubmit = (event) => {
    event.preventDefault();
    const formElement = event.target;
    formElement.disabled = true;
    const inputElements = event.target.querySelectorAll('[name]');
    const payload = {};
    for (const inputElement of inputElements) {
      const isCheckbox = inputElement.type === 'checkbox';
      const name = inputElement.name;
      const value = isCheckbox ? !!inputElement.checked : inputElement.value;
      payload[name] = value;
    }
    const url = event.target.action;
    const options = {
      method: event.target.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error in request: ' + response.status);
        }
        AppHelpers.showSuccessMessage('success');
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('error');
      })
      .finally(() => {
        formElement.disabled = false;
      });
  };

  const onModalShow = (evt) => {
    AppHelpers.prepareFormFields(evt.relatedTarget, evt.target);
    AppHelpers.prepareLabels(evt.target);
  };

  document.querySelectorAll('.app--formRequestAction').forEach((element) => {
    element.addEventListener('submit', onFormSubmit);
    element.addEventListener('show.bs.modal', onModalShow);
  });
})();
