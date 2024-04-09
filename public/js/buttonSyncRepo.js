(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const type = button.dataset.type;
    const options = { method: 'POST' };
    fetch(`/repo/sync?type=${type}`, options)
      .then(async (res) => {
        const data = await res.json();
        AppHelpers.showSuccessMessage(`${data.length} repos synchronized`);
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('Error synchronizing repos');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document.querySelectorAll('.app--buttonSyncRepo').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
