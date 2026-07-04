/* ============================================================
   MODAL DE CONFIRMACIÓN PERSONALIZADO
   ============================================================ */

function showConfirmModal(message, onConfirm) {
  // Detectar tipo de acción por palabras clave para elegir ícono/color
  var msg = (message || '').toLowerCase();
  var isDelete  = msg.includes('cancel') || msg.includes('elimin');
  var isDanger  = isDelete;
  var isApprove = msg.includes('aprobar') || msg.includes('completar') || msg.includes('confirmar');
  var isEdit    = msg.includes('guardar') || msg.includes('estado');

  var iconSvg = isDelete
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : isApprove
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  var iconColor = isDelete  ? '#d94444'
                : isApprove ? '#28a262'
                : isEdit    ? '#e0980e'
                : '#0d7fa3';

  var confirmLabel = isDelete  ? 'Sí, cancelar'
                   : isApprove ? 'Confirmar'
                   : isEdit    ? 'Guardar'
                   : 'Confirmar';

  var confirmClass = isDelete  ? 'modal-confirm-danger'
                   : isApprove ? 'modal-confirm-success'
                   : 'modal-confirm-primary';

  // Crear overlay
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-title');

  overlay.innerHTML =
    '<div class="modal-box">' +
      '<div class="modal-icon-wrap" style="color:' + iconColor + ';background:' + iconColor + '18">' +
        iconSvg +
      '</div>' +
      '<h3 class="modal-title" id="modal-title">¿Confirmar acción?</h3>' +
      '<p class="modal-message">' + message + '</p>' +
      '<div class="modal-actions">' +
        '<button type="button" class="modal-btn-cancel">Cancelar</button>' +
        '<button type="button" class="modal-btn-confirm ' + confirmClass + '">' + confirmLabel + '</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // Animar entrada
  requestAnimationFrame(function() {
    overlay.classList.add('modal-overlay-visible');
  });

  function close() {
    overlay.classList.remove('modal-overlay-visible');
    overlay.classList.add('modal-overlay-closing');
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 220);
  }

  // Eventos
  overlay.querySelector('.modal-btn-cancel').addEventListener('click', close);
  overlay.querySelector('.modal-btn-confirm').addEventListener('click', function() {
    close();
    onConfirm();
  });
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  });

  // Focus al botón de confirmar
  setTimeout(function() {
    var btn = overlay.querySelector('.modal-btn-confirm');
    if (btn) btn.focus();
  }, 80);
}

