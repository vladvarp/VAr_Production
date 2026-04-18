function getFilesFromJson(dir) {
  if (!dir.children) return [];
  return dir.children.filter(c => c.type === 'file' && /\.(png|jpg|jpeg)$/i.test(c.name)).map(c => c.name);
}

function getSubfolders(dir) {
  if (!dir.children) return [];
  return dir.children.filter(c => c.type === 'directory');
}

function getDisplayName(item) {
  return item.first_name && item.first_name.trim() ? item.first_name : item.name;
}

function getSectionUrl(name) {
  return '#' + name;
}

function renderSectionList(data) {
  let sections = (data.children || []).filter(item => item.type === 'directory');
  
  sections.sort((a, b) => {
    const posA = parseInt(a.position) || 999;
    const posB = parseInt(b.position) || 999;
    return posA - posB;
  });
  
  const container = document.getElementById('portfolio-sections');
  let html = '';
  
  sections.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const name = getDisplayName(item);
    const files = getFilesFromJson(item);
    const subfolders = getSubfolders(item);
    const totalFiles = files.length + subfolders.reduce((sum, sf) => sum + getFilesFromJson(sf).length, 0);
    
    html += `<a href="${getSectionUrl(item.name)}" class="section-link">
      <div class="section-card">
        <div class="section-card-num">${num}</div>
        <div class="section-card-title">${name}</div>
        <div class="section-card-desc">${totalFiles} изображений</div>
      </div>
    </a>`;
  });
  
  container.innerHTML = html;
}

function renderSection(data, sectionName) {
  const section = data.children?.find(c => c.name === sectionName);
  if (!section) {
    window.location.hash = '';
    return;
  }
  
  const name = getDisplayName(section);
  const files = getFilesFromJson(section);
  const subfolders = getSubfolders(section);
  
  let filesHtml = '';
  if (files.length) {
    filesHtml = files.slice(0, 30).map(f => `
<div class="pitem">
  <img src="source/portfolio/${section.name}/${f}" alt="${f}" loading="lazy" onerror="this.parentElement.style.display='none'">
</div>`).join('');
  }
  
  let subfoldersHtml = '';
  if (subfolders.length) {
    subfoldersHtml = '<div class="subfolder-grid"><span class="subfolder-title">Проекты</span>';
    subfolders.forEach(sf => {
      const sfName = getDisplayName(sf);
      const sfFiles = getFilesFromJson(sf);
      subfoldersHtml += `<span class="folder-chip" onclick="loadSubfolder('${section.name}', '${sf.name}', this)">${sfName} (${sfFiles.length})</span>`;
    });
    subfoldersHtml += '</div>';
  }
  
  const container = document.getElementById('portfolio-sections');
  container.innerHTML = `
    <a href="#" class="back-link">
      <svg viewBox="0 0 12 8"><polyline points="1,1 6,7 11,1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      К портфолио
    </a>
    <div class="masthead" style="margin-bottom: 24px;">
      <div class="masthead-title">${name}</div>
    </div>
    <div class="pgrid">${filesHtml}</div>
    ${subfoldersHtml}
    ${!files.length && !subfolders.length ? '<p class="pitem-load">Нет изображений</p>' : ''}
  `;
}

function loadSubfolder(dirName, subfolderName, chip) {
  const wrapper = document.querySelector('.pgrid');
  if (wrapper) wrapper.innerHTML = '<p class="pitem-load">Загрузка...</p>';
  
  if (typeof portfolioData === 'undefined') return;
  
  const dir = portfolioData.children?.find(c => c.name === dirName);
  const subfolder = dir?.children?.find(c => c.name === subfolderName);
  if (!subfolder) return;
  
  const files = getFilesFromJson(subfolder);
  const pitems = files.slice(0, 30).map(f => `
<div class="pitem">
  <img src="source/portfolio/${dirName}/${subfolderName}/${f}" alt="${f}" loading="lazy" onerror="this.parentElement.style.display='none'">
</div>`).join('');
  
  if (wrapper) {
    wrapper.innerHTML = pitems || '<p class="pitem-load">Нет изображений</p>';
  }
}

function handleRoute() {
  if (typeof portfolioData === 'undefined') {
    document.getElementById('portfolio-sections').innerHTML = '<p style="color:var(--gold);padding:20px;">Ошибка: данные не загружены</p>';
    return;
  }
  
  const hash = window.location.hash.slice(1);
  if (hash) {
    renderSection(portfolioData, hash);
  } else {
    renderSectionList(portfolioData);
  }
}

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);