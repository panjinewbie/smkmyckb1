// --- Impor dan Konfigurasi Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, push, update, remove, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCA2Dwl7FPBDcbAtS5iTyTADx0YY5byxo8",
    authDomain: "classcraft-1.firebaseapp.com",
    projectId: "classcraft-1",
    storageBucket: "classcraft-1.firebasestorage.app",
    messagingSenderId: "417700394747",
    appId: "1:417700394747:web:5251002e9602908710e25e",
    measurementId: "G-17V1PH5Q73",
    databaseURL: "https://classcraft-1-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- MANTRA BARU: Audio Player dengan Tone.js (VERSI DIPERBARUI) ---
const audioPlayer = {
    isReady: false,
    synth: null,
    // FUNGSI INIT DIPERBARUI DENGAN MANTRA PALING SAKTI
    async init() {
        if (this.isReady || typeof Tone === 'undefined') return;
        try {
            // Mantra ini "memaksa" browser untuk mengaktifkan audio
            await Tone.start();
            this.synth = new Tone.Synth().toDestination();
            this.isReady = true;
            console.log("Konteks audio berhasil dimulai! Siap beraksi!");
        } catch (e) {
            console.error("Gagal memulai audio:", e);
        }
    },
    play(note, duration = '8n') {
        if (!this.isReady) return;
        this.synth.triggerAttackRelease(note, duration);
    },
    click() { this.play('C4', '16n'); },
    success() { this.play('G5', '16n'); },
    error() { this.play('C3', '8n'); },
    xpGain() {
        if (!this.isReady) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease("C5", "16n", now);
        this.synth.triggerAttackRelease("E5", "16n", now + 0.1);
        this.synth.triggerAttackRelease("G5", "16n", now + 0.2);
    },
    hpLoss() {
        if (!this.isReady) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease("G3", "16n", now);
        this.synth.triggerAttackRelease("C3", "16n", now + 0.1);
    },
    openModal() { this.play('E4', '16n'); },
    closeModal() { this.play('C4', '16n'); }
};

// Audio harus dimulai setelah interaksi pengguna (klik, sentuh, dll)
document.body.addEventListener('click', () => audioPlayer.init(), { once: true });


// --- LOGIKA UTAMA (ROUTER PINTAR) ---
onAuthStateChanged(auth, async (user) => {
    // Mendapatkan path halaman saat ini (misal: "/index.html", "/admin.html")
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('/') || path.endsWith('index.html');
    const isAdminPage = path.endsWith('admin.html');
    const isStudentPage = path.endsWith('student.html');

    if (user) {
        // Jika PENGGUNA SUDAH LOGIN
        const roleRef = ref(db, `roles/${user.uid}`);
        const roleSnap = await get(roleRef);
        const isAdmin = roleSnap.exists() && roleSnap.val().isAdmin;

        if (isAdmin) {
            // Jika dia ADMIN
            if (isLoginPage || isStudentPage) {
                window.location.href = 'admin.html'; // Paksa ke dasbor admin
            } else if (isAdminPage) {
                setupAdminDashboard(); // Jalankan fungsi admin
            }
        } else {
            // Jika dia SISWA
            if (isLoginPage || isAdminPage) {
                window.location.href = 'student.html'; // Paksa ke dasbor siswa
            } else if (isStudentPage) {
                setupStudentDashboard(user.uid); // Jalankan fungsi siswa
            }
        }
    } else {
        // Jika PENGGUNA BELUM LOGIN
        if (isAdminPage || isStudentPage) {
            window.location.href = 'index.html'; // Paksa kembali ke halaman login
        }
    }
});


// --- FUNGSI TAMPILAN & NOTIFIKASI (DENGAN SUARA) ---
const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    toast.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => toast.classList.add('hidden'), 3000);
    
    // Mainkan suara sesuai kondisi
    if (isError) {
        audioPlayer.error();
    } else {
        audioPlayer.success();
    }
};

// --- FUNGSI PEMROSESAN GAMBAR (shared) ---
function processImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function resizeImage(base64Str, maxWidth = 400, maxHeight = 400) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
    });
}


// =======================================================
//                  LOGIKA HALAMAN LOGIN
// =======================================================
const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginButton = document.getElementById('login-button');
        const loginNotification = document.getElementById('login-notification');
        loginButton.disabled = true;
        loginButton.textContent = 'Memeriksa...';
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await signInWithEmailAndPassword(auth, email, password);
            // Router di atas akan handle redirect otomatis
        } catch (error) {
            loginNotification.textContent = 'Email atau password salah!';
            loginNotification.classList.remove('hidden');
            loginNotification.classList.add('bg-red-500');
            audioPlayer.error(); // Suara error saat login gagal
            loginButton.disabled = false;
            loginButton.textContent = 'Masuk Dunia DREAMY';
        }
    });
}


// =======================================================
//                  LOGIKA DASBOR SISWA
// =======================================================
function setupStudentDashboard(uid) {
    document.getElementById('student-logout-button').onclick = () => signOut(auth);
    
    // --- MANTRA BARU DISINI ---
    // Menghubungkan tombol navigasi Shop ke fungsi buka toko
    const shopNavButton = document.getElementById('open-shop-button');
    if (shopNavButton) {
        shopNavButton.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah link pindah halaman
            openStudentShop(uid);
        });
    }

    const studentRef = ref(db, `students/${uid}`);
    onValue(studentRef, (snapshot) => {
        if(!snapshot.exists()) return;
        const studentData = snapshot.val();
        document.getElementById('student-name').textContent = studentData.nama;
        document.getElementById('student-class-role').textContent = `${studentData.kelas} | ${studentData.peran} | Guild ${studentData.guild || ''}`;
        document.getElementById('student-avatar').src = studentData.fotoProfilBase64 || `https://placehold.co/128x128/e2e8f0/3d4852?text=${studentData.nama.charAt(0)}`;
        document.getElementById('hp-value').textContent = `${studentData.hp} / 100`;
        document.getElementById('hp-bar').style.width = `${studentData.hp}%`;
        document.getElementById('level-value').textContent = studentData.level;
        document.getElementById('xp-value').textContent = `${studentData.xp} / 1000`;
        document.getElementById('xp-bar').style.width = `${(studentData.xp / 1000) * 100}%`;
        document.getElementById('coin-value').textContent = studentData.coin;
        
        const inventorySlots = document.getElementById('inventory-slots');
        inventorySlots.innerHTML = '';
        const inventorySize = 2 + ((studentData.level - 1) * 1);
        for (let i = 0; i < inventorySize; i++) {
            const item = studentData.inventory ? studentData.inventory[i] : null;
            const slot = document.createElement('button'); // Diubah menjadi button agar interaktif
            slot.className = 'inventory-slot w-20 h-20 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 relative transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-50';
            slot.dataset.index = i;

            if (item) {
                slot.innerHTML = `<img src="${item.iconUrl}" title="${item.name}: ${item.description}" class="w-full h-full object-cover rounded-lg pointer-events-none">`;
                slot.classList.remove('border-dashed', 'bg-gray-200');
                slot.classList.add('inventory-item', 'cursor-pointer', 'hover:ring-2', 'hover:ring-blue-500');
                slot.itemData = item; // Menyimpan data item langsung di elemen
            } else {
                slot.innerHTML = `<span>Kosong</span>`;
                slot.disabled = true;
            }
            inventorySlots.appendChild(slot);
        }

        // Event listener untuk semua slot inventory (event delegation)
        inventorySlots.onclick = (e) => {
            const slot = e.target.closest('.inventory-item');
            if (slot && slot.itemData) {
                openUseItemModal(uid, slot.dataset.index, slot.itemData);
            }
        };

        setTimeout(() => document.getElementById('student-main-content').classList.remove('opacity-0'), 100);
        lucide.createIcons();
    });
}

