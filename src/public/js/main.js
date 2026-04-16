document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (form.dataset.confirm && form.dataset.confirmed !== 'true') {
      const accepted = window.confirm(form.dataset.confirm);
      if (!accepted) {
        event.preventDefault();
        return;
      }

      form.dataset.confirmed = 'true';
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