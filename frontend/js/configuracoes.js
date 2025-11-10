(function(){
  const token = localStorage.getItem('token');
  if (!token) return location.replace('login.html');
  const H = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  window.logout = function(){ localStorage.removeItem('token'); location.replace('login.html'); };

  // ======= Helpers =======
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const BRL = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });

  // ======= Design / Tema =======
  const themeSelect = $('#themeSelect');
  const primaryColor = $('#primaryColor');
  const saveDesign = $('#saveDesign');
  const resetDesign = $('#resetDesign');

  // Aplica tema no <html> de acordo com preference
  function applyTheme(pref){
    const root = document.documentElement;
    // remove classe light sempre, depois decide
    root.classList.remove('light');
    if (pref === 'light'){
      root.classList.add('light');
    } else if (pref === 'dark'){
      // nada (usa :root escuro do base.css)
    } else { // system
      // segue mídia do SO: prefere escuro?
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.remove('light'); else root.classList.add('light');
    }
  }
  // Aplica cor primária atualizando a var CSS
  function applyPrimary(hex){
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    document.documentElement.style.setProperty('--primary', hex);
  }

  async function loadSettings(){
    try{
      const r = await fetch('http://localhost:3001/api/settings', { headers: H });
      const data = await r.json();
      // Ex.: { theme_preference:'system'|'light'|'dark', primary:'#4f86ff' }
      if (data.theme_preference) themeSelect.value = data.theme_preference;
      if (data.primary) primaryColor.value = data.primary;
      applyTheme(themeSelect.value);
      applyPrimary(primaryColor.value);
    }catch(e){
      // fallback: pega do localStorage
      const lsTheme = localStorage.getItem('pref_theme') || 'system';
      const lsPrimary = localStorage.getItem('pref_primary') || '#4f86ff';
      themeSelect.value = lsTheme;
      primaryColor.value = lsPrimary;
      applyTheme(lsTheme);
      applyPrimary(lsPrimary);
    }
  }

  saveDesign?.addEventListener('click', async ()=>{
    const payload = {
      theme_preference: themeSelect.value,
      primary: primaryColor.value
    };
    try{
      // salva no backend
      await fetch('http://localhost:3001/api/settings', {
        method: 'PUT', headers: H, body: JSON.stringify(payload)
      });
    }catch(e){
      // fallback local
      console.warn('API settings indisponível, salvando localStorage');
      localStorage.setItem('pref_theme', payload.theme_preference);
      localStorage.setItem('pref_primary', payload.primary);
    }finally{
      applyTheme(payload.theme_preference);
      applyPrimary(payload.primary);
    }
  });

  resetDesign?.addEventListener('click', ()=>{
    themeSelect.value = 'system';
    primaryColor.value = '#4f86ff';
    applyTheme('system');
    applyPrimary('#4f86ff');
  });

  // Mudanças com preview ao vivo
  themeSelect?.addEventListener('change', ()=>applyTheme(themeSelect.value));
  primaryColor?.addEventListener('input', ()=>applyPrimary(primaryColor.value));

  // ======= CRUD de Usuários =======
  const usersTableBody = document.querySelector('#usersTable tbody');
  const form = $('#userForm');
  const userId = $('#userId');
  const userName = $('#userName');
  const userEmail = $('#userEmail');
  const userRole = $('#userRole');
  const userTheme = $('#userTheme');
  const cancelEdit = $('#cancelEdit');

  function renderUsers(users){
    usersTableBody.innerHTML = '';
    if (!users?.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="8">Nenhum usuário encontrado.</td>`;
      usersTableBody.appendChild(tr);
      return;
    }
    users.forEach(u=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.theme_preference || 'system'}</td>
        <td>${u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '—'}</td>
        <td>${u.updated_at ? new Date(u.updated_at).toLocaleString('pt-BR') : '—'}</td>
        <td>
          <div class="actions-inline">
            <button class="ghost edit">Editar</button>
            <button class="ghost danger del">Excluir</button>
          </div>
        </td>
      `;
      // editar
      tr.querySelector('.edit')?.addEventListener('click', ()=>{
        userId.value = u.id;
        userName.value = u.name;
        userEmail.value = u.email;
        userRole.value = u.role;
        userTheme.value = u.theme_preference || 'system';
        cancelEdit.style.display = '';
        window.scrollTo({ top: form.offsetTop - 16, behavior:'smooth' });
      });
      // excluir
      tr.querySelector('.del')?.addEventListener('click', async ()=>{
        if (!confirm(`Excluir o usuário "${u.name}"?`)) return;
        try{
          const res = await fetch(`http://localhost:3001/api/users/${u.id}`, {
            method: 'DELETE', headers: H
          });
          if (!res.ok) throw new Error('Falha ao excluir');
          await loadUsers();
        }catch(e){
          console.error(e);
          alert('Não foi possível excluir o usuário.');
        }
      });

      usersTableBody.appendChild(tr);
    });
  }

  async function loadUsers(){
    try{
      const r = await fetch('http://localhost:3001/api/users', { headers: H });
      const { items=[] } = await r.json();
      renderUsers(items);
    }catch(e){
      console.error(e);
      usersTableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar.</td></tr>`;
    }
  }

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      name: userName.value.trim(),
      email: userEmail.value.trim(),
      role: userRole.value,
      theme_preference: userTheme.value
    };
    if (!payload.name || !payload.email) return alert('Preencha nome e e-mail.');

    try{
      if (userId.value){ // update
        const res = await fetch(`http://localhost:3001/api/users/${userId.value}`, {
          method: 'PUT', headers: H, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falha ao atualizar');
      } else { // create
        const res = await fetch('http://localhost:3001/api/users', {
          method: 'POST', headers: H, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falha ao criar');
      }
      form.reset();
      userId.value = '';
      cancelEdit.style.display = 'none';
      await loadUsers();
    }catch(err){
      console.error(err);
      alert('Não foi possível salvar o usuário.');
    }
  });

  cancelEdit?.addEventListener('click', ()=>{
    form.reset();
    userId.value = '';
    cancelEdit.style.display = 'none';
  });

  // ======= Inicialização =======
  (async function init(){
    await loadSettings();
    await loadUsers();
  })();
})();
