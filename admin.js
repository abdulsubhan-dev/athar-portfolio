// ============================================================
// ATHAR JAMIL PORTFOLIO — admin.js
// Admin Dashboard: Auth + CRUD for Projects, Videos, Services
// ============================================================

import { auth, db, storage } from './firebase-config.js';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


// ── State ──
let pendingDeleteId   = null;
let pendingDeleteType = null;
let pendingDeleteStoragePath = null;

// ── File selection state ──
let projectImgFile   = null;
let videoThumbFile   = null;
let existingProjectImgUrl  = null;
let existingVideoThumbUrl  = null;

// Cloudinary unsigned upload settings
const CLOUDINARY_CLOUD_NAME = 'dehycekcg';
const CLOUDINARY_UPLOAD_PRESET = 'atharportfolio';


// ============================================================
// AUTH — onAuthStateChanged
// ============================================================
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadProjects();
    loadVideos();
    loadServices();
  } else {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }
});


// ============================================================
// LOGIN
// ============================================================
const loginBtn      = document.getElementById('loginBtn');
const loginBtnText  = document.getElementById('loginBtnText');
const loginSpinner  = document.getElementById('loginSpinner');
const loginError    = document.getElementById('loginError');
const togglePwBtn   = document.getElementById('togglePw');

loginBtn.addEventListener('click', async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showLoginError('Please enter email and password.');
    return;
  }

  loginBtnText.textContent = 'Signing in...';
  loginSpinner.classList.remove('hidden');
  loginBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
  console.log("Firebase Login Error:", err.code, err.message);

  let msg = `Login failed: ${err.code}`;

  if (err.code === 'auth/user-not-found') msg = 'No admin account found.';
  if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
  if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
  if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
  if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
    if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    console.log('Firebase Login Error:', err.code, err.message);
  if (err.code === 'auth/configuration-not-found') msg = 'Firebase Authentication is not configured correctly.';

  showLoginError(msg);
} finally {
    loginBtnText.textContent = 'Sign In';
    loginSpinner.classList.add('hidden');
    loginBtn.disabled = false;
  }
});

// Allow Enter key on login
['loginEmail','loginPassword'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
  });
});

togglePwBtn.addEventListener('click', () => {
  const pwInput = document.getElementById('loginPassword');
  const isText  = pwInput.type === 'text';
  pwInput.type  = isText ? 'password' : 'text';
  togglePwBtn.innerHTML = `<i class="fa-solid fa-eye${isText ? '' : '-slash'}"></i>`;
});

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.classList.add('show');
  setTimeout(() => loginError.classList.remove('show'), 4000);
}


// ============================================================
// LOGOUT
// ============================================================
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
});


// ============================================================
// SIDEBAR & TABS
// ============================================================
const sidebarBtns = document.querySelectorAll('.sidebar-btn');
const tabPanels   = document.querySelectorAll('.tab-panel');

sidebarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    sidebarBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabPanels.forEach(p => {
      p.classList.toggle('active', p.id === `tab-${tab}`);
      p.classList.toggle('hidden', p.id !== `tab-${tab}`);
    });
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  });
});

// Mobile sidebar
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});


// ============================================================
// CONFIRM DELETE MODAL
// ============================================================
const confirmModal  = document.getElementById('confirmModal');
const confirmDelete = document.getElementById('confirmDelete');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOverlay = document.getElementById('confirmOverlay');

function showConfirm(id, type, storagePath = null) {
  pendingDeleteId   = id;
  pendingDeleteType = type;
  pendingDeleteStoragePath = storagePath;
  confirmModal.classList.remove('hidden');
}

function hideConfirm() {
  pendingDeleteId   = null;
  pendingDeleteType = null;
  pendingDeleteStoragePath = null;
  confirmModal.classList.add('hidden');
}

confirmCancel.addEventListener('click',  hideConfirm);
confirmOverlay.addEventListener('click', hideConfirm);

