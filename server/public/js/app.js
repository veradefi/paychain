$(document).ready(function() {
  let data = [];
  let dataRows = [];
  let table = $('#table');
  let tableContainer = $('#table-container');
  let form = $('#form-card');
  let host = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

  if (!dataRows.length) {
    tableContainer.addClass('hidden');
  }

  function createRow(data){
    let row = `<tr><td>${data.id}</td><td>${data.title}</td><td>${data.success}</td></tr>`;
    return row;
  }

  function addMoreData(item){
    let newRows = createRow(item);
    table.append(newRows);
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
  }

  $('#fetchData').on('click', startTestCases);
  $('#restartBtn').on('click', function(){
    window.location.reload();
  });

  $('#addMore').on( 'click', function () {
      addMoreData(data);
  });

  init();
});