'use strict';

const startButton = document.querySelector('#start-button');
const stopButton = document.querySelector('#stop-button');
const meterValue = document.querySelector('#meter-value');
const meterLabel = document.querySelector('#meter-level-label');
const meterIndicator = document.querySelector('#meter-indicator');
const meterTrack = document.querySelector('#meter-track');
const meterMessage = document.querySelector('#meter-message');
const liveStatus = document.querySelector('#live-status');
const localInput = document.querySelector('#local-input');
const historyList = document.querySelector('#history-list');

let audioContext = null;
let mediaStream = null;
let analyser = null;
let sourceNode = null;
let animationFrame = null;
let latestDbfs = null;
let isMeasuring = false;
/** fetch que já envia o token do login. Se expirou, volta pro login. */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Auth.token()}`,
      ...(options.headers || {})
    }
  });
  if (response.status === 401) {
    Auth.sair();
    throw new Error('Sessão expirada. Entre novamente.');
  }
  return response;
}

function classifySignal(dbfs) {
  if (dbfs > -25) return 'Sinal intenso';
  if (dbfs > -45) return 'Sinal moderado';
  return 'Sinal baixo';
}

function updateMeter(dbfs) {
  const safeDbfs = Math.max(-90, Math.min(0, dbfs));
  const percent = Math.max(0, Math.min(100, ((safeDbfs + 70) / 70) * 100));
  meterValue.textContent = `${Math.round(safeDbfs)}`;
  meterLabel.textContent = classifySignal(safeDbfs);
  meterIndicator.style.left = `calc(${percent}% - 1px)`;
  meterTrack.setAttribute('aria-valuenow', String(Math.round(percent)));
  latestDbfs = Math.round(safeDbfs * 10) / 10;
}

function setMessage(message) {
  meterMessage.textContent = message;
}

function startSampling() {
  if (!analyser || !audioContext || !isMeasuring) return;
  const samples = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(samples);
  let sumSquares = 0;
  for (const sample of samples) sumSquares += sample * sample;
  const rms = Math.sqrt(sumSquares / samples.length);
  const dbfs = rms > 0 ? 20 * Math.log10(rms) : -90;
  updateMeter(Number.isFinite(dbfs) ? dbfs : -90);
  animationFrame = requestAnimationFrame(startSampling);
}

async function startMeasurement() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setMessage('Este navegador não oferece captura de áudio neste contexto. Abra o site em localhost ou HTTPS e tente novamente.');
    return;
  }
  startButton.disabled = true;
  setMessage('Solicitando permissão para acessar o microfone…');
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    sourceNode.connect(analyser);
    isMeasuring = true;
    latestDbfs = null;
    startButton.disabled = true;
    stopButton.disabled = false;
    liveStatus.classList.add('is-active');
    liveStatus.querySelector('span').textContent = 'Medindo';
    setMessage('Medição em andamento. Fale ou produza um som próximo ao microfone para testar.');
    startSampling();
  } catch (error) {
    startButton.disabled = false;
    let message = 'Não foi possível iniciar a leitura. Verifique a permissão do microfone e tente novamente.';
    if (error && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) message = 'A permissão do microfone foi negada. Libere o acesso nas configurações do navegador para continuar.';
    if (error && error.name === 'NotFoundError') message = 'Nenhum microfone foi encontrado neste dispositivo.';
    setMessage(message);
  }
}

async function stopMeasurement() {
  
  if (!isMeasuring) return;
  isMeasuring = false;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  if (sourceNode) sourceNode.disconnect();
  if (audioContext && audioContext.state !== 'closed') await audioContext.close();
  mediaStream = null;
  sourceNode = null;
  analyser = null;
  audioContext = null;
  startButton.disabled = false;
  stopButton.disabled = true;
  liveStatus.classList.remove('is-active');
  liveStatus.querySelector('span').textContent = 'Desativado';

  if (latestDbfs === null) {
    setMessage('Medição encerrada sem uma leitura válida para salvar.');
    return;
  }

  const payload = {
    nivelDbfs: latestDbfs,
    classificacao: classifySignal(latestDbfs),
    local: localInput.value.trim() || 'Local não informado',
    origem: 'Microfone do navegador'
  };
  setMessage('Medição encerrada. Tentando registrar a leitura no servidor…');
  try {
      const response = await apiFetch('/api/leituras', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'O servidor não aceitou o registro.');
    setMessage('Leitura registrada no banco de dados.');
    await loadHistory();
  } catch (error) {
    setMessage('Leitura encerrada, mas não foi salva. Inicie o servidor Node.js e configure o MySQL conforme o README.');
  }
}
function badgeClass(classificacao) {
  if (classificacao === 'Sinal intenso') return 'is-intenso';
  if (classificacao === 'Sinal moderado') return 'is-moderado';
  if (classificacao === 'Sinal baixo') return 'is-baixo';
  return '';
}

function makeActionButton(label, extraClass, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `history-action ${extraClass}`.trim();
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function addHistoryRow(reading) {
  const row = document.createElement('div');
  row.className = 'history-row';
  const textBlock = document.createElement('div');
  const place = document.createElement('div');
  place.className = 'history-place';
  place.textContent = reading.local || 'Local não informado';
  const meta = document.createElement('div');
  meta.className = 'history-meta';
  const date = reading.criadoEm ? new Date(reading.criadoEm) : null;
  meta.textContent = `${date && !Number.isNaN(date.getTime()) ? date.toLocaleString('pt-BR') : 'Data indisponível'} · ${Number(reading.nivelDbfs).toFixed(1)} dBFS`;
  textBlock.append(place, meta);

  const side = document.createElement('div');
  side.className = 'history-side';
  const badge = document.createElement('span');
  badge.className = `history-badge ${badgeClass(reading.classificacao)}`.trim();
  badge.textContent = reading.classificacao || 'Leitura';
  const actions = document.createElement('div');
  actions.className = 'history-actions';
  actions.append(
    makeActionButton('Editar', '', () => startEdit(row, reading)),
    makeActionButton('Excluir', 'is-excluir', () => deleteReading(reading))
  );
  side.append(badge, actions);

  row.append(textBlock, side);
  return row;
}

function startEdit(row, reading) {
  row.replaceChildren();
  row.classList.add('is-editing');

  const form = document.createElement('form');
  form.className = 'history-edit';

  const localField = document.createElement('input');
  localField.type = 'text';
  localField.maxLength = 100;
  localField.value = reading.local || '';
  localField.placeholder = 'Local da leitura';
  localField.setAttribute('aria-label', 'Local da leitura');

  const levelField = document.createElement('input');
  levelField.type = 'number';
  levelField.step = '0.1';
  levelField.min = '-100';
  levelField.max = '0';
  levelField.value = reading.nivelDbfs;
  levelField.setAttribute('aria-label', 'Nível em dBFS');

  const buttons = document.createElement('div');
  buttons.className = 'history-actions';
  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'history-action is-save';
  save.textContent = 'Salvar';
  buttons.append(save, makeActionButton('Cancelar', '', () => loadHistory()));

  form.append(localField, levelField, buttons);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nivel = Number.parseFloat(levelField.value);
    if (!Number.isFinite(nivel)) {
      setMessage('Informe um nível válido entre -100 e 0 dBFS.');
      return;
    }
    await saveEdit(reading.id, {
      local: localField.value.trim() || 'Local não informado',
      nivelDbfs: nivel
    });
  });

  row.append(form);
  localField.focus();
}

async function saveEdit(id, dados) {
  setMessage('Salvando alterações…');
  try {
    const response = await apiFetch(`/api/leituras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar.');
    setMessage('Leitura atualizada.');
    await loadHistory();
  } catch (error) {
    setMessage(error.message);
  }
}

async function deleteReading(reading) {
  const nome = reading.local || 'esta leitura';
  if (!window.confirm(`Excluir a leitura de "${nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    const response = await apiFetch(`/api/leituras/${reading.id}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Não foi possível excluir.');
    setMessage('Leitura excluída.');
    await loadHistory();
  } catch (error) {
    setMessage(error.message);
  }
}

async function loadHistory() {
  try {
    const response = await apiFetch('/api/leituras?limit=6');
    if (!response.ok) throw new Error('Histórico indisponível');
    const result = await response.json();
    const readings = Array.isArray(result.leituras) ? result.leituras : [];
    historyList.replaceChildren();
    if (readings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'Nenhum registro salvo até o momento. Encerre uma medição para criar o primeiro registro.';
      historyList.append(empty);
      return;
    }
    readings.forEach((reading) => historyList.append(addHistoryRow(reading)));
  } catch (error) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'Histórico indisponível. Configure e inicie o servidor Node.js e o banco MySQL.';
    historyList.replaceChildren(empty);
  }
}

startButton.addEventListener('click', startMeasurement);
stopButton.addEventListener('click', stopMeasurement);
loadHistory();
