document.addEventListener('DOMContentLoaded', () => {
  const t = localStorage.getItem('token');
  if (!t) return location.replace('login.html');
  const H = { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' };

  window.logout = function(){ localStorage.removeItem('token'); location.replace('login.html'); };

  const $ = (s, root=document)=>root.querySelector(s);
  const $all = (s, root=document)=>Array.from(root.querySelectorAll(s));

  async function listar(){
    try{
      const r = await fetch('http://localhost:3001/api/empresas/list',{headers:H});
      const {items=[]} = await r.json();
      render(items);
    }catch(e){ console.error(e); }
  }
  async function buscar(){
    try{
      const q = $('#q')?.value.trim() || '';
      const s = $('#status')?.value || '';
      const url = new URL('http://localhost:3001/api/empresas/search');
      url.searchParams.set('q', q);
      url.searchParams.set('status', s);
      const r = await fetch(url, {headers:H});
      const {items=[]} = await r.json();
      render(items);
    }catch(e){ console.error(e); }
  }
  function render(items){
    const tb = $('#tabela tbody');
    if (!tb) return;
    tb.innerHTML = '';
    (items||[]).forEach(i=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.id}</td>
        <td>${i.fantasy_name||''}</td>
        <td>${i.cnpj||''}</td>
        <td>${i.city||''}</td>
        <td>${i.state||''}</td>
        <td>${i.sector||''}</td>
        <td>${i.status||''}</td>
        <td>${i.updated_at ? new Date(i.updated_at).toLocaleString('pt-BR') : ''}</td>
      `;
      tb.appendChild(tr);
    });
    if (!tb.children.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="8">—</td>`;
      tb.appendChild(tr);
    }
  }

  // Alternância lista <-> form
  const listaWrap = $('#listaWrap');
  const formWrap  = $('#formWrap');
  const btnNova   = $('#btnNovaEmpresa');
  const btnVoltar = $('#btnVoltarLista');
  const btnListar = $('#btnListar');
  const btnBuscar = $('#btnBuscar');
  const cancelar  = $('#cancelarForm');

  btnListar?.addEventListener('click', listar);
  btnBuscar?.addEventListener('click', buscar);

  btnNova?.addEventListener('click', ()=>{
    if (!formWrap || !listaWrap) return;
    listaWrap.style.display = 'none';
    formWrap.style.display  = '';
    btnVoltar.style.display = '';
    window.scrollTo({ top: formWrap.offsetTop - 16, behavior: 'smooth' });
  });

  btnVoltar?.addEventListener('click', ()=>{
    if (!formWrap || !listaWrap) return;
    formWrap.style.display  = 'none';
    listaWrap.style.display = '';
    btnVoltar.style.display = 'none';
  });

  cancelar?.addEventListener('click', ()=>{
    formWrap?.reset?.();
    $('#signatureData').value = '';
    clearSignature();
    formWrap.style.display  = 'none';
    listaWrap.style.display = '';
    btnVoltar.style.display = 'none';
  });

  // Sócios
  const socioList = $('#socioList');
  $('#addPartner')?.addEventListener('click', ()=>{
    const idx = $all('.rep-item', socioList).length;
    const div = document.createElement('div');
    div.className = 'rep-item';
    div.innerHTML = `
      <label>Nome <input name="partners[${idx}].name"></label>
      <label>CPF <input name="partners[${idx}].cpf" placeholder="000.000.000-00"></label>
      <button type="button" class="ghost danger remove">Remover</button>
    `;
    socioList.appendChild(div);
  });
  socioList?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.remove');
    if (!btn) return;
    const item = btn.closest('.rep-item');
    if (item && $all('.rep-item', socioList).length > 1) item.remove();
  });

  // Assinatura (canvas)
  const sigCanvas = $('#sigCanvas');
  const sigClear  = $('#sigClear');
  const sigData   = $('#signatureData');
  let drawing=false, ctx=null, prev=null;

  function getPos(e){
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  function startDraw(e){ drawing = true; prev = getPos(e); }
  function moveDraw(e){
    if (!drawing) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    prev = p;
  }
  function endDraw(){ drawing = false; prev = null; sigData.value = sigCanvas.toDataURL('image/png'); }
  function clearSignature(){ if (!ctx) return; ctx.clearRect(0,0,sigCanvas.width, sigCanvas.height); sigData.value = ''; }

  function setupSignature(){
    if (!sigCanvas) return;
    ctx = sigCanvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';

    sigCanvas.addEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    sigCanvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); startDraw(e); }, {passive:false});
    sigCanvas.addEventListener('touchmove',  (e)=>{ e.preventDefault(); moveDraw(e); }, {passive:false});
    sigCanvas.addEventListener('touchend',   (e)=>{ e.preventDefault(); endDraw(e); }, {passive:false});

    sigClear?.addEventListener('click', clearSignature);
  }
  setupSignature();

  // Salvar
  const formWrapEl = $('#formWrap');
  formWrapEl?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      const payload = formToJSON(formWrapEl);
      if (payload.cnpj) payload.cnpj = payload.cnpj.replace(/\D/g,'');
      if (payload.zip)  payload.zip  = payload.zip.replace(/\D/g,'');
      const r = await fetch('http://localhost:3001/api/empresas', {
        method: 'POST',
        headers: H,
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('Falha ao salvar empresa');
      formWrapEl.reset();
      clearSignature();
      formWrapEl.style.display  = 'none';
      $('#listaWrap').style.display = '';
      $('#btnVoltarLista').style.display = 'none';
      await listar();
    }catch(err){
      console.error(err);
      alert('Não foi possível salvar. Verifique os dados e tente novamente.');
    }
  });

  function formToJSON(form){
    const data = new FormData(form);
    const obj = {};
    for (const [k,v] of data.entries()){ setDeep(obj, k, v); }
    // checkboxes
    $all('input[type="checkbox"]', form).forEach(chk=>{
      const name = chk.name;
      if (!name) return;
      setDeep(obj, name, chk.checked);
    });
    // números
    if (obj.value != null) obj.value = Number(obj.value || 0);
    if (obj.employees_qty != null) obj.employees_qty = Number(obj.employees_qty || 0);
    if (obj.commission_rate != null && obj.commission_rate !== '')
      obj.commission_rate = Number(obj.commission_rate)/100;
    return obj;
  }
  function setDeep(obj, path, value){
    const parts = path.replace(/\]/g,'').split(/\.|\[/g);
    let cur = obj;
    parts.forEach((p,i)=>{
      if (i === parts.length-1){ cur[p] = value; }
      else { cur[p] = cur[p] || (isFinite(parts[i+1]) ? [] : {}); cur = cur[p]; }
    });
  }

  listar();
});
