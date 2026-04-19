function getFilesFromJson(dir) {
  if (!dir.children) return [];
  return dir.children.filter(c => c.type === 'file' && /\.(png|jpg|jpeg)$/i.test(c.name)).map(c => c.name);
}

function getSubfolders(dir) {
  if (!dir.children) return [];
  return dir.children.filter(c => c.type === 'directory');
}

function getUrls(dir) {
  if (!dir.children) return [];
  return dir.children.filter(c => c.type === 'URL');
}

function getUrlCover(item, allItems) {
  if (!allItems) return null;
  const nameWithoutExt = item.name.replace(/\.url$/i, '');
  const siblingFiles = allItems.filter(c => c.type === 'file' && /\.(png|jpg|jpeg)$/i.test(c.name));
  const cover = siblingFiles.find(f => {
    const fNameWithoutExt = f.name.replace(/\.(png|jpg|jpeg)$/i, '');
    return fNameWithoutExt === nameWithoutExt;
  });
  return cover ? cover.name : null;
}

function getDisplayName(item) {
  return item.first_name && item.first_name.trim() ? item.first_name : item.name;
}

function getSectionUrl(name) {
  return '#' + name;
}

function parseComment(comment) {
  if (!comment || !comment.trim()) return '';
  
  const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const processInline = (text) => {
    let result = escapeHtml(text);
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result = result.replace(/`(.+?)`/g, '<code>$1</code>');
    result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return result;
  };
  
  const lines = comment.split('\n');
  let html = '';
  let inList = false;
  let inOrderedList = false;
  
  const closeLists = () => {
    if (inList) { html += '</ul>'; inList = false; }
    if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
  };
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      return;
    }
    if (trimmed.startsWith('## ')) {
      closeLists();
      html += `<h2>${processInline(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      closeLists();
      html += `<h3>${processInline(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith('---')) {
      closeLists();
      html += '<hr>';
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inOrderedList) { closeLists(); html += '<ol>'; inOrderedList = true; }
      if (inList) { html += '</ul>'; inList = false; }
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      html += `<li>${processInline(match[2])}</li>`;
    } else if (trimmed.startsWith('- ')) {
      if (!inList) { closeLists(); html += '<ul>'; inList = true; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      html += `<li>${processInline(trimmed.slice(2))}</li>`;
    } else if (trimmed.startsWith('* ')) {
      if (!inList) { closeLists(); html += '<ul>'; inList = true; }
      if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      html += `<li>${processInline(trimmed.slice(2))}</li>`;
    } else {
      closeLists();
      html += `<p>${processInline(trimmed)}</p>`;
    }
  });
  
  closeLists();
  return html;
}

function getCoverImage(item, allItems) {
  if (!allItems) return null;
  const siblingFiles = allItems.filter(c => c.type === 'file' && /\.(png|jpg|jpeg)$/i.test(c.name));
  const cover = siblingFiles.find(f => {
    const nameWithoutExt = f.name.replace(/\.(png|jpg|jpeg)$/i, '');
    return nameWithoutExt === item.name || nameWithoutExt === item.first_name;
  });
  return cover ? cover.name : null;
}

function renderSectionList(data) {
  let sections = (data.children || []).filter(item => item.type === 'directory');
  let urlItems = (data.children || []).filter(item => item.type === 'URL');
  
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
    const subfolders = getSubfolders(item);
    const totalFiles = subfolders.reduce((sum, sf) => sum + getFilesFromJson(sf).length, 0);
    
    const coverImage = getCoverImage(item, data.children || []);
    const hasCover = !!coverImage;
     const coverStyle = hasCover ? `background: url(source/portfolio/${coverImage}) left/cover no-repeat !important; border: none !important;` : '';
    const coverClass = hasCover ? ' has-cover' : '';
    
     html += `<a href="${getSectionUrl(encodeURIComponent(item.name))}" class="section-link">
       <div class="section-card${coverClass}" style="${coverStyle}">
         <div class="section-card-num">${num}</div>
         <div class="section-card-title">${name}</div>
       </div>
     </a>`;
  });
  
  urlItems.forEach((item, idx) => {
    const num = String(sections.length + idx + 1).padStart(2, '0');
    const name = getDisplayName(item);
    if (!name) return;
    
    const urlCover = getUrlCover(item, data.children || []);
    const urlHasCover = !!urlCover;
     const urlCoverStyle = urlCover ? `background: url(source/portfolio/${urlCover}) left/cover no-repeat !important; border: none !important;` : '';
    const urlCoverClass = urlHasCover ? ' has-cover' : '';
    
     html += `<a href="${item.URL}" target="_blank" rel="noopener" class="section-link">
       <div class="section-card${urlCoverClass}" style="${urlCoverStyle}">
         <div class="section-card-num">${num}</div>
         <div class="section-card-title">${name}</div>
       </div>
     </a>`;
  });
  
  container.innerHTML = html;
}

