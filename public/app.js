$(function () {
  const keys = {
    guest: 'guest-demo-key',
    student: 'student-demo-key',
    teacher: 'teacher-demo-key',
    admin: 'admin-demo-key'
  };
  const roleInfo = {
    guest: { label: 'Guest', maxRows: 2, credits: 4, actions: 'Load only' },
    student: { label: 'Student', maxRows: 3, credits: 8, actions: 'Load + Search' },
    teacher: { label: 'Teacher', maxRows: 10, credits: 30, actions: 'Load + Search' },
    admin: { label: 'Admin', maxRows: 20, credits: 50, actions: 'Load + Search + Usage' }
  };

  function role() { return $('#roleSelect').val(); }
  function apiKey() { return $('#apiKey').val().trim(); }
  function setFeedback(message, type) {
    $('#feedback').removeClass('info success error warning').addClass(type || 'info').text(message).show();
  }
  function setBusy(busy) {
    $('#loading').prop('hidden', !busy);
    $('#loadBtn,#searchBtn,#usageBtn').prop('disabled', busy);
  }
  function updateRoleDisplay() {
    const r = role(), info = roleInfo[r];
    $('#roleBadge').text(info.label).attr('class', 'badge ' + r);
    $('#activeRole').text(info.label);
    $('#rowAllowance').text(info.maxRows + ' max');
    $('#roleActions').text(info.actions);
    $('#creditsLeft').text('—');
    $('#usageWrap').prop('hidden', true);
    $('#resultsTitle').text('Customer results');
    $('#tableHead').html('<tr><th>NAME</th>' + (r === 'guest' ? '' : '<th>ADDRESS</th>') + '</tr>');
    $('#resultsBody').html('<tr><td colspan="' + (r === 'guest' ? 1 : 2) + '" class="empty">No customer records to display yet.</td></tr>');
    $('#resultCount').text('0 records');
  }
  $('#roleSelect').on('change', function () {
    $('#apiKey').val(keys[role()]);
    updateRoleDisplay();
    setFeedback('Role selected. Use the matching demo API key to make a request.', 'info');
  });

  function renderCustomers(result, heading) {
    const rows = result.data || [];
    const guest = result.meta && result.meta.role === 'Guest';
    $('#resultsTitle').text(heading);
    $('#tableHead').html('<tr><th>NAME</th>' + (guest ? '' : '<th>ADDRESS</th>') + '</tr>');
    if (!rows.length) {
      $('#resultsBody').html('<tr><td colspan="' + (guest ? 1 : 2) + '" class="empty">No matching customer records found.</td></tr>');
    } else {
      const html = rows.map(row => '<tr><td>' + escapeHtml(row.Name) + '</td>' +
        (guest ? '' : '<td>' + escapeHtml(row.Address == null ? '' : row.Address) + '</td>') + '</tr>').join('');
      $('#resultsBody').html(html);
    }
    $('#resultCount').text(rows.length + (rows.length === 1 ? ' record' : ' records'));
    if (result.meta) {
      $('#activeRole').text(result.meta.role);
      $('#creditsLeft').text(result.meta.remainingCredits);
      if (heading === 'Customer results') {
        $('#rowAllowance').text(result.meta.allowedRows + ' allowed');
      }
      setFeedback('Request successful. ' + rows.length + ' record(s) returned; ' + result.meta.remainingCredits + ' credit(s) left.', 'success');
    }
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function request(options, success) {
    setBusy(true);
    setFeedback('Contacting AccessDesk API…', 'info');
    $.ajax({
      url: options.url,
      method: 'GET',
      data: options.data || {},
      dataType: 'json',
      headers: { 'x-api-key': apiKey() }
    }).done(success).fail(function (xhr) {
      const message = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Request failed. Is the server running and the database configured?';
      setFeedback('HTTP ' + xhr.status + ': ' + message, xhr.status === 429 ? 'warning' : 'error');
      $('#resultsTitle').text('Request not completed');
      $('#resultsBody').html('<tr><td colspan="' + (role() === 'guest' ? 1 : 2) + '" class="empty">No records returned for this request.</td></tr>');
      $('#resultCount').text('0 records');
      $('#usageWrap').prop('hidden', true);
    }).always(function () { setBusy(false); });
  }

  $('#loadBtn').on('click', function () {
    const limit = parseInt($('#rowLimit').val(), 10);
    request({ url: '/api/customers', data: { limit: Number.isInteger(limit) && limit > 0 ? limit : 10 } },
      result => renderCustomers(result, 'Customer results'));
  });
  $('#searchBtn').on('click', function () {
    if (role() === 'guest') {
      request({ url: '/api/customers/search', data: { name: $('#searchName').val() } },
        result => renderCustomers(result, 'Search results'));
      return;
    }
    request({ url: '/api/customers/search', data: { name: $('#searchName').val() } },
      result => renderCustomers(result, 'Search results'));
  });
  $('#usageBtn').on('click', function () {
    setBusy(true);
    setFeedback('Loading role usage…', 'info');
    $.ajax({ url: '/api/access/summary', method: 'GET', dataType: 'json', headers: { 'x-api-key': apiKey() } })
      .done(function (result) {
        $('#usageBody').html(result.data.map(item => '<tr><td>' + escapeHtml(item.role) + '</td><td>' + item.remainingCredits + '</td><td>' + item.maxCredits + '</td></tr>').join(''));
        $('#usageWrap').prop('hidden', false);
        $('#resultsTitle').text('Access usage summary');
        $('#resultsSubtitle').text('Remaining credits for each role; API keys are not disclosed.');
        $('#resultsBody').empty();
        $('#tableHead').empty();
        $('#resultCount').text(result.data.length + ' roles');
        setFeedback('Usage summary loaded. Only Admin can view this information.', 'success');
      })
      .fail(function (xhr) {
        const message = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Usage request failed.';
        setFeedback('HTTP ' + xhr.status + ': ' + message, 'error');
        $('#usageWrap').prop('hidden', true);
      })
      .always(function () { setBusy(false); });
  });

  updateRoleDisplay();
});