// =======================================================
//                  LOGIKA TOKO SISWA
// =======================================================
async function openStudentShop(uid) {
    const shopModal = document.getElementById('student-shop-modal');
    const shopItemList = document.getElementById('student-shop-item-list');
    const studentCoinDisplay = document.getElementById('student-shop-coin-display');
    const closeButton = document.getElementById('close-student-shop-modal-button');

    if (!shopModal || !shopItemList || !studentCoinDisplay || !closeButton) {
        console.error("Elemen UI Toko Siswa tidak ditemukan! Pastikan ID elemen di student.html sudah benar.");
        showToast("Gagal membuka toko.", true);
        return;
    }

    let buyHandler; // Dideklarasikan di sini agar bisa dihapus nanti

    const closeShop = () => {
        audioPlayer.closeModal();
        shopModal.classList.add('opacity-0');
        setTimeout(() => {
            shopModal.classList.add('hidden');
            if (buyHandler) {
                shopItemList.removeEventListener('click', buyHandler); // Membersihkan event listener
            }
        }, 300);
    };

    buyHandler = async (e) => {
        const button = e.target.closest('.buy-item-btn');
        if (!button) return;

        button.disabled = true;
        button.textContent = 'Memproses...';

        const itemId = button.dataset.id;

        try {
            const studentRef = ref(db, `students/${uid}`);
            const itemRef = ref(db, `shopItems/${itemId}`);
            
            const studentSnap = await get(studentRef);
            const itemSnap = await get(itemRef);

            if (!studentSnap.exists() || !itemSnap.exists()) throw new Error("Data siswa atau item tidak ditemukan.");

            const studentData = studentSnap.val();
            const itemData = itemSnap.val();

            if ((studentData.coin || 0) < itemData.price) throw new Error("Koin tidak cukup!");
            if ((itemData.stock || 0) <= 0) throw new Error("Stok item habis!");

            const inventory = studentData.inventory || [];
            const inventorySize = 2 + ((studentData.level - 1) * 1);
            let emptySlotIndex = -1;
            for (let i = 0; i < inventorySize; i++) {
                if (!inventory[i]) { // Mencari slot kosong (null atau undefined)
                    emptySlotIndex = i;
                    break;
                }
            }
            if (emptySlotIndex === -1) throw new Error("Inventaris penuh!");

            const newCoin = (studentData.coin || 0) - itemData.price;
            const newStock = (itemData.stock || 0) - 1;
            const newItemForInventory = { name: itemData.name, description: itemData.description, effect: itemData.effect, effectValue: itemData.effectValue, iconUrl: itemData.imageBase64 };

            const updates = {};
            updates[`/students/${uid}/coin`] = newCoin;
            updates[`/shopItems/${itemId}/stock`] = newStock;
            updates[`/students/${uid}/inventory/${emptySlotIndex}`] = newItemForInventory;
            
            await update(ref(db), updates);
            
            showToast(`Berhasil membeli ${itemData.name}!`);
            audioPlayer.success();
            closeShop();

        } catch (error) {
            showToast(error.message, true);
            audioPlayer.error();
            // Menutup modal saat error agar pengguna melihat data terbaru saat membuka kembali
            closeShop();
        }
    };

    shopItemList.addEventListener('click', buyHandler);
    closeButton.onclick = closeShop;

    audioPlayer.openModal();
    shopModal.classList.remove('hidden');
    setTimeout(() => shopModal.classList.remove('opacity-0'), 10);

    shopItemList.innerHTML = '<p class="text-center text-gray-400 col-span-full">Memuat item...</p>';

    const [studentSnap, itemsSnap] = await Promise.all([get(ref(db, `students/${uid}`)), get(ref(db, 'shopItems'))]);

    if (!studentSnap.exists()) { showToast("Data siswa tidak ditemukan!", true); closeShop(); return; }

    const studentData = studentSnap.val();
    studentCoinDisplay.textContent = studentData.coin || 0;

    shopItemList.innerHTML = '';
    if (!itemsSnap.exists() || Object.keys(itemsSnap.val()).length === 0) { shopItemList.innerHTML = '<p class="text-center text-gray-400 col-span-full">Toko masih kosong.</p>'; return; }

    const itemsData = itemsSnap.val();
    Object.entries(itemsData).forEach(([itemId, item]) => {
        const canAfford = (studentData.coin || 0) >= item.price;
        const inStock = (item.stock || 0) > 0;
        const isBuyable = canAfford && inStock;
        const card = document.createElement('div');
        card.className = 'bg-white p-3 rounded-lg shadow flex flex-col';
        card.innerHTML = `<img src="${item.imageBase64 || 'https://placehold.co/300x200/e2e8f0/3d4852?text=Item'}" class="w-full h-24 object-cover rounded-md mb-2"><h4 class="text-md font-bold">${item.name}</h4><p class="text-xs text-gray-600 flex-grow mb-2">${item.description}</p><div class="flex justify-between items-center mt-2 text-sm"><span class="font-semibold text-yellow-600 flex items-center"><i data-lucide="coins" class="w-4 h-4 mr-1"></i>${item.price}</span><span class="text-gray-500 text-xs">Stok: ${item.stock}</span></div><div class="mt-auto pt-2"><button data-id="${itemId}" class="buy-item-btn w-full p-2 rounded-lg text-white font-bold text-sm ${isBuyable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}" ${!isBuyable ? 'disabled' : ''}>${canAfford ? (inStock ? 'Beli' : 'Stok Habis') : 'Koin Kurang'}</button></div>`;
        shopItemList.appendChild(card);
    });
    lucide.createIcons();
}

