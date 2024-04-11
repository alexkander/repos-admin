(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const id = button.dataset.id;
    const options = { method: 'PUT' };
    fetch(`/remote/${id}/fetch`, options)
      .then(async (res) => {
        const data = await res.json();
        console.log(data);
        AppHelpers.showSuccessMessage('Remote fetched');
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('Error fetching remote');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document
    .querySelectorAll('.app--buttonFetchRemoteById')
    .forEach((element) => {
      element.addEventListener('click', onButtonClick);
    });
})();
