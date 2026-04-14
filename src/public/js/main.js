document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', () => {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Procesando...';
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