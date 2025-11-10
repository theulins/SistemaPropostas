(function () {
  const token = localStorage.getItem('token');
  if (!token) {
    const u = document.getElementById('kpiUsers');
    const c = document.getElementById('kpiCompanies');
    if (u) u.textContent = '—';
    if (c) c.textContent = '—';
    // não redireciona automaticamente para permitir ver a UI
    return;
  }

  const H = { 'Authorization': 'Bearer ' + token };

  // ===== Helpers =====
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // ===== Resumo básico =====
  fetch('http://localhost:3001/api/dashboard/summary', { headers: H })
    .then(r => r.json())
    .then(d => {
      const kpiUsers = document.getElementById('kpiUsers');
      const kpiCompanies = document.getElementById('kpiCompanies');
      if (kpiUsers) kpiUsers.textContent = d.totalUsers ?? '—';
      if (kpiCompanies) kpiCompanies.textContent = d.totalCompanies ?? '—';

      const ul = document.getElementById('recentList');
      if (ul) {
        ul.innerHTML = '';
        (d.recent || []).forEach(x => {
          const li = document.createElement('li');
          const when = x.updated_at ? new Date(x.updated_at).toLocaleString('pt-BR') : '—';
          li.textContent = `${x.fantasy_name} • ${x.updated_by_name || '—'} • ${when}`;
          ul.appendChild(li);
        });
        if (!ul.children.length) ul.innerHTML = '<li class="muted">—</li>';
      }
    })
    .catch(console.error);

  // ===== Comissões (card mensal) =====
  const monthEl = document.getElementById('commissionMonth');
  const rateEl = document.getElementById('commissionRate');
  const rateWrap = document.getElementById('rateWrap');
  const applyBtn = document.getElementById('commissionApply');
  const baseEl = document.getElementById('commissionBase');
  const totalEl = document.getElementById('commissionTotal');
  const hintEl = document.getElementById('commissionHint');

  if (monthEl && applyBtn && baseEl && totalEl && hintEl) {
    // mês atual (YYYY-MM)
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthEl.value = ym;

    async function loadCommissionCard() {
      try {
        const month = monthEl.value || ym;
        const url = new URL('http://localhost:3001/api/dashboard/commissions');
        // backend deve aceitar ?month=YYYY-MM (use approved_at dentro do mês)
        url.searchParams.set('month', month);

        const r = await fetch(url, { headers: H });
        if (!r.ok) throw new Error('Falha ao carregar comissões');
        const data = await r.json();

        const base = Number(data.totalValue || 0);

        // Se vier defaultRate do backend, usamos; senão mostramos input manual
        let rate = (typeof data.defaultRate === 'number') ? data.defaultRate : null;
        if (rate === null) {
          rateWrap.style.display = '';
          rate = Math.max(0, Number(rateEl.value || 0)) / 100;
        } else {
          rateWrap.style.display = 'none';
          rateEl.value = (rate * 100).toFixed(2);
        }

        baseEl.textContent = BRL.format(base);
        const commission = base * rate;
        totalEl.textContent = BRL.format(commission);
        hintEl.textContent = `Taxa aplicada: ${(rate * 100).toFixed(2)}% • Mês: ${month}`;
      } catch (e) {
        console.error(e);
        baseEl.textContent = '—';
        totalEl.textContent = '—';
        hintEl.textContent = 'Não foi possível carregar';
      }
    }

    applyBtn.addEventListener('click', loadCommissionCard);
    monthEl.addEventListener('change', loadCommissionCard);
    loadCommissionCard();
  }
})();

function logout() {
  localStorage.removeItem('token');
  location.replace('login.html');
}
