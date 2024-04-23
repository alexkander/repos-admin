(() => {
  const onModalShow = (evt) => {
    const localBranchId = evt.relatedTarget.dataset.localBranchId;

    const inputLocalBranchId = evt.target.querySelector('[name=localBranchId]');
    const inputRemoteId = evt.target.querySelector('[name=remoteId]');

    console.log([
      inputLocalBranchId,
      inputLocalBranchId.value,
      inputRemoteId,
      localBranchId,
    ]);

    inputLocalBranchId.value = localBranchId;
    inputRemoteId.value = '';
  };

  document
    .getElementById('appModalPush')
    .addEventListener('show.bs.modal', onModalShow);
})();
