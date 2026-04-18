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
const chartContainer = document.getElementById('maturity-chart');

let currentStep = 0;

function updateStep() {
  steps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
  stepTags.forEach((tag, index) => tag.classList.toggle('active', index === currentStep));
  prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  nextBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'inline-flex';
  submitBtn.style.display = currentStep === steps.length - 1 ? 'inline-flex' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initChoiceGroups() {
  document.querySelectorAll('.choice-grid').forEach((grid) => {
    const hiddenInput = grid.parentElement.querySelector(`input[name="${grid.dataset.name}"]`);
    const cards = Array.from(grid.querySelectorAll('.choice-card'));

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((btn) => btn.classList.remove('selected'));
        card.classList.add('selected');
        hiddenInput.value = card.dataset.value;
      });
    });
  });
}

function validateCurrentStep() {
  const current = steps[currentStep];
  const fields = Array.from(current.querySelectorAll('input, textarea'));

  for (const field of fields) {
    if (field.type === 'hidden' && !field.value) {
      const title = field.closest('label, .question-block')?.querySelector('.question-title, span')?.textContent || 'Selecciona una opción.';
      alert(`Falta completar este punto:\n\n${title}`);
      return false;
    }

    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
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
  errorCard.classList.add('hidden');
  formCard.classList.remove('hidden');
  form.reset();
  document.querySelectorAll('.choice-card.selected').forEach((card) => card.classList.remove('selected'));
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

function markdownToSections(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('## ')) {
      current = { title: line.replace(/^##\s+/, ''), content: [] };
      sections.push(current);
    } else if (line.startsWith('### ')) {
      current?.content.push({ type: 'subheading', value: line.replace(/^###\s+/, '') });
    } else if (line.startsWith('- ')) {
      current?.content.push({ type: 'bullet', value: line.replace(/^-\s+/, '') });
    } else if (/^\d+\.\s+/.test(line)) {
      current?.content.push({ type: 'numbered', value: line.replace(/^\d+\.\s+/, '') });
    } else {
      current?.content.push({ type: 'paragraph', value: line });
    }
  }

  return sections;
}

function applyInlineFormatting(text) {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function renderDiagnosis(markdown) {
  const sections = markdownToSections(markdown);

  return sections.map((section) => {
    const items = [];
    let bulletBuffer = [];

    function flushBullets() {
      if (bulletBuffer.length) {
        items.push(`<ul>${bulletBuffer.map((item) => `<li>${applyInlineFormatting(item)}</li>`).join('')}</ul>`);
        bulletBuffer = [];
      }
    }

    section.content.forEach((item) => {
      if (item.type === 'bullet') {
        bulletBuffer.push(item.value);
        return;
      }

      flushBullets();

      if (item.type === 'subheading') items.push(`<h4>${applyInlineFormatting(item.value)}</h4>`);
      else if (item.type === 'numbered') items.push(`<p class="numbered-item">${applyInlineFormatting(item.value)}</p>`);
      else items.push(`<p>${applyInlineFormatting(item.value)}</p>`);
    });

    flushBullets();

    return `
      <article class="result-section">
        <h3>${applyInlineFormatting(section.title)}</h3>
        ${items.join('')}
      </article>
    `;
  }).join('');
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
  const items = [
    { label: 'Conexión', value: scores.conexion, color: '#2563eb' },
    { label: 'Detección', value: scores.deteccion, color: '#7c3aed' },
    { label: 'Solución', value: scores.solucion, color: '#0f766e' },
    { label: 'Cierre', value: scores.cierre, color: '#ea580c' },
  ];

  const max = 4;
  chartContainer.innerHTML = items.map((item) => {
    const percentage = Math.max(8, (item.value / max) * 100);
    return `
      <div class="bar-row">
        <div class="bar-head">
          <span>${item.label}</span>
          <strong>${item.value.toFixed(1)}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${percentage}%; background:${item.color}"></div>
        </div>
      </div>
    `;
  }).join('');
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
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo generar el diagnóstico.');
    }

    loadingCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    resultTitle.textContent = `Resultado para ${payload.empresa}`;
    setBadge(data.maturityLevel);
    resultBody.innerHTML = renderDiagnosis(data.diagnosis);
    drawChart(data.scores);
  } catch (error) {
    loadingCard.classList.add('hidden');
    errorCard.classList.remove('hidden');
    errorMessage.textContent = error.message || 'Ocurrió un error inesperado. Vuelve a intentarlo.';
  }
});

initChoiceGroups();
updateStep();