confirmDelete.addEventListener('click', async () => {
  if (!pendingDeleteId || !pendingDeleteType) return;
  try {
    await deleteDoc(doc(db, pendingDeleteType, pendingDeleteId));
    // Delete from Storage if path provided
    if (pendingDeleteStoragePath) {
      try {
        await deleteObject(ref(storage, pendingDeleteStoragePath));
      } catch {}
    }
    hideConfirm();
    if (pendingDeleteType === 'projects') loadProjects();
    if (pendingDeleteType === 'videos')   loadVideos();
    if (pendingDeleteType === 'services') loadServices();
  } catch (err) {
    console.error('Delete error:', err);
  }
  // Re-fetch after delete
  const type = pendingDeleteType;
  hideConfirm();
  if (type === 'projects') loadProjects();
  if (type === 'videos')   loadVideos();
  if (type === 'services') loadServices();
});


// ============================================================
// FILE UPLOAD HELPER
// ============================================================
async function uploadFile(file, path, progressBarId, progressTextId, progressWrapId) {
  const progressWrap = document.getElementById(progressWrapId);
  const progressBar  = document.getElementById(progressBarId);
  const progressText = document.getElementById(progressTextId);

  progressWrap.classList.remove('hidden');
  progressBar.style.setProperty('--progress', '0%');
  progressText.textContent = '0%';

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', path.startsWith('videos/') ? 'athar-portfolio/videos' : 'athar-portfolio/projects');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = e => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      progressBar.style.setProperty('--progress', `${pct}%`);
      progressText.textContent = `${pct}%`;
    };

    xhr.onload = () => {
      progressWrap.classList.add('hidden');
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
          resolve({ url: res.secure_url, path: res.public_id || '' });
        } else {
          reject(new Error(res.error?.message || 'Cloudinary upload failed.'));
        }
      } catch (error) {
        reject(new Error('Invalid Cloudinary response.'));
      }
    };

    xhr.onerror = () => {
      progressWrap.classList.add('hidden');
      reject(new Error('Network error during Cloudinary upload.'));
    };

    xhr.send(formData);
  });
}

// File preview helper
function setupFilePreview(inputId, previewWrapId, previewImgId, removeId, onFile, onRemove) {
  const input      = document.getElementById(inputId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg  = document.getElementById(previewImgId);
  const removeBtn   = document.getElementById(removeId);

  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    onFile(file);
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewWrap.classList.remove('hidden');
  });

  removeBtn.addEventListener('click', () => {
    input.value = '';
    previewImg.src = '';
    previewWrap.classList.add('hidden');
    onRemove();
  });
}

// Setup file previews
setupFilePreview(
  'projectImg', 'projectImgPreview', 'projectImgPreviewImg', 'removeProjectImg',
  file => { projectImgFile = file; },
  ()   => { projectImgFile = null; existingProjectImgUrl = null; }
);

setupFilePreview(
  'videoThumb', 'videoThumbPreview', 'videoThumbPreviewImg', 'removeVideoThumb',
  file => { videoThumbFile = file; },
  ()   => { videoThumbFile = null; existingVideoThumbUrl = null; }
);


