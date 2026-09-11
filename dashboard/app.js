// Dashboard Status Container (Soal 1 + Soal 3)
// Mengambil data container dari Docker API via proxy nginx.

const API_BASE = '';

const $ = (id) => document.getElementById(id);

// Label environment
const ENV_LABEL = 'com.project.env';
const UNKNOWN_ENV = 'unknown';

// Status bermasalah
const BROKEN_STATES = ['restarting', 'exited', 'dead'];

// Soal 3
const DESIRED_STATE = {
  service: 'api-gateway',
  expected_tag: 'v2.3.1'
};

const statusBadgeClass = (status) => {
  if (status.startsWith('up')) return 'st-running';
  if (status.startsWith('restarting')) return 'st-restarting';
  if (status === 'created') return 'st-created';
  return 'st-exited';
};

const envBadgeClass = (env) => `env-${env}`;

function setStatus(msg, busy) {
  const el = $('status');
  el.innerHTML = busy
    ? `<span class="spinner"></span> ${msg}`
    : msg;
}

function showError(msg) {
  const el = $('error');
  el.style.display = 'block';
  el.textContent = msg;
}

function groupByEnv(containers) {
  const groups = {};

  for (const c of containers) {
    const env = (c.Labels?.[ENV_LABEL]) || UNKNOWN_ENV;

    if (!groups[env]) {
      groups[env] = [];
    }

    groups[env].push(c);
  }

  return groups;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function renderCard(c) {
  const name = (c.Names?.[0]) || c.Id;
  const cleanName = name.replace(/^\//, '');

  const image = c.Image || 'n/a';
  const status = (c.Status || c.State || '').toLowerCase();
  const shortId = (c.Id || '').slice(0, 12);

  const broken = BROKEN_STATES.some((s) =>
    status.includes(s)
  );

  return `
    <div class="card ${broken ? 'broken' : ''}">
      <div class="card-head">
        <span class="name">
          ${escapeHtml(cleanName)}
        </span>

        <span class="status-badge ${statusBadgeClass(status)}">
          ${escapeHtml(c.Status || c.State || '?')}
        </span>
      </div>

      <div class="row">
        <span class="label">Image</span>
        <span class="value">${escapeHtml(image)}</span>
      </div>

      <div class="row">
        <span class="label">Container ID</span>
        <span class="value">${escapeHtml(shortId)}</span>
      </div>

      <div class="row">
        <span class="label">Created</span>
        <span class="value">${escapeHtml(c.CreatedAt || 'n/a')}</span>
      </div>
    </div>
  `;
}

function render(containers) {
  const groups = groupByEnv(containers);
  const host = $('groups');

  host.innerHTML = '';

  const envOrder = Object.keys(groups)
    .sort((a, b) => a.localeCompare(b));

  for (const env of envOrder) {
    const list = groups[env];

    const section = document.createElement('section');
    section.className = 'env-group';

    section.innerHTML = `
      <h2>
        <span class="env-badge ${envBadgeClass(env)}">
          ${escapeHtml(env)}
        </span>

        <span class="count">
          ${list.length}
        </span>
      </h2>

      <div class="card-grid">
        ${list.map(renderCard).join('')}
      </div>
    `;

    host.appendChild(section);
  }

  if (envOrder.length === 0) {
    host.innerHTML =
      '<div class="empty">Tidak ada container ditemukan.</div>';
  }
}

/*
 * SOAL 3
 * Membandingkan image/tag container yang berjalan
 * dengan desired-state.json.
 */
async function checkDeploymentVersion(containers) {
  const service = DESIRED_STATE.service;
  const expectedTag = DESIRED_STATE.expected_tag;

  const container = containers.find((c) => {
    const name = (c.Names?.[0] || '').replace(/^\//, '');

    return (
      name === `pe-support-test-${service}-1` ||
      name.includes(service)
    );
  });

  const result = $('version-check');

  if (!result) {
    return;
  }

  // Service tidak ditemukan
  if (!container) {
    result.innerHTML = `
      <div class="version-card mismatch">
        <div class="version-title">
          Deployment Version Check
        </div>

        <div class="version-service">
          ${escapeHtml(service)}
        </div>

        <div class="version-row">
          <span>Expected</span>
          <strong>${escapeHtml(expectedTag)}</strong>
        </div>

        <div class="version-status">
          SERVICE NOT RUNNING
        </div>
      </div>
    `;

    return;
  }

  const image = container.Image || '';

let actualTag = '';

if (image.includes(':')) {
  actualTag = image.substring(image.lastIndexOf(':') + 1);
}

// Jika Docker API mengembalikan image ID,
// ambil nama image sebenarnya melalui inspect container.
if (!actualTag || image.startsWith('sha256:')) {
  try {
    const inspectRes = await fetch(
      `${API_BASE}/containers/${container.Id}/json`
    );

    if (inspectRes.ok) {
      const detail = await inspectRes.json();

      const configuredImage =
        detail.Config?.Image || '';

      if (configuredImage.includes(':')) {
        actualTag =
          configuredImage.substring(
            configuredImage.lastIndexOf(':') + 1
          );
      }
    }
  } catch (err) {
    console.error(
      'Gagal mengambil detail image:',
      err
    );
  }
}

  const state = (container.State || '').toLowerCase();

  // Service ada tetapi tidak running
  if (state !== 'running') {
    result.innerHTML = `
      <div class="version-card mismatch">
        <div class="version-title">
          Deployment Version Check
        </div>

        <div class="version-service">
          ${escapeHtml(service)}
        </div>

        <div class="version-row">
          <span>Expected</span>
          <strong>${escapeHtml(expectedTag)}</strong>
        </div>

        <div class="version-row">
          <span>Running</span>
          <strong>${escapeHtml(actualTag || image)}</strong>
        </div>

        <div class="version-status">
          SERVICE NOT RUNNING
        </div>
      </div>
    `;

    return;
  }

  const isMatch = actualTag === expectedTag;

  result.innerHTML = `
    <div class="version-card ${isMatch ? 'match' : 'mismatch'}">

      <div class="version-title">
        Deployment Version Check
      </div>

      <div class="version-service">
        ${escapeHtml(service)}
      </div>

      <div class="version-row">
        <span>Expected</span>
        <strong>${escapeHtml(expectedTag)}</strong>
      </div>

      <div class="version-row">
        <span>Running</span>
        <strong>${escapeHtml(actualTag || image)}</strong>
      </div>

      <div class="version-status">
        ${isMatch ? 'MATCH' : 'MISMATCH'}
      </div>

    </div>
  `;
}

async function fetchContainers() {
  setStatus('Memuat data...', true);
  $('error').style.display = 'none';

  try {
    const res = await fetch(
      `${API_BASE}/containers/json?all=1`
    );

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText}`
      );
    }

    const containers = await res.json();

    // Soal 1
    render(containers);

    // Soal 3
    checkDeploymentVersion(containers);

    const total = containers.length;

    const broken = containers.filter((c) =>
      BROKEN_STATES.some((s) =>
        (c.Status || '').toLowerCase().includes(s)
      )
    ).length;

    setStatus(
      `${total} container · ${broken} bermasalah`,
      false
    );

  } catch (err) {
    showError(
      `Gagal mengambil data dari Docker API: ${err.message}`
    );

    setStatus('Gagal', false);
  }
}

document.addEventListener('DOMContentLoaded', () => {

  $('refresh').addEventListener(
    'click',
    fetchContainers
  );

  fetchContainers();

  setInterval(
    fetchContainers,
    5000
  );
});