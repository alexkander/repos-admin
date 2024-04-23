(() => {
  const onModalShow = (evt) => {
    const remoteBranchId = evt.relatedTarget.dataset.remoteBranchId;
    const branchName = evt.relatedTarget.dataset.branchName;

    const inputRemoteBranchId = evt.target.querySelector(
      '[name=remoteBranchId]',
    );
    const inputBranchName = evt.target.querySelector('[name=branchName]');

    inputRemoteBranchId.value = remoteBranchId;
    inputBranchName.value = branchName;
  };

  document
    .getElementById('appModalCheckout')
    .addEventListener('show.bs.modal', onModalShow);
})();
