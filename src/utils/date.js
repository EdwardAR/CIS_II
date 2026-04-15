function getDayOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.getDay();
}

function addMinutesToTime(time, minutesToAdd) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatIsoDateToDmy(value) {
  if (!value || typeof value !== 'string') return value;

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return `${day}-${month}-${year}`;
}

module.exports = { getDayOfWeek, addMinutesToTime, formatIsoDateToDmy };