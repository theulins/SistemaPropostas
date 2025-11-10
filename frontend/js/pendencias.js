(function () {
  const token = localStorage.getItem('token');
  if (!token) return location.replace('login.html');
  const H = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  window.logout = function(){ localStorage.removeItem('token'); location.replace('login.html'); };

  const $ = (s, r=document)=>r.querySelector(s);
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const qEl = $('#q');
  const statusEl = $('#status');
  const btnBuscar = $('#btnBuscar');
  const btnRecentes = $('#btnRecentes');
  const tbody = document.querySelector('#tblPendencias tbody');

  btnBuscar?.addEventListener('click', buscar);
  btnRecentes?.addEventListener('click', listarRecentes);

  function n(v, def=0) {
    const x = Number(v);
    return Number.isFinite(x) ? x : def;
  }

  function linhaPendencia(row){
    const tr = document.createElement('tr');

    const valor = n(row.value, 0);
    const taxaPct = typeof row.commission_rate === 'number' ? (row.commission_rate*100).toFixed(2) : (row.commission_rate ?? '');
    const due = (row.due_date || '').slice(0,10);

    tr.innerHTML = `
      <td>
        <div style="font-weight:700">${row.fantasy_name || row.corporate_name || '—'}</div>
        <div style="opacity:.7">ID #${row.id}</div>
      </td>
      <td>${row.cnpj || '—'}</td>
      <td>${(row.city||'—')}/${(row.state||'')}</td>
      <td>${row.plan_type || '—'}</td>
      <td class="right">
        <input type="number" step="0.01" min="0" value="${valor}" class="cell">
      </td>
      <td class="right">
        <input type="number" step="0.01" min="0" value="${taxaPct}" class="cell rate">
      </td>
      <td class="right">
        <span class="commission">${BRL.format(valor * (n(taxaPct)/100))}</span>
      </td>
      <td>
        <input type="date" value="${due}" class="cell">
      </td>
      <td>
        <div class="actions">
          <button class="primary approve">Aprovar</button>
          <button class="ghost danger reject">Reprovar</button>
        </div>
      </td>
    `;

    const inputs = tr.querySelectorAll('input.cell');
    const rateEl = tr.querySelector('.rate');
    const commEl = tr.querySelector('.commission');

    function recalc(){
      const v = n(inputs[0]?.value, 0);
      const p = n(rateEl?.value, 0)/100;
      commEl.textContent = BRL.format(v * p);
    }
    inputs.forEach(i => i.addEventListener('input', recalc));
    rateEl?.addEventListener('input', recalc);

    tr.querySelector('.approve')?.addEventListener('click', async ()=>{
      const payload = {
        company_id: row.id,
        // como é aprovação de CADASTRO, plan_type pode não existir ainda — enviamos se houver
        plan_type: row.plan_type || null,
        value: n(inputs[0]?.value, 0),
        commission_rate: n(rateEl?.value, 0) / 100,   // % -> fração
        due_date: inputs[2]?.value || null
      };
      if (!payload.value){
        return alert('Informe o Valor (R$) para aprovar a empresa no cadastro.');
      }
      try{
        // pendências de CADASTRO:
        // use um destes endpoints no backend:
        // POST /api/empresas/pending/approve  (recomendado)
        // ou   /api/pendencias/approve        (se você já criou assim)
        const res = await fetch('http://localhost:3001/api/empresas/pending/approve', {
          method: 'POST',
          headers: H,
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falha ao aprovar');
        tr.remove();
        if (!tbody.children.length){
          const t = document.createElement('tr');
          t.innerHTML = `<td colspan="9">Sem pendências.</td>`;
          tbody.appendChild(t);
        }
      }catch(e){
        console.error(e);
        alert('Não foi possível aprovar. Verifique os dados e tente novamente.');
      }
    });

    tr.querySelector('.reject')?.addEventListener('click', async ()=>{
      const reason = prompt('Motivo da reprovação (opcional):') || '';
      try{
        // idem observação do approve para o endpoint
        const res = await fetch('http://localhost:3001/api/empresas/pending/reject', {
          method: 'POST',
          headers: H,
          body: JSON.stringify({ company_id: row.id, reason })
        });
        if (!res.ok) throw new Error('Falha ao reprovar');
        tr.remove();
        if (!tbody.children.length){
          const t = document.createElement('tr');
          t.innerHTML = `<td colspan="9">Sem pendências.</td>`;
          tbody.appendChild(t);
        }
      }catch(e){
        console.error(e);
        alert('Não foi possível reprovar.');
      }
    });

    return tr;
  }

  function render(items){
    tbody.innerHTML = '';
    if (!items?.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9">Sem pendências.</td>`;
      tbody.appendChild(tr);
      return;
    }
    items.forEach(row => tbody.appendChild(linhaPendencia(row)));
  }

  async function listarRecentes(){
    try{
      // pendentes de CADASTRO
      // GET /api/empresas/pending  (recomendado)
      // ou  /api/pendencias/list   (se preferir manter o prefixo)
      const r = await fetch('http://localhost:3001/api/empresas/pending', { headers: H });
      const { items=[] } = await r.json();
      render(items);
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="9">Erro ao carregar.</td></tr>`;
    }
  }

  async function buscar(){
    try{
      const url = new URL('http://localhost:3001/api/empresas/pending/search');
      url.searchParams.set('q', (qEl?.value || '').trim());
      url.searchParams.set('status', statusEl?.value || 'pendente');
      const r = await fetch(url, { headers: H });
      const { items=[] } = await r.json();
      render(items);
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="9">Erro na busca.</td></tr>`;
    }
  }

  // inicial
  listarRecentes();
})();
    