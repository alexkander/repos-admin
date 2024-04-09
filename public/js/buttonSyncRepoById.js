(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const id = button.dataset.id;
    const type = button.dataset.type;
    const options = { method: 'POST' };
    fetch(`/repo/${id}/sync?type=${type}`, options)
      .then(async (res) => {
        const data = await res.json();
        console.log(data);
        AppHelpers.showSuccessMessage('Repo synchronized');
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('Error synchronizing repo');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document.querySelectorAll('.app--buttonSyncRepoById').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