// ============================================================
// SHOW / HIDE FORM MESSAGES
// ============================================================
function showFormMsg(elId, msg, type = 'success') {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `form-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}


// ============================================================
// ═══════════════ PROJECTS CRUD ═══════════════
// ============================================================
const projectForm     = document.getElementById('projectForm');
const projectFormTitle = document.getElementById('projectFormTitle');
const addProjectBtn   = document.getElementById('addProjectBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const saveProjectBtn  = document.getElementById('saveProjectBtn');
const saveProjectText = document.getElementById('saveProjectText');
const saveProjectSpinner = document.getElementById('saveProjectSpinner');

addProjectBtn.addEventListener('click', () => {
  resetProjectForm();
  projectFormTitle.textContent = 'Add New Project';
  projectForm.classList.remove('hidden');
  projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

cancelProjectBtn.addEventListener('click', () => {
  projectForm.classList.add('hidden');
  resetProjectForm();
});

function resetProjectForm() {
  document.getElementById('projectId').value       = '';
  document.getElementById('projectTitle').value    = '';
  document.getElementById('projectCategory').value = '';
  document.getElementById('projectDesc').value     = '';
  document.getElementById('projectImg').value      = '';
  document.getElementById('projectImgPreviewImg').src = '';
  document.getElementById('projectImgPreview').classList.add('hidden');
  projectImgFile = null;
  existingProjectImgUrl = null;
  document.getElementById('projectFormMsg').classList.add('hidden');
}

saveProjectBtn.addEventListener('click', async () => {
  const title    = document.getElementById('projectTitle').value.trim();
  const category = document.getElementById('projectCategory').value.trim();
  const desc     = document.getElementById('projectDesc').value.trim();
  const id       = document.getElementById('projectId').value;

  if (!title) { showFormMsg('projectFormMsg', 'Title is required.', 'error'); return; }

  saveProjectText.textContent = 'Saving...';
  saveProjectSpinner.classList.remove('hidden');
  saveProjectBtn.disabled = true;

  try {
    let imageUrl = existingProjectImgUrl || null;
    let imagePath = null;

    if (projectImgFile) {
      const fname = `projects/${Date.now()}_${projectImgFile.name}`;
      const result = await uploadFile(
        projectImgFile, fname,
        'projectProgressBar', 'projectProgressText', 'projectUploadProgress'
      );
      imageUrl  = result.url;
      imagePath = result.path;
    }

    const data = {
      title, category, description: desc,
      imageUrl: imageUrl || '',
      imagePath: imagePath || '',
      updatedAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, 'projects', id), data);
      showFormMsg('projectFormMsg', 'Project updated successfully!', 'success');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'projects'), data);
      showFormMsg('projectFormMsg', 'Project added successfully!', 'success');
    }

    setTimeout(() => {
      projectForm.classList.add('hidden');
      resetProjectForm();
    }, 1200);

    loadProjects();
  } catch (err) {
    console.error('Save project error:', err);
    showFormMsg('projectFormMsg', 'Error saving project: ' + err.message, 'error');
  } finally {
    saveProjectText.textContent = 'Save Project';
    saveProjectSpinner.classList.add('hidden');
    saveProjectBtn.disabled = false;
  }
});

async function loadProjects() {
  const list = document.getElementById('projectsList');
  list.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

  try {
    const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-images"></i><p>No projects yet. Add your first one!</p></div>`;
      return;
    }

    snap.forEach(d => {
      const p = { id: d.id, ...d.data() };
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div class="admin-item-img">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" />` : '<i class="fa-solid fa-image"></i>'}
        </div>
        <div class="admin-item-body">
          <div class="admin-item-cat">${p.category || ''}</div>
          <h4>${p.title}</h4>
          <p>${p.description || 'No description'}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-edit" data-id="${p.id}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-delete" data-id="${p.id}" data-path="${p.imagePath || ''}"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      `;

      card.querySelector('.btn-edit').addEventListener('click', () => editProject(p));
      card.querySelector('.btn-delete').addEventListener('click', e => {
        showConfirm(p.id, 'projects', e.currentTarget.dataset.path || null);
      });

      list.appendChild(card);
    });
  } catch (err) {
    console.error('Load projects error:', err);
    list.innerHTML = `<div class="admin-empty"><p>Error loading projects: ${err.message}</p></div>`;
  }
}