// =======================================================
//                  LOGIKA PENGGUNAAN ITEM
// =======================================================
function openUseItemModal(uid, itemIndex, itemData) {
    const modal = document.getElementById('use-item-modal');
    const nameEl = document.getElementById('use-item-name');
    const iconEl = document.getElementById('use-item-icon');
    const descEl = document.getElementById('use-item-description');
    const effectEl = document.getElementById('use-item-effect-text');
    const useButton = document.getElementById('use-item-confirm-button');
    const closeButton = document.getElementById('close-use-item-modal-button');

    if (!modal || !nameEl || !iconEl || !descEl || !effectEl || !useButton || !closeButton) {
        console.error("Elemen UI modal penggunaan item tidak ditemukan.");
        return;
    }

    // Isi modal dengan data item
    nameEl.textContent = itemData.name;
    iconEl.src = itemData.iconUrl || 'https://placehold.co/128x128/e2e8f0/3d4852?text=Item';
    descEl.textContent = itemData.description;
    
    let effectText = 'Efek tidak diketahui.';
    switch (itemData.effect) {
        case 'heal_hp':
            effectText = `Memulihkan ${itemData.effectValue} HP.`;
            break;
        case 'add_coin':
            effectText = `Menambahkan ${itemData.effectValue} Koin.`;
            break;
    }
    effectEl.textContent = effectText;

    const closeModal = () => {
        audioPlayer.closeModal();
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
        useButton.onclick = null; // Hapus listener untuk mencegah kebocoran memori
    };

    useButton.onclick = () => handleUseItem(uid, itemIndex, itemData, closeModal);
    closeButton.onclick = closeModal;

    // Tampilkan modal
    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

async function handleUseItem(uid, itemIndex, itemData, closeModalCallback) {
    const useButton = document.getElementById('use-item-confirm-button');
    useButton.disabled = true;
    useButton.textContent = 'Menggunakan...';

    try {
        const studentRef = ref(db, `students/${uid}`);
        const studentSnap = await get(studentRef);
        if (!studentSnap.exists()) throw new Error("Data siswa tidak ditemukan.");

        const studentData = studentSnap.val();
        const updates = {};
        let successMessage = `Berhasil menggunakan ${itemData.name}!`;

        // Terapkan efek item dan hapus dari inventaris dalam satu operasi
        if (itemData.effect === 'heal_hp') {
            updates[`/students/${uid}/hp`] = Math.min(100, (studentData.hp || 0) + itemData.effectValue);
        } else if (itemData.effect === 'add_coin') {
            updates[`/students/${uid}/coin`] = (studentData.coin || 0) + itemData.effectValue;
        }
        updates[`/students/${uid}/inventory/${itemIndex}`] = null;

        await update(ref(db), updates);
        showToast(successMessage);
        audioPlayer.success();
        closeModalCallback();
    } catch (error) {
        showToast(error.message, true);
        audioPlayer.error();
    } finally {
        useButton.disabled = false;
        useButton.textContent = 'Gunakan Item';
    }
}

// =======================================================
//                  LOGIKA DASBOR ADMIN
// =======================================================
function setupAdminDashboard() {
    // --- ELEMEN UI ADMIN ---
    const adminDashboardMain = document.getElementById('admin-dashboard-main');
    const questsPage = document.getElementById('quests-page');
    const addQuestButton = document.getElementById('add-quest-button');
    const questListContainer = document.getElementById('quest-list-container');

    const shopPage = document.getElementById('shop-page');
    const addShopItemButton = document.getElementById('add-shop-item-button');
    const shopItemList = document.getElementById('shop-item-list');

    const attendancePage = document.getElementById('attendance-page');
    const adminNavLinks = document.getElementById('admin-nav-links');
    const qrScannerModal = document.getElementById('qr-scanner-modal');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const studentIdInput = document.getElementById('student-id');
    const authFields = document.getElementById('auth-fields');
    const modalTitle = document.getElementById('modal-title');
    const fotoInput = document.getElementById('foto');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const studentTableBody = document.getElementById('student-table-body');
    const addStudentButton = document.getElementById('add-student-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const cancelButton = document.getElementById('cancel-button');
    const submitButton = document.getElementById('submit-button');
    const partyBattleButton = document.getElementById('party-battle-button');


    let currentBattleState = {}; // Untuk menyimpan state battle (ID siswa, monster, dll)
    let html5QrCode;
    
    // --- FUNGSI MODAL SISWA (DENGAN SUARA) ---
    const openModal = (isEdit = false) => {
        audioPlayer.openModal();
        studentForm.reset();
        studentIdInput.value = '';
        authFields.style.display = isEdit ? 'none' : 'block';
        modalTitle.textContent = isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru';
        imagePreviewContainer.classList.add('hidden');
        studentModal.classList.remove('hidden');
        setTimeout(() => studentModal.classList.remove('opacity-0'), 10);
    };
    const closeModal = () => {
        audioPlayer.closeModal();
        studentModal.classList.add('opacity-0');
        setTimeout(() => studentModal.classList.add('hidden'), 300);
    };
    const openQrModal = () => {
        audioPlayer.openModal();
        qrScannerModal.classList.remove('hidden');
        setTimeout(() => qrScannerModal.classList.remove('opacity-0'), 10);
        startQrScanner();
    };
    const closeQrModal = () => {
        audioPlayer.closeModal();
        qrScannerModal.classList.add('opacity-0');
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error("Gagal stop scanner.", err));
        }
        setTimeout(() => qrScannerModal.classList.add('hidden'), 300);
    };

    // --- EVENT LISTENER MODAL & NAVIGASI ---
    document.getElementById('admin-logout-button').onclick = () => signOut(auth);
    addStudentButton.onclick = () => openModal(false);
    closeModalButton.onclick = closeModal;
    cancelButton.onclick = closeModal;
    addQuestButton.onclick = () => openQuestModal();
    partyBattleButton.onclick = () => openPartyBattleModal();
    document.getElementById('print-recap-button').addEventListener('click', handlePrintRecap);
    fotoInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    adminNavLinks.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLink = e.target.closest('a');
        if (!targetLink) return;

        adminNavLinks.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'text-blue-600', 'border-blue-600');
            link.classList.add('text-gray-500', 'border-transparent');
        });
        targetLink.classList.add('active', 'text-blue-600', 'border-blue-600');
        targetLink.classList.remove('text-gray-500', 'border-transparent');
        
        const pageId = targetLink.getAttribute('href').substring(1);
        adminDashboardMain.classList.toggle('hidden', pageId !== 'dashboard');
        questsPage.classList.toggle('hidden', pageId !== 'quests');
        shopPage.classList.toggle('hidden', pageId !== 'shop');
        attendancePage.classList.toggle('hidden', pageId !== 'attendance');

        if (pageId === 'quests') setupQuestsPage();
        if (pageId === 'attendance') setupAttendancePage();
        if (pageId === 'shop') setupShopPage();
    });

    // --- FUNGSI DATA SISWA (ADMIN) ---
    const studentsRef = ref(db, 'students');
    onValue(studentsRef, (snapshot) => {
        studentTableBody.innerHTML = '';
        let totalStudents = 0, totalLevel = 0, totalCoins = 0;
        if (!snapshot.exists()) {
            studentTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-400">Belum ada siswa.</td></tr>';
        } else {
            const studentsData = snapshot.val();
            Object.keys(studentsData).forEach(key => {
                const student = studentsData[key];
                const studentRow = document.createElement('tr');
                studentRow.className = 'bg-white border-b hover:bg-gray-50';
                const avatar = student.fotoProfilBase64 ? 
                    `<img src="${student.fotoProfilBase64}" alt="${student.nama}" class="w-10 h-10 rounded-full object-cover">` : 
                    `<div class="w-10 h-10 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold">${student.nama.charAt(0)}</div>`;
                studentRow.innerHTML = `<td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center">${avatar}<div class="ml-4"><div class="font-bold">${student.nama}</div><div class="text-xs text-gray-500">NIS: ${student.nis} | ${student.kelas} | ${student.guild || 'No Guild'}</div></div></td><td class="px-6 py-4 text-center text-lg font-bold">${student.level || 1}</td><td class="px-6 py-4 text-center">${student.xp || 0}</td><td class="px-6 py-4"><div class="w-full bg-gray-200 rounded-full h-4 relative"><div class="bg-red-500 h-4 rounded-full" style="width: ${student.hp || 100}%"></div><span class="absolute inset-0 text-center text-xs font-bold text-white">${student.hp || 100}/100</span></div></td>
                <td class="px-6 py-4 text-center space-x-1">
                    <button class="battle-init-btn p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg" data-id="${key}" title="Mulai Battle"><i data-lucide="swords" class="w-4 h-4"></i></button>
                    <button class="edit-btn p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg" data-id="${key}" title="Edit Siswa"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button class="delete-btn p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg" data-id="${key}" title="Hapus Siswa"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>`;
                studentTableBody.appendChild(studentRow);
                totalStudents++;
                totalLevel += (student.level || 1);
                totalCoins += (student.coin || 0);
            });
        }
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('average-level').textContent = totalStudents > 0 ? (totalLevel / totalStudents).toFixed(1) : '0';
        document.getElementById('total-coins').textContent = totalCoins;
        lucide.createIcons();
    });

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';
        const id = studentIdInput.value;
        const totalXpInput = parseInt(document.getElementById('xp').value);
        const fotoFile = document.getElementById('foto').files[0];
        const xpPerLevel = 1000;
        let calculatedLevel = Math.floor(totalXpInput / xpPerLevel) + 1;
        let remainingXp = totalXpInput % xpPerLevel;
        
        let studentData = {
            nama: document.getElementById('nama').value,
            nis: document.getElementById('nis').value,
            kelas: document.getElementById('kelas').value,
            peran: document.getElementById('peran').value,
            guild: document.getElementById('guild').value,
            hp: parseInt(document.getElementById('hp').value),
            coin: parseInt(document.getElementById('coin').value),
            level: calculatedLevel,
            xp: remainingXp,
        };
        
        try {
            if (fotoFile) {
                showToast('Memproses foto...');
                const base64String = await processImageToBase64(fotoFile);
                const resizedBase64 = await resizeImage(base64String);
                studentData.fotoProfilBase64 = resizedBase64;
            }
            
            if (id) { 
                await update(ref(db, `students/${id}`), studentData);
                showToast('Data siswa berhasil diperbarui!');
            } else { 
                const email = document.getElementById('email-modal').value;
                const password = document.getElementById('password-modal').value;
                if (!email || !password) throw new Error('Email dan Password harus diisi!');
                studentData.inventory = [null, null]; 
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await set(ref(db, `students/${userCredential.user.uid}`), studentData);
                await set(ref(db, `roles/${userCredential.user.uid}`), { isStudent: true });
                showToast('Siswa baru berhasil dibuat!');
            }
            closeModal();
        } catch (error) {
            let message = 'Gagal menyimpan data!';
            if (error.code === 'auth/email-already-in-use') message = 'Email ini sudah terdaftar!';
            else if (error.code === 'auth/weak-password') message = 'Password terlalu lemah!';
            else if (error.message === 'Email dan Password harus diisi!') message = error.message;
            showToast(message, true);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan';
        }
    });

    studentTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        
        if (target.classList.contains('delete-btn')) {
            if (confirm('Yakin mau hapus data siswa ini, Beb? (Akun login tidak ikut terhapus)')) {
                await remove(ref(db, `students/${id}`));
                showToast('Data siswa berhasil dihapus.');
            }
        } else if (target.classList.contains('edit-btn')) {
            const snapshot = await get(ref(db, `students/${id}`));
            if (snapshot.exists()) {
                const student = snapshot.val();
                openModal(true);
                studentIdInput.value = id;
                document.getElementById('nama').value = student.nama;
                document.getElementById('nis').value = student.nis;
                document.getElementById('kelas').value = student.kelas;
                document.getElementById('peran').value = student.peran;
                document.getElementById('guild').value = student.guild;
                document.getElementById('xp').value = ((student.level - 1) * 1000) + student.xp;
                document.getElementById('hp').value = student.hp;
                document.getElementById('coin').value = student.coin || 0;
                if (student.fotoProfilBase64) {
                    imagePreview.src = student.fotoProfilBase64;
                    imagePreviewContainer.classList.remove('hidden');
                }
            }
        } else if (target.classList.contains('battle-init-btn')) {
            const studentId = target.dataset.id;
            openMonsterSelectionModal(studentId);
        }
    });

    // =======================================================
    //                  LOGIKA HALAMAN QUESTS
    // =======================================================
    const questModal = document.getElementById('quest-modal');
    const questForm = document.getElementById('quest-form');
    const closeQuestModalButton = document.getElementById('close-quest-modal-button');
    const cancelQuestButton = document.getElementById('cancel-quest-button');
    const monsterImageInput = document.getElementById('monster-image');
    const monsterImagePreview = document.getElementById('monster-image-preview');
    const addQuestionButton = document.getElementById('add-question-button');
    const questionsContainer = document.getElementById('questions-container');

    const openQuestModal = (isEdit = false, questData = null, questId = null) => {
        audioPlayer.openModal();
        questForm.reset();
        document.getElementById('quest-id').value = questId || '';
        questionsContainer.innerHTML = '';
        monsterImagePreview.classList.add('hidden');
        document.getElementById('quest-modal-title').textContent = isEdit ? 'Edit Monster' : 'Buat Monster Baru';

        if (isEdit && questData) {
            document.getElementById('monster-name').value = questData.monsterName;
            document.getElementById('monster-hp').value = questData.monsterHp;
            document.getElementById('monster-reward-coin').value = questData.rewardCoin;
            if (questData.monsterImageBase64) {
                monsterImagePreview.src = questData.monsterImageBase64;
                monsterImagePreview.classList.remove('hidden');
            }
            // Set skills
            questForm.querySelectorAll('.monster-skill').forEach(skillCheckbox => {
                skillCheckbox.checked = questData.skills?.[skillCheckbox.dataset.skill] || false;
            });
            // Set questions
            questData.questions?.forEach(q => addQuestionField(q));
        } else {
            addQuestionField(); // Add one empty question field by default
        }

        questModal.classList.remove('hidden');
        setTimeout(() => questModal.classList.remove('opacity-0'), 10);
    };

    const closeQuestModal = () => {
        audioPlayer.closeModal();
        questModal.classList.add('opacity-0');
        setTimeout(() => questModal.classList.add('hidden'), 300);
    };

    const addQuestionField = (data = {}) => {
        const questionId = `q-${Date.now()}`;
        const field = document.createElement('div');
        field.className = 'p-3 border rounded-md space-y-2 bg-gray-50 relative';
        field.innerHTML = `
            <button type="button" class="absolute top-2 right-2 text-red-500 hover:text-red-700 remove-question-btn">&times;</button>
            <input type="text" placeholder="Tulis pertanyaan..." value="${data.question || ''}" class="w-full p-2 border rounded-md question-input">
            <div class="grid grid-cols-2 gap-2">
                ${[0,1,2,3].map(i => `
                <div class="flex items-center">
                    <input type="radio" name="correct-answer-${questionId}" value="${i}" ${data.answer === i ? 'checked' : ''} class="mr-2 correct-answer-radio">
                    <input type="text" placeholder="Pilihan ${i+1}" value="${data.options?.[i] || ''}" class="w-full p-1 border rounded-md option-input">
                </div>`).join('')}
            </div>
        `;
        questionsContainer.appendChild(field);
        field.querySelector('.remove-question-btn').onclick = () => field.remove();
    };

    monsterImageInput.onchange = async function() {
        if (this.files && this.files[0]) {
            const base64 = await processImageToBase64(this.files[0]);
            const resized = await resizeImage(base64, 200, 200);
            monsterImagePreview.src = resized;
            monsterImagePreview.classList.remove('hidden');
        }
    };

    addQuestionButton.onclick = () => addQuestionField();
    closeQuestModalButton.onclick = closeQuestModal;
    cancelQuestButton.onclick = closeQuestModal;

    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const questId = document.getElementById('quest-id').value;
        const questions = [];
        questionsContainer.querySelectorAll('.p-3.border').forEach(qDiv => {
            const options = Array.from(qDiv.querySelectorAll('.option-input')).map(opt => opt.value);
            const correctAnswerRadio = qDiv.querySelector('.correct-answer-radio:checked');
            if (qDiv.querySelector('.question-input').value && options.every(o => o) && correctAnswerRadio) {
                questions.push({
                    question: qDiv.querySelector('.question-input').value,
                    options: options,
                    answer: parseInt(correctAnswerRadio.value)
                });
            }
        });

        const skills = {};
        questForm.querySelectorAll('.monster-skill:checked').forEach(skill => {
            skills[skill.dataset.skill] = true;
        });

        const questData = {
            monsterName: document.getElementById('monster-name').value,
            monsterHp: parseInt(document.getElementById('monster-hp').value),
            monsterMaxHp: parseInt(document.getElementById('monster-hp').value),
            rewardCoin: parseInt(document.getElementById('monster-reward-coin').value),
            monsterImageBase64: monsterImagePreview.src.startsWith('data:image') ? monsterImagePreview.src : null,
            skills: skills,
            questions: questions
        };

        try {
            if (questId) {
                await update(ref(db, `quests/${questId}`), questData);
                showToast('Monster berhasil diperbarui!');
            } else {
                await push(ref(db, 'quests'), questData);
                showToast('Monster baru berhasil dibuat!');
            }
            closeQuestModal();
        } catch (error) {
            showToast('Gagal menyimpan monster!', true);
            console.error(error);
        }
    });

    function setupQuestsPage() {
        const questsRef = ref(db, 'quests');
        onValue(questsRef, (snapshot) => {
            questListContainer.innerHTML = '';
            if (!snapshot.exists()) {
                questListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Belum ada monster quest.</p>';
                return;
            }
            const questsData = snapshot.val();
            Object.entries(questsData).forEach(([questId, quest]) => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-lg flex flex-col';
                card.innerHTML = `
                    <img src="${quest.monsterImageBase64 || 'https://placehold.co/300x200/a0aec0/ffffff?text=Monster'}" class="w-full h-32 object-cover rounded-md mb-4">
                    <h4 class="text-lg font-bold">${quest.monsterName}</h4>
                    <p class="text-sm text-red-500">HP: ${quest.monsterHp}</p>
                    <p class="text-sm text-yellow-500">Reward: ${quest.rewardCoin} Koin</p>
                    <div class="mt-auto pt-4 flex justify-end items-center">
                        <button data-id="${questId}" class="edit-quest-btn p-1 text-blue-600 hover:text-blue-800" title="Edit Monster"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button data-id="${questId}" class="delete-quest-btn p-1 text-red-600 hover:text-red-800" title="Hapus Monster"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                questListContainer.appendChild(card);
            });
            lucide.createIcons();
        });
    }

    questListContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const questId = button.dataset.id;

        if (button.classList.contains('delete-quest-btn')) {
            if (confirm('Yakin mau hapus monster ini?')) {
                await remove(ref(db, `quests/${questId}`));
                showToast('Monster berhasil dihapus.');
            }
        } else if (button.classList.contains('edit-quest-btn')) {
            const questSnap = await get(ref(db, `quests/${questId}`));
            if (questSnap.exists()) {
                openQuestModal(true, questSnap.val(), questId);
            }
        }
    });

    // =======================================================
    //                  LOGIKA HALAMAN SHOP
    // =======================================================
    const shopItemModal = document.getElementById('shop-item-modal');
    const shopItemForm = document.getElementById('shop-item-form');
    const closeShopItemModalButton = document.getElementById('close-shop-item-modal-button');
    const cancelShopItemButton = document.getElementById('cancel-shop-item-button');
    const itemImageInput = document.getElementById('item-image');
    const itemImagePreview = document.getElementById('item-image-preview');

    const openShopItemModal = (isEdit = false, itemData = null, itemId = null) => {
        audioPlayer.openModal();
        shopItemForm.reset();
        document.getElementById('shop-item-id').value = itemId || '';
        itemImagePreview.classList.add('hidden');
        itemImagePreview.src = '';
        document.getElementById('shop-item-modal-title').textContent = isEdit ? 'Edit Item' : 'Tambah Item Baru';

        if (isEdit && itemData) {
            document.getElementById('item-name').value = itemData.name;
            document.getElementById('item-description').value = itemData.description;
            document.getElementById('item-effect').value = itemData.effect;
            document.getElementById('item-effect-value').value = itemData.effectValue || '';
            document.getElementById('item-price').value = itemData.price;
            document.getElementById('item-stock').value = itemData.stock;
            if (itemData.imageBase64) {
                itemImagePreview.src = itemData.imageBase64;
                itemImagePreview.classList.remove('hidden');
            }
        }

        shopItemModal.classList.remove('hidden');
        setTimeout(() => shopItemModal.classList.remove('opacity-0'), 10);
    };

    const closeShopItemModal = () => {
        audioPlayer.closeModal();
        shopItemModal.classList.add('opacity-0');
        setTimeout(() => shopItemModal.classList.add('hidden'), 300);
    };

    addShopItemButton.onclick = () => openShopItemModal();
    closeShopItemModalButton.onclick = closeShopItemModal;
    cancelShopItemButton.onclick = closeShopItemModal;

    itemImageInput.onchange = async function() {
        if (this.files && this.files[0]) {
            const base64 = await processImageToBase64(this.files[0]);
            const resized = await resizeImage(base64, 200, 200);
            itemImagePreview.src = resized;
            itemImagePreview.classList.remove('hidden');
        }
    };

    shopItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemId = document.getElementById('shop-item-id').value;
        
        const itemData = {
            name: document.getElementById('item-name').value,
            description: document.getElementById('item-description').value,
            effect: document.getElementById('item-effect').value,
            effectValue: parseInt(document.getElementById('item-effect-value').value) || 0,
            price: parseInt(document.getElementById('item-price').value),
            stock: parseInt(document.getElementById('item-stock').value),
            imageBase64: itemImagePreview.src.startsWith('data:image') ? itemImagePreview.src : null,
        };

        try {
            if (itemId) {
                await update(ref(db, `shopItems/${itemId}`), itemData);
                showToast('Item berhasil diperbarui!');
            } else {
                await push(ref(db, 'shopItems'), itemData);
                showToast('Item baru berhasil ditambahkan ke toko!');
            }
            closeShopItemModal();
        } catch (error) {
            showToast('Gagal menyimpan item!', true);
            console.error(error);
        }
    });

    function setupShopPage() {
        const shopItemsRef = ref(db, 'shopItems');
        onValue(shopItemsRef, (snapshot) => {
            shopItemList.innerHTML = '';
            if (!snapshot.exists()) {
                shopItemList.innerHTML = '<p class="text-center text-gray-400 col-span-full">Toko masih kosong. Tambahkan item baru!</p>';
                return;
            }
            const itemsData = snapshot.val();
            Object.entries(itemsData).forEach(([itemId, item]) => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-lg flex flex-col';
                card.innerHTML = `
                    <img src="${item.imageBase64 || 'https://placehold.co/300x200/e2e8f0/3d4852?text=Item'}" class="w-full h-32 object-cover rounded-md mb-4">
                    <h4 class="text-lg font-bold">${item.name}</h4>
                    <p class="text-sm text-gray-600 flex-grow mb-2">${item.description}</p>
                    <div class="flex justify-between items-center mt-2 text-sm">
                        <span class="font-semibold text-yellow-600">${item.price} Koin</span>
                        <span class="text-gray-500">Stok: ${item.stock}</span>
                    </div>
                    <div class="mt-auto pt-4 flex justify-end items-center gap-2">
                        <button data-id="${itemId}" class="edit-item-btn p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg" title="Edit Item"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button data-id="${itemId}" class="delete-item-btn p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg" title="Hapus Item"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                shopItemList.appendChild(card);
            });
            lucide.createIcons();
        });
    }

    shopItemList.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const itemId = button.dataset.id;

        if (button.classList.contains('delete-item-btn')) {
            if (confirm('Yakin mau hapus item ini dari toko?')) {
                await remove(ref(db, `shopItems/${itemId}`));
                showToast('Item berhasil dihapus.');
            }
        } else if (button.classList.contains('edit-item-btn')) {
            const itemSnap = await get(ref(db, `shopItems/${itemId}`));
            if (itemSnap.exists()) {
                openShopItemModal(true, itemSnap.val(), itemId);
            }
        }
    });

    // =======================================================
    //                  LOGIKA BATTLE BARU
    // =======================================================
    async function openMonsterSelectionModal(studentId) {
        currentBattleState = { studentId: studentId }; // Reset dan set ID siswa
        const monsterSelectionModal = document.getElementById('monster-selection-modal');
        const monsterListDiv = document.getElementById('monster-selection-list');
        const closeButton = document.getElementById('close-monster-selection-modal-button');

        monsterListDiv.innerHTML = '<p class="text-center text-gray-400">Memuat data monster...</p>';
        
        audioPlayer.openModal();
        monsterSelectionModal.classList.remove('hidden');
        setTimeout(() => monsterSelectionModal.classList.remove('opacity-0'), 10);

        const questsRef = ref(db, 'quests');
        const snapshot = await get(questsRef);

        if (!snapshot.exists()) {
            monsterListDiv.innerHTML = '<p class="text-center text-gray-400">Tidak ada monster yang tersedia untuk dilawan.</p>';
            return;
        }

        monsterListDiv.innerHTML = ''; // Hapus teks loading
        const questsData = snapshot.val();
        Object.entries(questsData).forEach(([questId, quest]) => {
            const monsterCard = document.createElement('div');
            monsterCard.className = 'flex items-center p-4 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors';
            monsterCard.dataset.id = questId;
            monsterCard.innerHTML = `
                <img src="${quest.monsterImageBase64 || 'https://placehold.co/64x64/a0aec0/ffffff?text=M'}" class="w-16 h-16 object-cover rounded-md mr-4">
                <div>
                    <h4 class="font-bold text-lg">${quest.monsterName}</h4>
                    <p class="text-sm text-gray-600">HP: ${quest.monsterHp} | Reward: ${quest.rewardCoin} Koin</p>
                </div>
            `;
            monsterListDiv.appendChild(monsterCard);
        });

        const closeMonsterModal = () => {
            audioPlayer.closeModal();
            monsterSelectionModal.classList.add('opacity-0');
            setTimeout(() => monsterSelectionModal.classList.add('hidden'), 300);
        };

        closeButton.onclick = closeMonsterModal;

        monsterListDiv.onclick = (e) => {
            const selectedCard = e.target.closest('[data-id]');
            if (selectedCard && selectedCard.dataset.id) {
                currentBattleState.monsterId = selectedCard.dataset.id;
                closeMonsterModal();
                startBattle(currentBattleState.studentId, currentBattleState.monsterId);
            }
        };
    }

    async function startBattle(studentId, monsterId) {
        const studentSnap = await get(ref(db, `students/${studentId}`));
        const monsterSnap = await get(ref(db, `quests/${monsterId}`));

        if (!studentSnap.exists() || !monsterSnap.exists()) {
            showToast("Data siswa atau monster tidak ditemukan!", true);
            return;
        }

        let student = { id: studentId, ...studentSnap.val() };
        let monster = { id: monsterId, ...monsterSnap.val() };
        
        monster.currentHp = monster.monsterHp;
        monster.maxHp = monster.monsterMaxHp || monster.monsterHp;
        student.currentHp = student.hp;
        student.maxHp = 100;
        
        const party = [student]; // Untuk solo battle, party berisi 1 siswa

        setupBattleUI(party, monster);
    }
    
    // --- LOGIKA PARTY BATTLE ---
    async function openPartyBattleModal() {
        const partyBattleModal = document.getElementById('party-battle-modal');
        const closeButton = document.getElementById('close-party-battle-modal-button');
        const startButton = document.getElementById('start-party-battle-button');
        const monsterListDiv = document.getElementById('party-monster-selection-list');
        const guildSelect = document.getElementById('guild-select');

        // Reset UI state saat modal dibuka
        startButton.disabled = true;
        guildSelect.disabled = true;
        guildSelect.innerHTML = '<option value="">Memuat daftar guild...</option>';

        // --- LOGIKA BARU: Mengambil dan mengisi daftar guild dari database ---
        try {
            const studentsSnap = await get(ref(db, 'students'));
            const guilds = new Set(); // Menggunakan Set agar nama guild tidak duplikat
            if (studentsSnap.exists()) {
                studentsSnap.forEach(childSnap => {
                    const student = childSnap.val();
                    if (student.guild && student.guild.trim() !== '') {
                        guilds.add(student.guild);
                    }
                });
            }

            guildSelect.innerHTML = ''; // Hapus pesan "Memuat..."
            if (guilds.size > 0) {
                guilds.forEach(guild => {
                    guildSelect.innerHTML += `<option value="${guild}">Guild ${guild}</option>`;
                });
                guildSelect.disabled = false; // Aktifkan dropdown
                startButton.disabled = false; // Aktifkan tombol start
            } else {
                guildSelect.innerHTML = '<option value="">Tidak ada guild ditemukan</option>';
            }
        } catch (error) {
            console.error("Gagal memuat data guild:", error);
            guildSelect.innerHTML = '<option value="">Gagal memuat guild</option>';
        }

        monsterListDiv.innerHTML = '<p class="text-center text-gray-400">Memuat monster...</p>';
        audioPlayer.openModal();
        partyBattleModal.classList.remove('hidden');
        setTimeout(() => partyBattleModal.classList.remove('opacity-0'), 10);
        
        const questsRef = ref(db, 'quests');
        const snapshot = await get(questsRef);

        if (!snapshot.exists()) {
            monsterListDiv.innerHTML = '<p class="text-center text-gray-400">Tidak ada monster.</p>';
        } else {
            monsterListDiv.innerHTML = '';
            const questsData = snapshot.val();
            Object.entries(questsData).forEach(([questId, quest], index) => {
                const checked = index === 0 ? 'checked' : '';
                monsterListDiv.innerHTML += `
                    <label class="flex items-center p-2 rounded-md hover:bg-gray-100">
                        <input type="radio" name="monster-select" value="${questId}" class="mr-3" ${checked}>
                        <span>${quest.monsterName} (HP: ${quest.monsterHp})</span>
                    </label>
                `;
            });
        }
        
        const closePartyModal = () => {
            audioPlayer.closeModal();
            partyBattleModal.classList.add('opacity-0');
            setTimeout(() => partyBattleModal.classList.add('hidden'), 300);
        };

        closeButton.onclick = closePartyModal;
        startButton.onclick = async () => {
            const selectedGuild = document.getElementById('guild-select').value;
            const selectedMonsterId = document.querySelector('input[name="monster-select"]:checked')?.value;

            if (!selectedMonsterId) {
                showToast("Pilih monster dulu, Beb!", true);
                return;
            }
            
            const studentsQuery = query(ref(db, 'students'), orderByChild('guild'), equalTo(selectedGuild));
            const studentsSnap = await get(studentsQuery);
            
            if (!studentsSnap.exists()) {
                showToast(`Tidak ada siswa di Guild ${selectedGuild}!`, true);
                return;
            }
            
            const party = [];
            studentsSnap.forEach(childSnap => {
                party.push({ id: childSnap.key, ...childSnap.val() });
            });
            
            const monsterSnap = await get(ref(db, `quests/${selectedMonsterId}`));
            if (!monsterSnap.exists()) {
                 showToast("Monster tidak ditemukan!", true);
                 return;
            }
            
            let monster = { id: selectedMonsterId, ...monsterSnap.val() };
            // Scaling HP monster berdasarkan jumlah anggota party
            monster.monsterHp *= party.length;
            monster.monsterMaxHp = monster.monsterHp;

            closePartyModal();
            setupBattleUI(party, monster);
        };
    }
    
    
    // FUNGSI INTI UNTUK MENGATUR BATTLE (SOLO & PARTY)
    async function setupBattleUI(party, monster) {
        
        // Inisialisasi state pertarungan
        party.forEach(p => {
            p.currentHp = p.hp;
            p.maxHp = 100;
        });
        monster.currentHp = monster.monsterHp;

        let currentTurnIndex = 0;
        let currentQuestionIndex = 0;
        const questions = monster.questions || [];

        // Elemen UI
        const battleModal = document.getElementById('battle-modal');
        const battleLog = document.getElementById('battle-log');
        const studentInfoDiv = document.getElementById('battle-student-info');
        const monsterInfoDiv = document.getElementById('battle-monster-info');
        const questionText = document.getElementById('battle-question-text');
        const turnIndicator = document.getElementById('turn-indicator');
        const correctButton = document.getElementById('answer-correct-button');
        const incorrectButton = document.getElementById('answer-incorrect-button');
        const closeBattleButton = document.getElementById('close-battle-modal-button');

        const addLog = (text) => {
            battleLog.innerHTML += `> ${text}\n`;
            battleLog.scrollTop = battleLog.scrollHeight;
        };

        const updateUI = () => {
            // Update Info Party
            studentInfoDiv.innerHTML = '';
            party.forEach(p => {
                const hpPercent = Math.max(0, (p.currentHp / p.maxHp) * 100);
                const isTurn = party[currentTurnIndex].id === p.id;
                const turnClass = isTurn ? 'border-blue-500 border-4' : 'border-gray-200 border-2';
                studentInfoDiv.innerHTML += `
                    <div class="flex items-center gap-3 p-2 rounded-lg ${turnClass}">
                        <img src="${p.fotoProfilBase64 || `https://placehold.co/64x64/e2e8f0/3d4852?text=${p.nama.charAt(0)}`}" class="w-12 h-12 rounded-full object-cover">
                        <div class="flex-grow">
                            <p class="font-bold text-sm">${p.nama}</p>
                            <div class="w-full bg-gray-200 rounded-full h-4 relative mt-1">
                                <div class="bg-red-500 h-4 rounded-full" style="width: ${hpPercent}%"></div>
                                <span class="absolute inset-0 text-center text-xs font-bold text-white">${p.currentHp}/${p.maxHp}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Update Info Monster
            const monsterHpPercent = Math.max(0, (monster.currentHp / monster.maxHp) * 100);
            monsterInfoDiv.innerHTML = `
                <h4 class="text-lg font-bold">MONSTER</h4>
                <h4 class="text-xl font-bold">${monster.monsterName}</h4>
                <img src="${monster.monsterImageBase64 || 'https://placehold.co/128x128/a0aec0/ffffff?text=M'}" class="w-32 h-32 object-contain mx-auto my-2">
                <div class="w-full bg-gray-200 rounded-full h-6 relative"><div class="bg-green-500 h-6 rounded-full" style="width: ${monsterHpPercent}%"></div><span class="absolute inset-0 text-center font-bold text-white leading-6">${monster.currentHp} / ${monster.maxHp}</span></div>`;
            
            // Update giliran
            turnIndicator.textContent = `Giliran: ${party[currentTurnIndex].nama}`;
        };
        
        const loadQuestion = () => {
            correctButton.disabled = false;
            incorrectButton.disabled = false;
            if (questions.length > 0) {
                questionText.textContent = questions[currentQuestionIndex % questions.length].question;
            } else {
                questionText.textContent = "Tidak ada pertanyaan. Monster akan menyerang jika jawaban salah!";
            }
        };

        const endBattle = async (isVictory) => {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            
            const updates = {};
            if (isVictory) {
                addLog(`🎉 ${monster.monsterName} telah dikalahkan! Guild Menang!`);
                questionText.textContent = "SELAMAT! KALIAN MENANG!";
                
                const xpReward = 50;
                const coinReward = Math.ceil((monster.rewardCoin || 0) / party.length);

                party.forEach(p => {
                     if (p.currentHp > 0) { // Hanya yang selamat dapat hadiah
                        const currentTotalXp = ((p.level || 1) - 1) * 1000 + (p.xp || 0);
                        const newTotalXp = currentTotalXp + xpReward;
                        updates[`/students/${p.id}/xp`] = newTotalXp % 1000;
                        updates[`/students/${p.id}/level`] = Math.floor(newTotalXp / 1000) + 1;
                        updates[`/students/${p.id}/coin`] = (p.coin || 0) + coinReward;
                     }
                     updates[`/students/${p.id}/hp`] = p.currentHp; // Update HP terakhir
                });
                
                addLog(`Setiap anggota yang selamat mendapat ${xpReward} XP dan ${coinReward} Koin.`);
                audioPlayer.success();

            } else {
                addLog(`☠️ Semua anggota party telah dikalahkan!`);
                questionText.textContent = "YAH, KALIAN KALAH...";
                party.forEach(p => {
                    updates[`/students/${p.id}/hp`] = p.currentHp; // Simpan HP terakhir
                });
                audioPlayer.error();
            }

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                addLog("Data semua siswa telah diperbarui.");
            }
        };

        const handleAnswer = (isCorrect) => {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            
            const currentPlayer = party[currentTurnIndex];

            if (isCorrect) {
                const studentDamage = 25 + Math.floor(Math.random() * 10); // Contoh damage
                monster.currentHp = Math.max(0, monster.currentHp - studentDamage);
                addLog(`Jawaban BENAR! ${currentPlayer.nama} menyerang, ${studentDamage} damage.`);
                audioPlayer.xpGain();
                updateUI();
                if (monster.currentHp <= 0) {
                    endBattle(true);
                    return;
                }
            } else {
                const monsterDamage = 15 + Math.floor(Math.random() * 10); // Contoh damage
                currentPlayer.currentHp = Math.max(0, currentPlayer.currentHp - monsterDamage);
                addLog(`Jawaban SALAH! ${monster.monsterName} menyerang ${currentPlayer.nama}, ${monsterDamage} damage.`);
                audioPlayer.hpLoss();
                updateUI();

                const isPartyDefeated = party.every(p => p.currentHp <= 0);
                if (isPartyDefeated) {
                    endBattle(false);
                    return;
                }
            }
            
            // Pindah ke giliran berikutnya yang masih hidup
            do {
                currentTurnIndex = (currentTurnIndex + 1) % party.length;
            } while (party[currentTurnIndex].currentHp <= 0);

            currentQuestionIndex++;
            setTimeout(loadQuestion, 1200); // Jeda sebelum pertanyaan berikutnya
            updateUI();
        };

        battleLog.innerHTML = '';
        addLog("Pertarungan dimulai!");
        updateUI();
        loadQuestion();

        correctButton.onclick = () => handleAnswer(true);
        incorrectButton.onclick = () => handleAnswer(false);

        const closeAndResetBattle = () => {
            audioPlayer.closeModal();
            battleModal.classList.add('opacity-0');
            setTimeout(() => battleModal.classList.add('hidden'), 300);
            correctButton.onclick = null;
            incorrectButton.onclick = null;
            closeBattleButton.onclick = null;
        };
        closeBattleButton.onclick = closeAndResetBattle;

        audioPlayer.openModal();
        battleModal.classList.remove('hidden');
        setTimeout(() => battleModal.classList.remove('opacity-0'), 10);
    }

    
    // --- LOGIKA HALAMAN ATTENDANCE ---
    async function setupAttendancePage() {
        const attendanceContainer = document.getElementById('attendance-container');
        const snapshot = await get(ref(db, 'students'));
        if (!snapshot.exists()) {
            attendanceContainer.innerHTML = '<p class="text-center text-gray-400">Belum ada siswa.</p>';
            return;
        }

        const studentsByClass = {};
        Object.entries(snapshot.val()).forEach(([uid, student]) => {
            if (!studentsByClass[student.kelas]) studentsByClass[student.kelas] = [];
            studentsByClass[student.kelas].push({ uid, ...student });
        });
        
        attendanceContainer.innerHTML = '';
        for (const kelas in studentsByClass) {
            const classSection = document.createElement('div');
            classSection.innerHTML = `<h3 class="text-lg font-bold border-b-2 border-blue-200 pb-2 mb-4">${kelas}</h3>`;
            const studentGrid = document.createElement('div');
            studentGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
            
            studentsByClass[kelas].forEach(student => {
                const avatar = student.fotoProfilBase64 ? 
                    `<img src="${student.fotoProfilBase64}" alt="${student.nama}" class="w-16 h-16 rounded-full object-cover">` : 
                    `<div class="w-16 h-16 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold text-2xl">${student.nama.charAt(0)}</div>`;
                studentGrid.innerHTML += `
                    <div class="bg-gray-50 p-4 rounded-lg shadow flex flex-col gap-4">
                        <div class="flex items-center gap-4">
                            ${avatar}
                            <div>
                                <p class="font-bold text-gray-800">${student.nama}</p>
                                <p class="text-sm text-gray-500">NIS: ${student.nis}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button data-uid="${student.uid}" data-action="hadir" class="attendance-btn bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-2 rounded">Hadir</button>
                            <button data-uid="${student.uid}" data-action="sakit" class="attendance-btn bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-2 rounded">Sakit</button>
                            <button data-uid="${student.uid}" data-action="izin" class="attendance-btn bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-2 rounded">Izin</button>
                            <button data-uid="${student.uid}" data-action="alfa" class="attendance-btn bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-2 rounded">Alfa</button>
                        </div>
                    </div>`;
            });
            classSection.appendChild(studentGrid);
            attendanceContainer.appendChild(classSection);
        }
    }
    
    // --- FUNGSI UPDATE STATS & LOG ABSENSI (DENGAN SUARA) ---
    async function updateStudentStats(uid, action, studentData = null) {
        const studentRef = ref(db, `students/${uid}`);
        const data = studentData || (await get(studentRef)).val();
        if (!data) return;

        const allUpdates = {};
        let message = '';
        const xpPerLevel = 1000;
        
        let statUpdates = {};
        switch(action) {
            case 'hadir':
                const currentTotalXp = ((data.level || 1) - 1) * xpPerLevel + (data.xp || 0);
                const newTotalXp = currentTotalXp + 10;
                statUpdates.xp = newTotalXp % xpPerLevel;
                statUpdates.level = Math.floor(newTotalXp / xpPerLevel) + 1;
                statUpdates.coin = (data.coin || 0) + 10;
                message = `+10 XP, +10 Koin untuk ${data.nama}!`;
                audioPlayer.xpGain(); // Suara dapat XP
                break;
            case 'sakit':
                statUpdates.hp = Math.max(0, (data.hp || 100) - 2);
                message = `-2 HP untuk ${data.nama}. Cepat sembuh!`;
                audioPlayer.hpLoss(); // Suara kena damage
                break;
            case 'izin':
                statUpdates.hp = Math.max(0, (data.hp || 100) - 5);
                message = `-5 HP untuk ${data.nama}.`;
                audioPlayer.hpLoss(); // Suara kena damage
                break;
            case 'alfa':
                statUpdates.hp = Math.max(0, (data.hp || 100) - 10);
                message = `-10 HP untuk ${data.nama}. Jangan diulangi!`;
                audioPlayer.hpLoss(); // Suara kena damage
                break;
        }

        // Gabungkan semua update dalam satu operasi
        for (const key in statUpdates) {
            allUpdates[`/students/${uid}/${key}`] = statUpdates[key];
        }
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        allUpdates[`/attendance/${today}/${uid}`] = { status: action };

        try {
            await update(ref(db), allUpdates);
            showToast(message);
        } catch (error) {
            showToast('Gagal update data & absensi!', true);
            console.error(error);
        }
    }
    
    document.getElementById('attendance-container').addEventListener('click', (e) => {
        const target = e.target.closest('.attendance-btn');
        if (target) updateStudentStats(target.dataset.uid, target.dataset.action);
    });
    
    // --- LOGIKA QR CODE SCANNER ---
    document.getElementById('scan-qr-button').addEventListener('click', openQrModal);
    document.getElementById('close-qr-modal-button').addEventListener('click', closeQrModal);
    
    function startQrScanner() {
        const qrResultElem = document.getElementById('qr-scan-result');
        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText, decodedResult) => {
                qrResultElem.textContent = `NIS terdeteksi: ${decodedText}. Mencari...`;
                html5QrCode.stop();
                closeQrModal();
                findStudentByNisAndMarkPresent(decodedText);
            })
            .catch(err => qrResultElem.textContent = "Gagal memulai kamera.");
    }
    
    async function findStudentByNisAndMarkPresent(nis) {
        const snapshot = await get(query(ref(db, 'students'), orderByChild('nis'), equalTo(nis)));
        if (snapshot.exists()) {
            const [uid, student] = Object.entries(snapshot.val())[0];
            updateStudentStats(uid, 'hadir', student);
        } else {
            showToast(`Siswa dengan NIS ${nis} tidak ditemukan!`, true);
        }
    }

    // --- FUNGSI BARU UNTUK CETAK REKAP ---
    async function handlePrintRecap() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            showToast('Silakan pilih rentang tanggal terlebih dahulu!', true);
            return;
        }

        showToast('Mempersiapkan rekap...');

        const studentsSnap = await get(ref(db, 'students'));
        const attendanceSnap = await get(ref(db, 'attendance'));

        if (!studentsSnap.exists()) {
            showToast('Tidak ada data siswa untuk direkap.', true);
            return;
        }

        const studentsData = studentsSnap.val();
        const attendanceData = attendanceSnap.exists() ? attendanceSnap.val() : {};

        const dateList = [];
        let currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        while (currentDate <= lastDate) {
            dateList.push(currentDate.toISOString().slice(0, 10));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const reportData = Object.fromEntries(
            Object.entries(studentsData).map(([uid, student]) => [
                uid,
                {
                    name: student.nama,
                    nis: student.nis,
                    attendance: {},
                    summary: { H: 0, S: 0, I: 0, A: 0 }
                }
            ])
        );

        dateList.forEach(date => {
            for (const uid in reportData) {
                const statusChar = attendanceData[date]?.[uid]?.status.charAt(0).toUpperCase() || '-';
                reportData[uid].attendance[date] = statusChar;
                if (statusChar !== '-') {
                    if (statusChar === 'H') reportData[uid].summary.H++;
                    else if (statusChar === 'S') reportData[uid].summary.S++;
                    else if (statusChar === 'I') reportData[uid].summary.I++;
                    else if (statusChar === 'A') reportData[uid].summary.A++;
                }
            }
        });

        let html = `
            <!DOCTYPE html><html><head><title>Rekap Absensi</title><style>
            body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid black; padding: 4px; text-align: center; } th { background-color: #f2f2f2; }
            .student-name { text-align: left; } @media print { @page { size: landscape; } body { -webkit-print-color-adjust: exact; } }
            </style></head><body><h2>Rekap Absensi Siswa</h2><p>Periode: ${startDate} s/d ${endDate}</p><table><thead>
            <tr><th rowspan="2">No</th><th rowspan="2">Nama Siswa</th><th rowspan="2">NIS</th><th colspan="${dateList.length}">Tanggal</th><th colspan="4">Total</th></tr>
            <tr>${dateList.map(d => `<th>${d.slice(8,10)}</th>`).join('')}<th>H</th><th>S</th><th>I</th><th>A</th></tr></thead><tbody>`;

        let counter = 1;
        for (const uid in reportData) {
            const student = reportData[uid];
            html += `<tr><td>${counter++}</td><td class="student-name">${student.name}</td><td>${student.nis}</td>
                ${dateList.map(date => `<td>${student.attendance[date]}</td>`).join('')}
                <td>${student.summary.H}</td><td>${student.summary.S}</td><td>${student.summary.I}</td><td>${student.summary.A}</td></tr>`;
        }

        html += `</tbody></table></body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    lucide.createIcons();
}

// Panggil lucide.createIcons() secara global sekali untuk halaman login & student
lucide.createIcons();
