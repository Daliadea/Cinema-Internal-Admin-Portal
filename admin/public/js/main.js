// Client-side JavaScript for CineVillage Admin Portal

console.log('%cCineVillage Admin Portal', 'font-size: 20px; font-weight: bold; color: #e94560;');
console.log('%cJavaScript loaded successfully', 'color: #00d9a3;');

// Automatically dismiss alerts after 5 seconds with fade animation
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'all 0.5s ease-out';
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
    
    // Add close button to alerts
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'cursor: pointer; font-size: 1.2rem; font-weight: bold; margin-left: auto; opacity: 0.7; transition: opacity 0.3s;';
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
    closeBtn.addEventListener('click', () => {
      alert.style.transition = 'all 0.3s ease-out';
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      setTimeout(() => alert.remove(), 300);
    });
    alert.appendChild(closeBtn);
  });
});

// Mobile nav toggle (hamburger)
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function() {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    // Close menu when a nav link is clicked (for in-page navigation on mobile)
    document.querySelectorAll('.nav-menu a').forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

// Highlight active navigation link with smooth animation
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath === linkPath || 
        (currentPath.startsWith(linkPath) && linkPath !== '/dashboard' && linkPath !== '/')) {
      link.classList.add('active');
    }
  });
});

// Confirm delete actions with modern dialog
function confirmDelete(message) {
  return confirm(message || 'Are you sure you want to delete this item? This action cannot be undone.');
}

// Enhanced form validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;
  
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'var(--danger-color)';
      input.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
      isValid = false;
      
      // Add shake animation
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    } else {
      input.style.borderColor = 'var(--border-color)';
      input.style.boxShadow = 'none';
    }
  });
  
  return isValid;
}

// Shake animation for validation errors
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  .shake {
    animation: shake 0.3s ease-in-out;
  }
`;
document.head.appendChild(style);

// Set minimum datetime for datetime-local inputs to current time
document.addEventListener('DOMContentLoaded', function() {
  const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);
  
  datetimeInputs.forEach(input => {
    if (!input.value) {
      input.min = minDateTime;
    }
  });
});

// Date inputs: clicking anywhere on the box opens the date picker
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.date-input-wrapper').forEach(function(wrapper) {
    const input = wrapper.querySelector('input[type="date"]');
    if (input) {
      wrapper.addEventListener('click', function(e) {
        e.preventDefault();
        input.focus();
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          input.click();
        }
      });
    }
  });
});

// Enhanced table row interactions
document.addEventListener('DOMContentLoaded', function() {
  const tableRows = document.querySelectorAll('tbody tr');
  tableRows.forEach(row => {
    row.style.cursor = 'pointer';
    
    row.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.005)';
    });
    
    row.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
});

// Add loading state to buttons on form submission
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        const originalText = submitBtn.textContent;
        submitBtn.textContent = originalText + '...';
        
        // Re-enable after 5 seconds if form wasn't submitted
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          submitBtn.textContent = originalText;
        }, 5000);
      }
    });
  });
});

// Print functionality
function printPage() {
  window.print();
}

// Export table to CSV (bonus feature)
function exportTableToCSV(filename = 'export.csv') {
  const table = document.querySelector('table');
  if (!table) {
    alert('No table found to export');
    return;
  }

  function cellText(el) {
    return (el.textContent || el.innerText || '').trim().replace(/"/g, '""');
  }

  // Prefix values that Excel might misinterpret as dates (e.g. "5/10" -> May 10)
  function escapeForExcel(text) {
    const trimmed = text.trim();
    if (/^\d+(\.\d+)?\/\d+$/.test(trimmed)) {
      return '\t' + trimmed;
    }
    return trimmed;
  }

  const csv = [];
  const theadRow = table.querySelector('thead tr');
  const headerCells = theadRow ? theadRow.querySelectorAll('th') : [];
  const headerCols = Array.from(headerCells).slice(0, -1);
  if (headerCols.length > 0) {
    csv.push(headerCols.map(function (th) { return '"' + cellText(th) + '"'; }).join(','));
  }

  table.querySelectorAll('tbody tr').forEach(function (row) {
    const tds = row.querySelectorAll('td');
    const rowCells = [];
    tds.forEach(function (td) {
      if (!td.querySelector('.table-actions')) {
        const text = escapeForExcel(cellText(td));
        rowCells.push('"' + text + '"');
      }
    });
    if (rowCells.length > 0) {
      csv.push(rowCells.join(','));
    }
  });

  const csvContent = '\uFEFF' + csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  showToast('Table exported successfully!', 'success');
}

// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 300px; animation: slideInRight 0.5s ease-out;';
  toast.textContent = message;
  
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = 'cursor: pointer; font-size: 1.2rem; font-weight: bold; margin-left: 1rem; opacity: 0.7;';
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.5s ease-out';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Add slide animations
const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(animStyle);

// Add page transition effect
window.addEventListener('load', function() {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease-in';
    document.body.style.opacity = '1';
  }, 50);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + K for search (if you add search later)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
    if (searchInput) searchInput.focus();
  }
  
  // Escape to close modals/alerts
  if (e.key === 'Escape') {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
  }
});

console.log('%cEnhanced UI/UX features loaded', 'color: #00d9a3; font-weight: bold;');
console.log('%cKeyboard Shortcuts:', 'font-weight: bold;');
console.log('  • ESC - Close alerts');
console.log('  • Ctrl/Cmd + K - Focus search (if available)');