function editProject(p) {
  resetProjectForm();
  projectFormTitle.textContent = 'Edit Project';
  document.getElementById('projectId').value       = p.id;
  document.getElementById('projectTitle').value    = p.title || '';
  document.getElementById('projectCategory').value = p.category || '';
  document.getElementById('projectDesc').value     = p.description || '';

  if (p.imageUrl) {
    existingProjectImgUrl = p.imageUrl;
    document.getElementById('projectImgPreviewImg').src = p.imageUrl;
    document.getElementById('projectImgPreview').classList.remove('hidden');
  }

  projectForm.classList.remove('hidden');
  projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ============================================================
// ═══════════════ VIDEOS CRUD ═══════════════
// ============================================================
const videoForm      = document.getElementById('videoForm');
const videoFormTitle = document.getElementById('videoFormTitle');
const addVideoBtn    = document.getElementById('addVideoBtn');
const cancelVideoBtn = document.getElementById('cancelVideoBtn');
const saveVideoBtn   = document.getElementById('saveVideoBtn');
const saveVideoText  = document.getElementById('saveVideoText');
const saveVideoSpinner = document.getElementById('saveVideoSpinner');

addVideoBtn.addEventListener('click', () => {
  resetVideoForm();
  videoFormTitle.textContent = 'Add New Video';
  videoForm.classList.remove('hidden');
  videoForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

cancelVideoBtn.addEventListener('click', () => {
  videoForm.classList.add('hidden');
  resetVideoForm();
});

function resetVideoForm() {
  document.getElementById('videoId').value    = '';
  document.getElementById('videoTitle').value = '';
  document.getElementById('videoUrl').value   = '';
  document.getElementById('videoDesc').value  = '';
  document.getElementById('videoThumb').value = '';
  document.getElementById('videoThumbPreviewImg').src = '';
  document.getElementById('videoThumbPreview').classList.add('hidden');
  videoThumbFile = null;
  existingVideoThumbUrl = null;
  document.getElementById('videoFormMsg').classList.add('hidden');
}

saveVideoBtn.addEventListener('click', async () => {
  const title   = document.getElementById('videoTitle').value.trim();
  const videoUrl = document.getElementById('videoUrl').value.trim();
  const desc    = document.getElementById('videoDesc').value.trim();
  const id      = document.getElementById('videoId').value;

  if (!title)    { showFormMsg('videoFormMsg', 'Title is required.', 'error'); return; }
  if (!videoUrl) { showFormMsg('videoFormMsg', 'Video URL is required.', 'error'); return; }

  saveVideoText.textContent = 'Saving...';
  saveVideoSpinner.classList.remove('hidden');
  saveVideoBtn.disabled = true;

  try {
    let thumbnailUrl  = existingVideoThumbUrl || null;
    let thumbnailPath = null;

    if (videoThumbFile) {
      const fname = `videos/${Date.now()}_${videoThumbFile.name}`;
      const result = await uploadFile(
        videoThumbFile, fname,
        'videoProgressBar', 'videoProgressText', 'videoUploadProgress'
      );
      thumbnailUrl  = result.url;
      thumbnailPath = result.path;
    }

    const data = {
      title, videoUrl, description: desc,
      thumbnailUrl:  thumbnailUrl || '',
      thumbnailPath: thumbnailPath || '',
      updatedAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, 'videos', id), data);
      showFormMsg('videoFormMsg', 'Video updated successfully!', 'success');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'videos'), data);
      showFormMsg('videoFormMsg', 'Video added successfully!', 'success');
    }

    setTimeout(() => {
      videoForm.classList.add('hidden');
      resetVideoForm();
    }, 1200);

    loadVideos();
  } catch (err) {
    console.error('Save video error:', err);
    showFormMsg('videoFormMsg', 'Error saving video: ' + err.message, 'error');
  } finally {
    saveVideoText.textContent = 'Save Video';
    saveVideoSpinner.classList.add('hidden');
    saveVideoBtn.disabled = false;
  }
});

async function loadVideos() {
  const list = document.getElementById('videosList');
  list.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

  try {
    const snap = await getDocs(query(collection(db, 'videos'), orderBy('createdAt', 'desc')));
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-film"></i><p>No videos yet. Add your first one!</p></div>`;
      return;
    }

    snap.forEach(d => {
      const v = { id: d.id, ...d.data() };
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div class="admin-item-img">
          ${v.thumbnailUrl ? `<img src="${v.thumbnailUrl}" alt="${v.title}" />` : '<i class="fa-solid fa-film"></i>'}
        </div>
        <div class="admin-item-body">
          <div class="admin-item-cat">Video</div>
          <h4>${v.title}</h4>
          <p>${v.videoUrl || ''}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-edit" data-id="${v.id}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-delete" data-id="${v.id}" data-path="${v.thumbnailPath || ''}"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      `;

      card.querySelector('.btn-edit').addEventListener('click', () => editVideo(v));
      card.querySelector('.btn-delete').addEventListener('click', e => {
        showConfirm(v.id, 'videos', e.currentTarget.dataset.path || null);
      });

      list.appendChild(card);
    });
  } catch (err) {
    console.error('Load videos error:', err);
    list.innerHTML = `<div class="admin-empty"><p>Error loading videos: ${err.message}</p></div>`;
  }
}

