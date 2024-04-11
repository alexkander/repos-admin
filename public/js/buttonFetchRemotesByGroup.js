(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const group = button.dataset.group;
    const options = { method: 'POST' };
    fetch(`/remote/fetchRemotesByGroup/${group}`, options)
      .then(async (res) => {
        const data = await res.json();
        AppHelpers.showSuccessMessage(
          `Remotes fetched ${data.length} synchronized`,
        );
      })
      .catch((err) => {
        console.log(err);
        AppHelpers.showFailsMessage('Error fetching remotes');
      })
      .finally(() => {
        button.disabled = false;
      });
  };

  document
    .querySelectorAll('.app--buttonFetchRemotesByGroup')
    .forEach((element) => {
      element.addEventListener('click', onButtonClick);
    });
})();
