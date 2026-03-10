// Client-side JavaScript for CineVillage Admin Portal

document.addEventListener('DOMContentLoaded', function() {

  // Auto-dismiss alerts after 5 seconds and add a close button
  document.querySelectorAll('.alert').forEach(function(alert) {
    var dismiss = function() {
      alert.style.opacity = '0';
      setTimeout(function() { alert.remove(); }, 300);
    };
    setTimeout(dismiss, 5000);

    var closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'cursor:pointer;margin-left:auto;opacity:0.7';
    closeBtn.onclick = dismiss;
    alert.appendChild(closeBtn);
  });

  // Highlight the current page's link in the nav bar
  var path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (path === href || (path.startsWith(href) && href !== '/dashboard' && href !== '/')) {
      link.classList.add('active');
    }
  });

  // Set the minimum allowed date/time on datetime inputs to right now
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // adjust for local timezone
  var minDt = now.toISOString().slice(0, 16);
  document.querySelectorAll('input[type="datetime-local"]').forEach(function(input) {
    if (!input.value) input.min = minDt;
  });

  // Clicking the date wrapper div opens the date picker
  document.querySelectorAll('.date-input-wrapper').forEach(function(wrapper) {
    var input = wrapper.querySelector('input[type="date"]');
    if (input) {
      wrapper.onclick = function(e) {
        e.preventDefault();
        input.focus();
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      };
    }
  });

  // Disable the submit button after the first click to prevent double-submitting
  document.querySelectorAll('form').forEach(function(form) {
    form.onsubmit = function() {
      var btn = this.querySelector('button[type="submit"]');
      if (btn && !btn.disabled) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.textContent = btn.textContent.trim() + '...';
      }
    };
  });

});

// Show a browser confirm dialog before deleting something
function confirmDelete(message) {
  return confirm(message || 'Are you sure you want to delete this item? This action cannot be undone.');
}

// Highlight empty required fields in red and shake them
function validateForm(formId) {
  var form = document.getElementById(formId);
  if (!form) return true;

  var valid = true;
  form.querySelectorAll('input[required], select[required], textarea[required]').forEach(function(input) {
    if (!input.value.trim()) {
      input.style.borderColor = 'var(--danger-color)';
      input.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
      input.classList.add('shake');
      setTimeout(function() { input.classList.remove('shake'); }, 500);
      valid = false;
    } else {
      input.style.borderColor = 'var(--border-color)';
      input.style.boxShadow = 'none';
    }
  });
  return valid;
}

function printPage() {
  window.print();
}

// Read the page's table and download it as a .csv file
function exportTableToCSV(filename) {
  filename = filename || 'export.csv';
  var table = document.querySelector('table');
  if (!table) { alert('No table found to export'); return; }

  // Get plain text from a cell
  function cellText(el) {
    return (el.textContent || '').trim().replace(/"/g, '""');
  }

  var rows = [];

  // Header row — skip the last "Actions" column
  var headerRow = table.querySelector('thead tr');
  if (headerRow) {
    var headers = Array.from(headerRow.querySelectorAll('th')).slice(0, -1);
    rows.push(headers.map(function(th) { return '"' + cellText(th) + '"'; }).join(','));
  }

  // Data rows — skip cells that contain action buttons
  table.querySelectorAll('tbody tr').forEach(function(tr) {
    var cells = [];
    tr.querySelectorAll('td').forEach(function(td) {
      if (!td.querySelector('.table-actions')) {
        cells.push('"' + cellText(td) + '"');
      }
    });
    if (cells.length) rows.push(cells.join(','));
  });

  // Create a download link and click it programmatically
  var csv = '\uFEFF' + rows.join('\n'); // \uFEFF = BOM so Excel opens UTF-8 correctly
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Table exported successfully!', 'success');
}

// Show a temporary notification in the top-right corner
function showToast(message, type) {
  type = type || 'info';
  var toast = document.createElement('div');
  toast.className = 'alert alert-' + type;
  toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;min-width:300px;animation:slideInRight 0.5s ease-out';
  toast.textContent = message;

  var closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'cursor:pointer;margin-left:1rem;opacity:0.7';
  closeBtn.onclick = function() { toast.remove(); };
  toast.appendChild(closeBtn);

  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.animation = 'slideOutRight 0.5s ease-out';
    setTimeout(function() { toast.remove(); }, 500);
  }, 4000);
}