/* ============================================================
   FORM SUBMIT — usa modal en vez de window.confirm
   ============================================================ */
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (form.dataset.confirm && form.dataset.confirmed !== 'true') {
      event.preventDefault();

      showConfirmModal(form.dataset.confirm, function() {
        form.dataset.confirmed = 'true';

        var submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          var loadingText = submitButton.dataset.loadingText || 'Procesando...';
          submitButton.dataset.originalHtml = submitButton.dataset.originalHtml || submitButton.innerHTML;
          submitButton.disabled = true;
          submitButton.classList.add('is-loading');
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span class="btn-label">' + loadingText + '</span>';
        }

        form.submit();
      });
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      const loadingText = submitButton.dataset.loadingText || 'Procesando...';
      submitButton.dataset.originalHtml = submitButton.dataset.originalHtml || submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.classList.add('is-loading');
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span class="btn-label">${loadingText}</span>`;
    }
  });
});

const closeFlashToast = (toast) => {
  if (!toast || toast.classList.contains('flash-removing')) return;

  toast.classList.add('flash-removing');
  window.setTimeout(() => {
    const stack = toast.closest('.flash-stack');
    toast.remove();
    if (stack && !stack.children.length) {
      stack.remove();
    }
  }, 220);
};

document.querySelectorAll('.flash-toast').forEach((toast) => {
  const dismissMs = Number(toast.dataset.dismissMs || 4300);
  const closeButton = toast.querySelector('.flash-close');
  const timerBar = toast.querySelector('.flash-timer');
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  if (timerBar) {
    timerBar.style.animation = `flashTimerDrain ${dismissMs}ms linear forwards`;
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => closeFlashToast(toast));
  }

  if (toast.dataset.autoDismiss === 'true') {
    window.setTimeout(() => closeFlashToast(toast), dismissMs);
  }
});

const specialtySelect = document.getElementById('booking-specialty');
const doctorSelect = document.getElementById('booking-doctor');
const specialtyHelper = document.getElementById('booking-specialty-helper');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const revealSelector = [
    '.page-hero',
    '.appointments-hero',
    '.admin-hero-shell',
    '.doctor-panel-hero',
    '.home-hero',
    '.home-section',
    '.home-feature-card',
    '.home-image-card',
    '.home-stat-card',
    '.register-shell',
    '.metrics-grid .metric',
    '.admin-ops-grid > .card',
    '.doctor-alert-shell > .card',
    '.dashboard-table-card',
    '.booking-shell',
    '.doctors-form-card',
    '.doctors-list-card',
    '.profile-form-card',
    '.auth-card',
    '.auth-register-pro'
  ].join(',');

  const revealTargets = Array.from(document.querySelectorAll(revealSelector));

  revealTargets.forEach((element, index) => {
    element.classList.add('motion-reveal');
    const delay = Math.min(index * 45, 360);
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  const observeReveal = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-revealed');
      if (entry.target.classList.contains('metric')) {
        entry.target.classList.add('motion-pop');
      }
      observer.unobserve(entry.target);
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(observeReveal, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-revealed'));
  }
}

if (specialtySelect && doctorSelect) {
  const doctorOptions = Array.from(doctorSelect.options).slice(1);
  const defaultOption = doctorSelect.options[0];

  const syncDoctorOptions = () => {
    const selectedSpecialty = specialtySelect.value;
    let visibleCount = 0;

    doctorOptions.forEach((option) => {
      const matches = !!selectedSpecialty && option.dataset.specialty === selectedSpecialty;
      option.hidden = !matches;
      option.disabled = !matches;
      if (matches) visibleCount += 1;
    });

    if (!selectedSpecialty) {
      doctorSelect.value = '';
      doctorSelect.disabled = true;
      defaultOption.textContent = 'Seleccione especialidad primero';
      if (specialtyHelper) {
        specialtyHelper.textContent = 'Elige una especialidad para ver solo los médicos correspondientes.';
      }
      return;
    }

    doctorSelect.disabled = false;
    defaultOption.textContent = `Seleccione médico (${visibleCount} disponible${visibleCount === 1 ? '' : 's'})`;

    const currentOption = doctorSelect.options[doctorSelect.selectedIndex];
    if (!currentOption || currentOption.disabled) {
      doctorSelect.value = '';
    }

    if (specialtyHelper) {
      specialtyHelper.textContent =
        visibleCount > 0
          ? `Mostrando ${visibleCount} médico(s) de ${selectedSpecialty}.`
          : `No hay médicos registrados para ${selectedSpecialty}.`;
    }
  };

  specialtySelect.addEventListener('change', syncDoctorOptions);
  syncDoctorOptions();
}

const dashboardMetrics = document.querySelector('[data-dashboard-metrics]');
if (dashboardMetrics) {
  const modeButtons = Array.from(dashboardMetrics.querySelectorAll('[data-metrics-mode]'));
  const toggleCards = Array.from(dashboardMetrics.querySelectorAll('[data-metric-toggle]'));

  const setMetricsMode = (mode) => {
    dashboardMetrics.dataset.dashboardMetrics = mode;

    modeButtons.forEach((button) => {
      const isActive = button.dataset.metricsMode === mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    toggleCards.forEach((card) => {
      const overallTitle = card.querySelector('[data-metric-title-overall]');
      const todayTitle = card.querySelector('[data-metric-title-today]');
      const overallValue = card.querySelector('[data-metric-value-overall]');
      const todayValue = card.querySelector('[data-metric-value-today]');
      const overallSubtitle = card.querySelector('[data-metric-subtitle-overall]');
      const todaySubtitle = card.querySelector('[data-metric-subtitle-today]');

      const useToday = mode === 'today';

      if (overallTitle && todayTitle) {
        overallTitle.hidden = useToday;
        todayTitle.hidden = !useToday;
      }

      if (overallValue && todayValue) {
        overallValue.hidden = useToday;
        todayValue.hidden = !useToday;
      }

      if (overallSubtitle && todaySubtitle) {
        overallSubtitle.hidden = useToday;
        todaySubtitle.hidden = !useToday;
      }
    });
  };

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMetricsMode(button.dataset.metricsMode || 'overall'));
  });

  setMetricsMode(dashboardMetrics.dataset.dashboardMetrics || 'overall');
}

const parseSortableValue = (rawValue) => {
  const value = String(rawValue || '').trim();

  if (!value) {
    return { type: 'text', value: '' };
  }

  const dmyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const parsed = Date.UTC(Number(year), Number(month) - 1, Number(day));
    return { type: 'number', value: parsed };
  }

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const parsed = Date.UTC(Number(year), Number(month) - 1, Number(day));
    return { type: 'number', value: parsed };
  }

  const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/);
  if (timeMatch) {
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    return { type: 'number', value: hour * 60 + minute };
  }

  const numericCandidate = value
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  if (numericCandidate && !Number.isNaN(Number(numericCandidate))) {
    return { type: 'number', value: Number(numericCandidate) };
  }

  return { type: 'text', value: value.toLowerCase() };
};

const compareSortableValues = (left, right) => {
  if (left.type === 'number' && right.type === 'number') {
    return left.value - right.value;
  }

  return String(left.value).localeCompare(String(right.value), 'es', {
    sensitivity: 'base',
    numeric: true
  });
};

const setSortIndicators = (headers, activeHeader, direction) => {
  headers.forEach((header) => {
    const isActive = header === activeHeader;
    header.classList.toggle('sortable-active', isActive);
    header.dataset.sortDir = isActive ? direction : '';
    header.setAttribute('aria-sort', isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
  });
};

document.querySelectorAll('table').forEach((table) => {
  const headRow = table.querySelector('thead tr');
  const body = table.querySelector('tbody');
  if (!headRow || !body) return;

  const headers = Array.from(headRow.children).filter((cell) => cell.tagName === 'TH');
  if (!headers.length) return;

  headers.forEach((header, index) => {
    const normalizedHeader = header.textContent.trim().toLowerCase();
    if (normalizedHeader === 'acciones') {
      return;
    }

    header.classList.add('sortable-header');
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    header.setAttribute('aria-sort', 'none');

    let direction = 'asc';

    const sortByHeader = () => {
      const rows = Array.from(body.querySelectorAll('tr'));
      const sortableRows = rows
        .map((row, originalIndex) => ({ row, originalIndex }))
        .filter(({ row }) => row.children[index]);

      sortableRows.sort((left, right) => {
        const leftCell = left.row.children[index];
        const rightCell = right.row.children[index];
        const leftValue = parseSortableValue(leftCell ? leftCell.textContent : '');
        const rightValue = parseSortableValue(rightCell ? rightCell.textContent : '');
        const compared = compareSortableValues(leftValue, rightValue);

        if (compared !== 0) {
          return direction === 'asc' ? compared : -compared;
        }

        return left.originalIndex - right.originalIndex;
      });

      sortableRows.forEach(({ row }) => body.appendChild(row));
      setSortIndicators(headers, header, direction);
      direction = direction === 'asc' ? 'desc' : 'asc';
    };

    header.addEventListener('click', sortByHeader);
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        sortByHeader();
      }
    });
  });
});

/* ============================================================
   DROPDOWN DE ACCIONES EN TABLA — Smart Positioning
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* Referencia al menú actualmente abierto (movido al body) */
  var _activeMenu     = null;
  var _activeDropdown = null;
  var _activeToggle   = null;

  /* Cierra el dropdown activo y devuelve el menú a su lugar */
  function closeActive() {
    if (!_activeDropdown) return;
    _activeDropdown.classList.remove('is-open');
    if (_activeToggle) _activeToggle.setAttribute('aria-expanded', 'false');
    if (_activeMenu && _activeMenu._originalParent) {
      _activeMenu._originalParent.appendChild(_activeMenu);
      _activeMenu._originalParent = null;
    }
    if (_activeMenu) {
      _activeMenu.removeAttribute('style');
      _activeMenu.classList.remove('tbl-dropdown-menu--up');
    }
    _activeMenu     = null;
    _activeDropdown = null;
    _activeToggle   = null;
  }

  /* Calcula y aplica la posición del menú */
  function positionMenu(toggle, menu) {
    var rect  = toggle.getBoundingClientRect();
    var vw    = window.innerWidth;
    var vh    = window.innerHeight;
    var menuW = menu.offsetWidth  || 210;
    var menuH = menu.offsetHeight || 160;
    var gap   = 6;

    var spaceBelow = vh - rect.bottom - gap;
    var spaceAbove = rect.top - gap;
    var openUp     = spaceBelow < menuH && spaceAbove > spaceBelow;

    var top;
    if (openUp) {
      top = rect.top + window.scrollY - menuH - gap;
      menu.classList.add('tbl-dropdown-menu--up');
    } else {
      top = rect.bottom + window.scrollY + gap;
      menu.classList.remove('tbl-dropdown-menu--up');
    }

    var left = rect.right + window.scrollX - menuW;
    if (left < 8) left = 8;
    if (left + menuW > vw - 8) left = vw - menuW - 8;

    menu.style.position = 'absolute';
    menu.style.top      = top + 'px';
    menu.style.left     = left + 'px';
    menu.style.right    = 'auto';
    menu.style.zIndex   = '9000';
  }

  document.querySelectorAll('[data-dropdown]').forEach(function(dropdown) {
    var toggle = dropdown.querySelector('.tbl-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();

      /* Si este dropdown ya estaba abierto → cerrar y salir */
      if (_activeDropdown === dropdown) {
        closeActive();
        return;
      }

      /* Cerrar cualquier otro que estuviera abierto */
      closeActive();

      /* Abrir este */
      var menu = dropdown.querySelector('.tbl-dropdown-menu');
      if (!menu) return;

      dropdown.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');

      /* Medir dimensiones reales antes de posicionar */
      menu.style.visibility = 'hidden';
      menu.style.display    = 'flex';

      /* Mover al body para escapar de cualquier overflow */
      menu._originalParent = dropdown;
      document.body.appendChild(menu);

      positionMenu(toggle, menu);
      menu.style.visibility = '';

      _activeMenu     = menu;
      _activeDropdown = dropdown;
      _activeToggle   = toggle;
    });
  });

  /* Reposicionar al scroll/resize */
  function repositionActive() {
    if (_activeToggle && _activeMenu) positionMenu(_activeToggle, _activeMenu);
  }
  window.addEventListener('scroll', repositionActive, { passive: true });
  window.addEventListener('resize', repositionActive, { passive: true });

  /* Click fuera → cerrar */
  document.addEventListener('click', function(e) {
    if (!_activeMenu) return;
    /* Si el click fue dentro del menú (que está en el body), no cerrar */
    if (_activeMenu.contains(e.target)) return;
    closeActive();
  });

  /* Escape → cerrar */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeActive();
  });
});

/* ============================================================
   PERFIL DE USUARIO — DROPDOWN DEL TOPBAR
   ============================================================ */
(function() {
  var chip     = document.getElementById('profileChip');
  var dropdown = document.getElementById('profileDropdown');
  if (!chip || !dropdown) return;

  var isOpen = false;

  /* Mover el dropdown al body para escapar de cualquier stacking context */
  document.body.appendChild(dropdown);

  /* Calcula y aplica la posición fija del dropdown relativa al chip */
  function positionDropdown() {
    var rect  = chip.getBoundingClientRect();
    var ddW   = dropdown.offsetWidth  || 300;
    var vw    = window.innerWidth;

    var top  = rect.bottom + window.scrollY + 8;
    var left = rect.right  + window.scrollX - ddW;
    if (left < 8) left = 8;
    if (left + ddW > vw - 8) left = vw - ddW - 8;

    dropdown.style.position = 'absolute';
    dropdown.style.top      = top  + 'px';
    dropdown.style.left     = left + 'px';
    dropdown.style.right    = 'auto';
    dropdown.style.zIndex   = '99999';
  }

  function openProfile() {
    isOpen = true;
    chip.classList.add('is-open');
    chip.setAttribute('aria-expanded', 'true');

    /* Medir antes de animar */
    dropdown.style.visibility = 'hidden';
    dropdown.style.display    = 'block';
    positionDropdown();
    dropdown.style.visibility = '';

    dropdown.classList.add('is-open');
    requestAnimationFrame(function() {
      dropdown.style.opacity   = '1';
      dropdown.style.transform = 'scale(1) translateY(0)';
    });
  }

  function closeProfile() {
    isOpen = false;
    chip.classList.remove('is-open');
    chip.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
    dropdown.style.opacity   = '';
    dropdown.style.transform = '';
    dropdown.style.display   = '';
  }

  /* Reposicionar al scroll/resize */
  window.addEventListener('scroll', function() { if (isOpen) positionDropdown(); }, { passive: true });
  window.addEventListener('resize', function() { if (isOpen) positionDropdown(); }, { passive: true });

  /* Toggle */
  chip.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isOpen) closeProfile(); else openProfile();
  });

  /* Teclado */
  chip.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (isOpen) closeProfile(); else openProfile(); }
    if (e.key === 'Escape') closeProfile();
  });

  /* Click fuera */
  document.addEventListener('click', function(e) {
    if (!isOpen) return;
    if (!chip.contains(e.target) && !dropdown.contains(e.target)) closeProfile();
  });

  /* Escape global */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) closeProfile();
  });
})();