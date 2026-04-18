const form = document.getElementById('diagnosis-form');
const steps = Array.from(document.querySelectorAll('.form-step'));
const stepTags = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const formCard = document.getElementById('form-card');
const loadingCard = document.getElementById('loading-card');
const resultCard = document.getElementById('result-card');
const errorCard = document.getElementById('error-card');
const retryBtn = document.getElementById('retry-btn');
const restartBtn = document.getElementById('restart-btn');
const resultTitle = document.getElementById('result-title');
const resultBody = document.getElementById('result-body');
const maturityBadge = document.getElementById('maturity-badge');
const errorMessage = document.getElementById('error-message');
const canvas = document.getElementById('maturity-chart');
const ctx = canvas.getContext('2d');

let currentStep = 0;

function updateStep() {
  steps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
  stepTags.forEach((tag, index) => tag.classList.toggle('active', index === currentStep));
  prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  nextBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'inline-flex';
  submitBtn.style.display = currentStep === steps.length - 1 ? 'inline-flex' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
  const fields = Array.from(steps[currentStep].querySelectorAll('input, select, textarea'));
  return fields.every(field => {
    if (field.checkValidity()) return true;
    field.reportValidity();
    return false;
  });
}

nextBtn.addEventListener('click', () => {
  if (!validateCurrentStep()) return;
  currentStep += 1;
  updateStep();
});

prevBtn.addEventListener('click', () => {
  if (currentStep === 0) return;
  currentStep -= 1;
  updateStep();
});

retryBtn.addEventListener('click', () => {
  errorCard.classList.add('hidden');
  formCard.classList.remove('hidden');
});

restartBtn.addEventListener('click', () => {
  resultCard.classList.add('hidden');
  formCard.classList.remove('hidden');
  form.reset();
  currentStep = 0;
  updateStep();
});

function formToPayload(formElement) {
  const data = new FormData(formElement);
  return Object.fromEntries(data.entries());
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function markdownishToHtml(text) {
  return escapeHtml(text)
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^\-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<h3>|<ul>|<li>)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<ul>\s*<ul>/g, '<ul>')
    .replace(/<\/ul>\s*<\/ul>/g, '</ul>');
}

function setBadge(level) {
  maturityBadge.textContent = level || '—';
  maturityBadge.className = 'badge';
  const normalized = (level || '').toLowerCase();
  if (normalized.includes('alta')) maturityBadge.classList.add('alta');
  else if (normalized.includes('media')) maturityBadge.classList.add('media');
  else if (normalized.includes('baja')) maturityBadge.classList.add('baja');
}

function drawChart(scores) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const labels = ['Conexión', 'Detección', 'Solución', 'Cierre'];
  const values = [scores.conexion, scores.deteccion, scores.solucion, scores.cierre];
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;
  const chartHeight = height - 70;
  const barWidth = 90;
  const gap = 36;
  const startX = padding;

  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#5c6b82';
  ctx.strokeStyle = '#d7dfeb';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.fillText(String(4 - i), 10, y + 4);
  }

  values.forEach((value, index) => {
    const x = startX + index * (barWidth + gap) + 24;
    const h = Math.max(8, (value / 4) * chartHeight);
    const y = padding + chartHeight - h;

    ctx.fillStyle = '#2357e3';
    ctx.fillRect(x, y, barWidth, h);
    ctx.fillStyle = '#142033';
    ctx.fillText(labels[index], x, height - 20);
    ctx.fillText(String(value.toFixed(1)), x + 32, y - 8);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  formCard.classList.add('hidden');
  resultCard.classList.add('hidden');
  errorCard.classList.add('hidden');
  loadingCard.classList.remove('hidden');

  const payload = formToPayload(form);

  try {
    const response = await fetch('/.netlify/functions/generate-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo generar el diagnóstico.');
    }

    loadingCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    resultTitle.textContent = `Resultado para ${payload.empresa}`;
    setBadge(data.maturityLevel);
    resultBody.innerHTML = markdownishToHtml(data.diagnosis);
    drawChart(data.scores);
  } catch (error) {
    loadingCard.classList.add('hidden');
    errorCard.classList.remove('hidden');
    errorMessage.textContent = error.message || 'Ocurrió un error inesperado.';
  }
});

updateStep();
