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
  let stats = {
    transactions: {
      completed: 0,
      failed: 0,
      pending: 0,
      initiated: 0,
    }
  };
  function createRow(data){
    data.fromAddress = data.fromAcc ? data.fromAcc.address : data.from;
    data.toAddress = data.toAcc ? data.toAcc.address : data.to;
    let row = `<tr><td>${data.id}</td><td>${data.from}</td><td>${data.to}</td><td>${data.amount}</td><td>${data.status}</td><td>${data.transactionHash}</td></tr>`;
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

  function updateStats(){
    $.ajax({
      url: host + '/api/transactions/stats',
      type: 'GET',
      dataType: 'json',
      success: function (response){
        stats.transactions = {
          completed: 0,
          failed: 0,
          pending: 0,
          initiated: 0
        };
        response.map((stat) => {
          stats.transactions[stat.status] = stat.statusCount;
        });
        let row = `<div class="d-flex justify-content-between align-items-center ">
                    <span><b>Completed:</b> ${stats.transactions.completed}</span>
                    <span><b>Failed:</b> ${stats.transactions.failed}</span>
                    <span><b>Pending:</b> ${stats.transactions.pending}</span>
                    <span><b>Initiated:</b> ${stats.transactions.initiated}</span>
                   </div>`;
        $("#stats").html(row);
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

  setInterval(() => {
    updateStats();
  }, 5000);
  updateStats();
});