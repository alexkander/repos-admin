(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const id = button.dataset.id;
    const options = { method: 'POST' };
    fetch(`/repo/${id}/fetchRemotes`, options)
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
    .querySelectorAll('.app--buttonFetchRepoRemotesById')
    .forEach((element) => {
      element.addEventListener('click', onButtonClick);
    });
})();