function renderSection(data, sectionName) {
  const decodedSectionName = decodeURIComponent(sectionName);
  const section = data.children?.find(c => c.name === decodedSectionName);
  if (!section) {
    window.location.hash = '';
    return;
  }
  
  const name = getDisplayName(section);
  const subfolders = getSubfolders(section);
  const comment = section.comment && section.comment.trim() ? section.comment : '';
  
  let contentHtml = '';
  if (comment) {
    contentHtml = `<div class="section-content">${parseComment(comment)}</div>`;
  }
  let subfoldersHtml = '';
  const urls = getUrls(section);
  if (subfolders.length) {
    subfoldersHtml = '<div class="subsections-grid">';
    subfolders.forEach(sf => {
      const sfName = getDisplayName(sf);
      if (!sfName) return;
      const sfFiles = getFilesFromJson(sf);
      const sfCover = getCoverImage(sf, section.children || []);
       const sfCoverStyle = sfCover ? `background: url(source/portfolio/${encodeURIComponent(section.name)}/${sfCover}) left/cover no-repeat; border: none;` : '';
      const sfCoverClass = sfCover ? ' has-cover' : '';
      subfoldersHtml += `<a href="#${encodeURIComponent(section.name)}/${encodeURIComponent(sf.name)}" class="subsection-card${sfCoverClass}" style="${sfCoverStyle}">
        <div class="subsection-title">${sfName}</div>
      </a>`;
    });
    subfoldersHtml += '</div>';
  }
  
  let urlsHtml = '';
  if (urls.length) {
    urlsHtml = '<div class="subsections-grid">';
    urls.forEach(urlItem => {
      const urlName = getDisplayName(urlItem);
      if (!urlName) return;
      const urlCover = getUrlCover(urlItem, section.children || []);
       const urlCoverStyle = urlCover ? `background: url(source/portfolio/${encodeURIComponent(section.name)}/${urlCover}) left/cover no-repeat; border: none;` : '';
      const urlCoverClass = urlCover ? ' has-cover' : '';
      urlsHtml += `<a href="${urlItem.URL}" target="_blank" rel="noopener" class="subsection-card${urlCoverClass}" style="${urlCoverStyle}">
        <div class="subsection-title">${urlName}</div>
      </a>`;
    });
    urlsHtml += '</div>';
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
    ${contentHtml}
    ${subfoldersHtml}
    ${urlsHtml}
    ${!subfolders.length && !urls.length ? '<p class="pitem-load">Нет проектов</p>' : ''}
  `;
}

let galleryImages = [];
let currentImageIndex = 0;

function openLightbox(index) {
  currentImageIndex = index;
  galleryImages = galleryImages;
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  if (lb && lbImg) {
    lbImg.src = galleryImages[currentImageIndex];
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  const lbImg = document.getElementById('lightbox-img');
  if (lbImg) lbImg.src = galleryImages[currentImageIndex];
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  const lbImg = document.getElementById('lightbox-img');
  if (lbImg) lbImg.src = galleryImages[currentImageIndex];
}

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', function(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
});

function renderSubfolder(data, sectionName, subPath) {
  const subPathParts = subPath.split('/');
  
  let currentFolder = data.children?.find(c => c.name === sectionName);
  for (let i = 0; i < subPathParts.length && currentFolder; i++) {
    currentFolder = currentFolder.children?.find(c => c.name === subPathParts[i]);
  }
  
  if (!currentFolder) {
    window.location.hash = '';
    return;
  }
  
  const name = getDisplayName(currentFolder);
  let files = getFilesFromJson(currentFolder);
  const urls = getUrls(currentFolder);
  const nestedDirs = getSubfolders(currentFolder);
  
  const coverImagesInUse = new Set();
  const sectionCover = getCoverImage(currentFolder, currentFolder.children || []);
  if (sectionCover) coverImagesInUse.add(sectionCover);
  (nestedDirs || []).forEach(nd => {
    const ndCover = getCoverImage(nd, currentFolder.children || []);
    if (ndCover) coverImagesInUse.add(ndCover);
  });
  (urls || []).forEach(urlItem => {
    const urlCover = getUrlCover(urlItem, currentFolder.children || []);
    if (urlCover) coverImagesInUse.add(urlCover);
  });
  files = files.filter(f => !coverImagesInUse.has(f));
  
  let folderPath = sectionName;
  if (subPathParts.length > 1) {
    folderPath = [sectionName, ...subPathParts.slice(0, -1)].join('/');
  }
  const subPathName = subPathParts[subPathParts.length - 1];
  
  const folderPathParts = folderPath.split('/');
  const imgPath = folderPathParts.map(p => encodeURIComponent(p)).join('/') + '/' + encodeURIComponent(subPathName);
  galleryImages = files.map(f => `source/portfolio/${imgPath}/${f}`);
  
  const comment = currentFolder.comment && currentFolder.comment.trim() ? currentFolder.comment : '';
  let contentHtml = '';
  if (comment) {
    contentHtml = `<div class="section-content">${parseComment(comment)}</div>`;
  }
  
  let filesHtml = '';
  if (files.length) {
    filesHtml = files.slice(0, 30).map((f, idx) => `
<div class="pitem">
  <img src="${galleryImages[idx]}" alt="${f}" loading="lazy" onclick="openLightbox(${idx})" onerror="this.parentElement.style.display='none'">
</div>`).join('');
  }
  
  let urlsHtml = '';
  if (urls.length) {
    urlsHtml = '<div class="subsections-grid">';
    urls.forEach(urlItem => {
      const urlName = getDisplayName(urlItem);
      if (!urlName) return;
      const urlCover = getUrlCover(urlItem, currentFolder.children || []);
      const urlCoverStyle = urlCover ? `background: url(source/portfolio/${imgPath}/${urlCover}) center/cover no-repeat; border: none;` : '';
      const urlCoverClass = urlCover ? ' has-cover' : '';
      urlsHtml += `<a href="${urlItem.URL}" target="_blank" rel="noopener" class="subsection-card${urlCoverClass}" style="${urlCoverStyle}">
        <div class="subsection-title">${urlName}</div>
      </a>`;
    });
    urlsHtml += '</div>';
  }
  
  let nestedDirsHtml = '';
  if (nestedDirs.length) {
    nestedDirsHtml = '<div class="subsections-grid">';
    nestedDirs.forEach(nd => {
      const ndName = getDisplayName(nd);
      if (!ndName) return;
      const ndCover = getCoverImage(nd, currentFolder.children || []);
       const ndCoverStyle = ndCover ? `background: url(source/portfolio/${imgPath}/${ndCover}) left/cover no-repeat; border: none;` : '';
      const ndCoverClass = ndCover ? ' has-cover' : '';
      nestedDirsHtml += `<a href="#${[sectionName, subPath, nd.name].map(p => encodeURIComponent(p)).join('/')}" class="subsection-card${ndCoverClass}" style="${ndCoverStyle}">
        <div class="subsection-title">${ndName}</div>
      </a>`;
    });
    nestedDirsHtml += '</div>';
  }
  
  const backUrl = subPathParts.length > 1 
    ? '#' + [sectionName, ...subPathParts.slice(0, -1)].map(p => encodeURIComponent(p)).join('/')
    : '#' + encodeURIComponent(sectionName);
  const backText = subPathParts.length > 1 ? 'Назад' : 'К портфолио';
  
  const container = document.getElementById('portfolio-sections');
  container.innerHTML = `
    <a href="${backUrl}" class="back-link">
      <svg viewBox="0 0 12 8"><polyline points="1,1 6,7 11,1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      ${backText}
    </a>
    <div class="masthead" style="margin-bottom: 24px;">
      <div class="masthead-title">${name}</div>
    </div>
    ${contentHtml}
    <div class="pgrid">${filesHtml}</div>
    ${nestedDirsHtml}
    ${urlsHtml}
    ${!files.length && !nestedDirs.length && !urls.length ? '<p class="pitem-load">Нет изображений</p>' : ''}
  `;
}

function handleRoute() {
  window.scrollTo(0, 0);
  if (typeof portfolioData === 'undefined') {
    document.getElementById('portfolio-sections').innerHTML = '<p style="color:var(--gold);padding:20px;">Ошибка: данные не загружены</p>';
    return;
  }
  
  const hash = window.location.hash.slice(1);
  if (!hash) {
    renderSectionList(portfolioData);
    return;
  }
  
  const parts = decodeURIComponent(hash).split('/');
  if (parts.length === 0 || !parts[0]) {
    renderSectionList(portfolioData);
    return;
  }
  
  const sectionName = parts[0];
  if (parts.length === 1) {
    renderSection(portfolioData, sectionName);
    return;
  }
  
  const subPath = parts.slice(1).join('/');
  renderSubfolder(portfolioData, sectionName, subPath);
}

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);