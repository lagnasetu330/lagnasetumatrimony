/* ============================================================ AVATAR CROPPER & COMPRESSOR ============================================================ */
/* ============================================================ STEP 2: AVATAR UPLOAD, CROP & COMPRESS ============================================================ */
let cropState = {
    img: null,
    zoom: 1,
    rotation: 0,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    origFile: null,
    targetMode: 'regSlot1',
    activeRegSlot: 1,
    activeEditSlot: 1
};

function openRegSlotUpload(slotNum) {
    cropState.activeRegSlot = slotNum;
    const input = document.getElementById('regPhotoSlotInput') || document.getElementById('regAvatarInput');
    if (input) input.click();
}

function handleRegPhotoSlotSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const slotNum = cropState.activeRegSlot || 1;
    cropState.origFile = file;
    cropState.targetMode = `regSlot${slotNum}`;
    const reader = new FileReader();
    reader.onload = function (evt) {
        openCropperWithImage(evt.target.result, file.size);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function handleAvatarFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    cropState.origFile = file;
    cropState.targetMode = 'regSlot1';
    const reader = new FileReader();
    reader.onload = function (evt) {
        openCropperWithImage(evt.target.result, file.size);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function openEditSlotUpload(slotNum) {
    cropState.activeEditSlot = slotNum;
    const input = document.getElementById('editPhotoSlotInput');
    if (input) input.click();
}

function handleEditPhotoSlotSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const slotNum = cropState.activeEditSlot || 1;
    cropState.origFile = file;
    cropState.targetMode = `editSlot${slotNum}`;
    const reader = new FileReader();
    reader.onload = function (evt) {
        openCropperWithImage(evt.target.result, file.size);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function openCropperWithImage(dataUrl, fileSizeBytes) {
    const targetImg = document.getElementById('cropTargetImg');
    if (!targetImg) return;
    cropState.zoom = 1;
    cropState.rotation = 0;
    cropState.panX = 0;
    cropState.panY = 0;
    const slider = document.getElementById('cropZoomSlider');
    if (slider) slider.value = 1;

    const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    const origSizeEl = document.getElementById('cropOrigSize');
    if (origSizeEl) {
        origSizeEl.textContent = fileSizeBytes > 1024 * 1024 ? `${mb} MB` : `${Math.round(fileSizeBytes / 1024)} KB`;
    }

    function setupTargetImage() {
        cropState.img = targetImg;
        const nw = targetImg.naturalWidth || 400;
        const nh = targetImg.naturalHeight || 400;

        // Fit image naturally inside 230x230 circle viewport
        const baseRatio = Math.max(230 / nw, 230 / nh);
        cropState.baseW = nw * baseRatio;
        cropState.baseH = nh * baseRatio;

        targetImg.style.width = cropState.baseW + 'px';
        targetImg.style.height = cropState.baseH + 'px';
        targetImg.style.maxWidth = 'none';
        targetImg.style.maxHeight = 'none';
        targetImg.style.position = 'absolute';
        targetImg.style.left = '50%';
        targetImg.style.top = '50%';

        updateCropDisplay();
    }

    targetImg.onload = setupTargetImage;
    targetImg.src = dataUrl;
    if (targetImg.complete && targetImg.naturalWidth) {
        setupTargetImage();
    }

    openModal('modalCropAvatar');
}

function updateCropDisplay() {
    const targetImg = document.getElementById('cropTargetImg');
    if (!targetImg) return;
    targetImg.style.transform = `translate(calc(-50% + ${cropState.panX}px), calc(-50% + ${cropState.panY}px)) scale(${cropState.zoom}) rotate(${cropState.rotation}deg)`;
}

function onCropZoomChange(val) {
    cropState.zoom = parseFloat(val);
    updateCropDisplay();
}

function rotateCropImage() {
    cropState.rotation = (cropState.rotation + 90) % 360;
    updateCropDisplay();
}

function confirmCropAndCompress() {
    if (!cropState.img) return;

    // High-Definition Profile Export: 800x800 px with high smoothing (~120-160KB)
    // Ensures crystal-clear facial clarity on modern 2x/3x Retina & Full HD screens
    const outSize = 800;
    const canvas = document.createElement('canvas');
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');

    // High quality bicubic image smoothing for crisp, clean details
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outSize, outSize);

    const s = outSize / 230;

    ctx.save();
    ctx.translate(outSize / 2, outSize / 2);
    ctx.translate(cropState.panX * s, cropState.panY * s);
    ctx.rotate((cropState.rotation * Math.PI) / 180);
    ctx.scale(cropState.zoom, cropState.zoom);

    const drawW = (cropState.baseW || 230) * s;
    const drawH = (cropState.baseH || 230) * s;
    ctx.drawImage(cropState.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // High quality JPEG (0.88 quality for sharp, clear HD output ~120-160KB)
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

    if (cropState.targetMode === 'reg' || cropState.targetMode === 'regSlot1') {
        state.regData.photo = compressedDataUrl;
        if (!state.regData.photos) state.regData.photos = [];
        state.regData.photos[0] = compressedDataUrl;
        
        const previewImg = document.getElementById('regSlotImg1') || document.getElementById('regAvatarImg');
        const empty = document.getElementById('regSlotEmpty1') || document.getElementById('regAvatarEmpty');
        const card = document.getElementById('regSlotCard1') || document.getElementById('regAvatarBox');
        if (previewImg) {
            previewImg.src = compressedDataUrl;
            previewImg.style.display = 'block';
        }
        if (empty) empty.style.display = 'none';
        if (card) {
            card.style.borderColor = 'var(--primary)';
            card.style.borderStyle = 'solid';
            const camIcon = card.querySelector('.cam-btn i, .cam i');
            if (camIcon) camIcon.className = 'fa-solid fa-check';
        }
        showToast('Main photo (Slot 1) cropped & saved in HD quality!');
    } else if (cropState.targetMode.startsWith('regSlot')) {
        const slotNum = parseInt(cropState.targetMode.replace('regSlot', ''), 10);
        if (!state.regData.photos) state.regData.photos = [];
        state.regData.photos[slotNum - 1] = compressedDataUrl;
        
        const previewImg = document.getElementById(`regSlotImg${slotNum}`);
        const empty = document.getElementById(`regSlotEmpty${slotNum}`);
        const card = document.getElementById(`regSlotCard${slotNum}`);
        if (previewImg) {
            previewImg.src = compressedDataUrl;
            previewImg.style.display = 'block';
        }
        if (empty) empty.style.display = 'none';
        if (card) {
            card.style.borderColor = 'var(--primary)';
            card.style.borderStyle = 'solid';
            const camIcon = card.querySelector('.cam-btn i');
            if (camIcon) camIcon.className = 'fa-solid fa-check';
        }
        showToast(`Slot ${slotNum} photo cropped & saved in HD quality!`);
    } else if (cropState.targetMode.startsWith('editSlot')) {
        const slotNum = cropState.targetMode.replace('editSlot', '');
        const editImg = document.getElementById(`editSlotImg${slotNum}`);
        const editEmpty = document.getElementById(`editSlotEmpty${slotNum}`);
        if (editImg) {
            editImg.src = compressedDataUrl;
            editImg.style.display = 'block';
        }
        if (editEmpty) editEmpty.style.display = 'none';
        showToast(`Slot ${slotNum} photo cropped & saved in HD quality!`);
    }

    // Asynchronously upload to Cloudinary CDN with AI Face-Center
    if (typeof uploadToCloudinary === 'function') {
        uploadToCloudinary(compressedDataUrl, 'profiles').then(res => {
            if (res && res.secureUrl) {
                const optimized = typeof getOptimizedImageUrl === 'function' 
                    ? getOptimizedImageUrl(res.secureUrl, { width: 800, height: 800, crop: 'fill', gravity: 'face' }) 
                    : res.secureUrl;
                    
                if (cropState.targetMode === 'reg' || cropState.targetMode === 'regSlot1') {
                    state.regData.photo = optimized;
                    if (!state.regData.photos) state.regData.photos = [];
                    state.regData.photos[0] = optimized;
                    if (!state.regData.cloudinary_public_ids) state.regData.cloudinary_public_ids = [];
                    if (res.publicId) state.regData.cloudinary_public_ids[0] = res.publicId;
                } else if (cropState.targetMode.startsWith('regSlot')) {
                    const sNum = parseInt(cropState.targetMode.replace('regSlot', ''), 10);
                    if (!state.regData.photos) state.regData.photos = [];
                    state.regData.photos[sNum - 1] = optimized;
                    if (!state.regData.cloudinary_public_ids) state.regData.cloudinary_public_ids = [];
                    if (res.publicId) state.regData.cloudinary_public_ids[sNum - 1] = res.publicId;
                } else if (cropState.targetMode.startsWith('editSlot')) {
                    const eNum = parseInt(cropState.targetMode.replace('editSlot', ''), 10);
                    const myProf = (window.PROFILES || []).find(p => p.id === state.currentUser?.id);
                    if (myProf) {
                        if (!myProf.photos) myProf.photos = [myProf.img || ''];
                        myProf.photos[eNum - 1] = optimized;
                        if (eNum === 1) myProf.img = optimized;
                        if (!myProf.cloudinary_public_ids) myProf.cloudinary_public_ids = [];
                        if (res.publicId) myProf.cloudinary_public_ids[eNum - 1] = res.publicId;
                        if (typeof saveCommunityProfiles === 'function') saveCommunityProfiles();
                    }
                    if (state.currentUser) {
                        if (!state.currentUser.cloudinary_public_ids) state.currentUser.cloudinary_public_ids = [];
                        if (res.publicId) state.currentUser.cloudinary_public_ids[eNum - 1] = res.publicId;
                    }
                }
                console.info('[Cloudinary] Photo uploaded to CDN:', optimized, 'ID:', res.publicId);
            }
        }).catch(err => console.warn('[Cloudinary] Background upload notice:', err));
    }

    closeModal('modalCropAvatar');
}

// Drag & Pan support for mouse and touch on crop viewport
window.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('cropViewport');
    if (!viewport) return;

    const startDrag = (clientX, clientY) => {
        cropState.isDragging = true;
        cropState.startX = clientX - cropState.panX;
        cropState.startY = clientY - cropState.panY;
        viewport.style.cursor = 'grabbing';
    };
    const doDrag = (clientX, clientY) => {
        if (!cropState.isDragging) return;
        cropState.panX = clientX - cropState.startX;
        cropState.panY = clientY - cropState.startY;
        updateCropDisplay();
    };
    const endDrag = () => {
        cropState.isDragging = false;
        viewport.style.cursor = 'grab';
    };

    viewport.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => { if (cropState.isDragging) { e.preventDefault(); doDrag(e.clientX, e.clientY); } });
    window.addEventListener('mouseup', endDrag);

    viewport.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    window.addEventListener('touchmove', e => {
        if (cropState.isDragging && e.touches.length === 1) {
            doDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    window.addEventListener('touchcancel', endDrag);
    window.addEventListener('touchend', endDrag);
});

function pickGender(g, li) {
    state.regData.gender = g;
    const dd = document.getElementById('ddGender');
    if (dd) {
        const trigger = dd.querySelector('.dd-trigger');
        if (trigger) {
            trigger.classList.remove('placeholder');
            trigger.classList.remove('input-error');
            trigger.style.borderColor = '';
        }
    }
    const triggerText = document.getElementById('genderValText');
    if (triggerText) {
        triggerText.style.display = 'inline-flex';
        triggerText.style.alignItems = 'center';
        triggerText.style.justifyContent = 'flex-start';
        triggerText.style.gap = '8px';
        triggerText.innerHTML = g === 'Girl'
            ? '<i class="fa-solid fa-venus" style="color:#E91E63;font-size:14px;"></i>Girl (100% Lifetime Free)'
            : '<i class="fa-solid fa-mars" style="color:var(--primary);font-size:14px;"></i>Boy';
    }
    document.querySelectorAll('#ddGender li').forEach(x => x.classList.remove('active'));
    if (li) li.classList.add('active');
    if (dd) dd.classList.remove('open');
    showToast(`Gender selected: ${g}`);
}

function highlightFieldError(inputEl, msg) {
    if (!inputEl) return;
    if (inputEl.classList) inputEl.classList.add('input-error');
    inputEl.style.borderColor = 'var(--error)';
    if (typeof inputEl.scrollIntoView === 'function') {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    try { inputEl.focus(); } catch (e) { }
    if (msg) showToast(msg);
}

function clearFieldError(inputEl) {
    if (!inputEl) return;
    if (inputEl.classList) inputEl.classList.remove('input-error');
    inputEl.style.borderColor = '';
}
