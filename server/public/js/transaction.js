$(document).ready(function() {
  let transactions = [];
  let table = $('#table');
  let tableContainer = $('#table-container');
  let host = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

  let pagination = {
    currentPage: 0,
    totalCount: 0,
    maxSize: 25,
  };
  function createRow(data){
    data.fromAddress = data.fromAcc ? data.fromAcc.address : data.from;
    data.toAddress = data.toAcc ? data.toAcc.address : data.to;
    let row = `<tr><td>${data.id}</td><td>${data.from}</td><td>${data.to}</td><td>${data.status}</td><td>${data.transactionHash}</td></tr>`;
    return row;
  }

  function addMoreData(item){
    let newRows = createRow(item);
    table.append(newRows);
  }

  function loadTransactions() {
    $.ajax({
      url: host + '/api/transactions?limit=' + pagination.maxSize + '&offset=' + (pagination.maxSize * pagination.currentPage),
      type: 'GET',
      dataType: 'json',
      success: function (response){
        transactions = transactions.concat(response);
        (response || []).forEach(function(item){
          addMoreData(item);
        });
        if (!response || !response.length || response.length < pagination.maxSize) {
          $("#loadMoreBtn").addClass('hidden');
        }
        pagination.currentPage++;
      }
    });
  }

  $('#loadMoreBtn').on( 'click', function () {
      loadTransactions();
  });

  $('#refreshBtn').on('click', function(){
    window.location.reload();
  });

  loadTransactions();
});