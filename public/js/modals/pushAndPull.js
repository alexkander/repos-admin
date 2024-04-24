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

  document.querySelectorAll('.app--modalPushAndPull').forEach((element) => {
    element.addEventListener('show.bs.modal', onModalShow);
  });
})();
