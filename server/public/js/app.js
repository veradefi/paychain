$(document).ready(function() {
  let data = [];
  let dataRows = [];
  let table = $('#table');
  let tableContainer = $('#table-container');
  let form = $('#form-card');
  let host = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
  let stats = {
    transactions: {
      completed: 0,
      failed: 0,
      pending: 0,
      initiated: 0,
    },
    aggregate: {
      tx_per_sec: 0,
      confirmation_per_sec: 0,
    },
  };

  if (!dataRows.length) {
    tableContainer.addClass('hidden');
  }

  function createRow(data){
    let row = `<tr><td>${data.id}</td><td>${data.title}</td><td>${data.success}</td><td>${data.duration}</td></tr>`;
    return row;
  }

  function addMoreData(item){
    let newRows = createRow(item);
    table.append(newRows);
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

  function startTestCases(e) {
    e.preventDefault();
    let value = document.getElementById('input').value;

    if (value) {
      let gg =$('#fetchData span')[0];
      gg.innerText = "Loading..."
      $.ajax({
        url: host + '/tests/start',
        type: 'POST',
        dataType: 'json',
        data: {
          tx_per_sec: value
        },
        success: function (response){

          gg.innerText = "Show"
          form.addClass('hidden')
          tableContainer.removeClass('hidden');
          tableContainer.addClass('visible');
        }
      });
    }
  }

  function init() {
    var socket = io.connect(window.location.protocol + '//' + window.location.hostname + ':1334');
    socket.on('test result', function (data) {
      addMoreData(data);
    });

    socket.on('tests finished', function(data){
      console.log(data);
    });
  }

  $('#fetchData').on('click', startTestCases);
  $('#restartBtn').on('click', function(){
    window.location.reload();
  });

  $('#addMore').on( 'click', function () {
      addMoreData(data);
  });

  init();

  setInterval(() => {
    updateStats();
  }, 5000);
  updateStats();
});