function editVideo(v) {
  resetVideoForm();
  videoFormTitle.textContent = 'Edit Video';
  document.getElementById('videoId').value    = v.id;
  document.getElementById('videoTitle').value = v.title || '';
  document.getElementById('videoUrl').value   = v.videoUrl || '';
  document.getElementById('videoDesc').value  = v.description || '';

  if (v.thumbnailUrl) {
    existingVideoThumbUrl = v.thumbnailUrl;
    document.getElementById('videoThumbPreviewImg').src = v.thumbnailUrl;
    document.getElementById('videoThumbPreview').classList.remove('hidden');
  }

  videoForm.classList.remove('hidden');
  videoForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ============================================================
// ═══════════════ SERVICES CRUD ═══════════════
// ============================================================
const serviceForm      = document.getElementById('serviceForm');
const serviceFormTitle = document.getElementById('serviceFormTitle');
const addServiceBtn    = document.getElementById('addServiceBtn');
const cancelServiceBtn = document.getElementById('cancelServiceBtn');
const saveServiceBtn   = document.getElementById('saveServiceBtn');
const saveServiceText  = document.getElementById('saveServiceText');
const saveServiceSpinner = document.getElementById('saveServiceSpinner');

addServiceBtn.addEventListener('click', () => {
  resetServiceForm();
  serviceFormTitle.textContent = 'Add New Service';
  serviceForm.classList.remove('hidden');
  serviceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

cancelServiceBtn.addEventListener('click', () => {
  serviceForm.classList.add('hidden');
  resetServiceForm();
});

function resetServiceForm() {
  document.getElementById('serviceId').value    = '';
  document.getElementById('serviceTitle').value = '';
  document.getElementById('serviceIcon').value  = '';
  document.getElementById('serviceDesc').value  = '';
  document.getElementById('serviceFormMsg').classList.add('hidden');
}

saveServiceBtn.addEventListener('click', async () => {
  const title = document.getElementById('serviceTitle').value.trim();
  const icon  = document.getElementById('serviceIcon').value.trim();
  const desc  = document.getElementById('serviceDesc').value.trim();
  const id    = document.getElementById('serviceId').value;

  if (!title) { showFormMsg('serviceFormMsg', 'Title is required.', 'error'); return; }

  saveServiceText.textContent = 'Saving...';
  saveServiceSpinner.classList.remove('hidden');
  saveServiceBtn.disabled = true;

  try {
    const data = {
      title, icon: icon || '✦', description: desc,
      updatedAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, 'services', id), data);
      showFormMsg('serviceFormMsg', 'Service updated!', 'success');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'services'), data);
      showFormMsg('serviceFormMsg', 'Service added!', 'success');
    }

    setTimeout(() => {
      serviceForm.classList.add('hidden');
      resetServiceForm();
    }, 1000);

    loadServices();
  } catch (err) {
    console.error('Save service error:', err);
    showFormMsg('serviceFormMsg', 'Error: ' + err.message, 'error');
  } finally {
    saveServiceText.textContent = 'Save Service';
    saveServiceSpinner.classList.add('hidden');
    saveServiceBtn.disabled = false;
  }
});

async function loadServices() {
  const list = document.getElementById('servicesList');
  list.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

  try {
    const snap = await getDocs(query(collection(db, 'services'), orderBy('createdAt', 'desc')));
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-list-check"></i><p>No services yet. Add your first one!</p></div>`;
      return;
    }

    snap.forEach(d => {
      const s = { id: d.id, ...d.data() };
      const row = document.createElement('div');
      row.className = 'admin-service-row';
      row.innerHTML = `
        <div class="service-row-icon">${s.icon || '✦'}</div>
        <div class="service-row-info">
          <h4>${s.title}</h4>
          <p>${s.description || 'No description'}</p>
        </div>
        <div class="service-row-actions">
          <button class="btn-edit" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-delete" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      row.querySelector('.btn-edit').addEventListener('click', () => editService(s));
      row.querySelector('.btn-delete').addEventListener('click', () => {
        showConfirm(s.id, 'services');
      });

      list.appendChild(row);
    });
  } catch (err) {
    console.error('Load services error:', err);
    list.innerHTML = `<div class="admin-empty"><p>Error loading services: ${err.message}</p></div>`;
  }
}

function editService(s) {
  resetServiceForm();
  serviceFormTitle.textContent = 'Edit Service';
  document.getElementById('serviceId').value    = s.id;
  document.getElementById('serviceTitle').value = s.title || '';
  document.getElementById('serviceIcon').value  = s.icon || '';
  document.getElementById('serviceDesc').value  = s.description || '';
  serviceForm.classList.remove('hidden');
  serviceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
