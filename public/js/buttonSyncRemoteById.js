(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const id = button.dataset.id;
    const type = button.dataset.type;
    const doFetch = button.dataset.fetch;
    const doFetchQuery = doFetch ? `&doFetch=${doFetch}` : '';
    const options = { method: 'POST' };
    fetch(`/remote/${id}/sync?type=${type}${doFetchQuery}`, options)
      .then(async (res) => {
        const data = await res.json();
        console.log(data);
        AppHelpers.showSuccessMessage('Remote synchronized');
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('Error synchronizing remote');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document.querySelectorAll('.app--buttonSyncRemoteById').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
