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


// --- FUNGSI TAMPILAN & NOTIFIKASI (shared) ---
const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    toast.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => toast.classList.add('hidden'), 3000);
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
    const studentRef = ref(db, `students/${uid}`);
    onValue(studentRef, (snapshot) => {
        if(!snapshot.exists()) return;
        const studentData = snapshot.val();
        document.getElementById('student-name').textContent = studentData.nama;
        document.getElementById('student-class-role').textContent = `${studentData.kelas} | ${studentData.peran}`;
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
            const slot = document.createElement('div');
            slot.className = 'w-20 h-20 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400';
            slot.innerHTML = item ? `<img src="${item.iconUrl}" title="${item.name}">` : `<span>Kosong</span>`;
            inventorySlots.appendChild(slot);
        }
        setTimeout(() => document.getElementById('student-main-content').classList.remove('opacity-0'), 100);
        lucide.createIcons();
    });
}


// =======================================================
//                  LOGIKA DASBOR ADMIN
// =======================================================
function setupAdminDashboard() {
    // --- ELEMEN UI ADMIN ---
    const adminDashboardMain = document.getElementById('admin-dashboard-main');
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
    let html5QrCode;
    
    // --- FUNGSI MODAL ADMIN ---
    const openModal = (isEdit = false) => {
        studentForm.reset();
        studentIdInput.value = '';
        authFields.style.display = isEdit ? 'none' : 'block';
        modalTitle.textContent = isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru';
        imagePreviewContainer.classList.add('hidden');
        studentModal.classList.remove('hidden');
        setTimeout(() => studentModal.classList.remove('opacity-0'), 10);
    };
    const closeModal = () => {
        studentModal.classList.add('opacity-0');
        setTimeout(() => studentModal.classList.add('hidden'), 300);
    };
    const openQrModal = () => {
        qrScannerModal.classList.remove('hidden');
        setTimeout(() => qrScannerModal.classList.remove('opacity-0'), 10);
        startQrScanner();
    };
    const closeQrModal = () => {
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
        attendancePage.classList.toggle('hidden', pageId !== 'attendance');

        if (pageId === 'attendance') setupAttendancePage();
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
                studentRow.innerHTML = `<td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center">${avatar}<div class="ml-4"><div class="font-bold">${student.nama}</div><div class="text-xs text-gray-500">NIS: ${student.nis} | ${student.kelas}</div></div></td><td class="px-6 py-4 text-center text-lg font-bold">${student.level || 1}</td><td class="px-6 py-4 text-center">${student.xp || 0}</td><td class="px-6 py-4"><div class="w-full bg-gray-200 rounded-full h-4 relative"><div class="bg-red-500 h-4 rounded-full" style="width: ${student.hp || 100}%"></div><span class="absolute inset-0 text-center text-xs font-bold text-white">${student.hp || 100}/100</span></div></td><td class="px-6 py-4 text-center"><button class="edit-btn p-1 text-blue-600 hover:text-blue-800" data-id="${key}"><i data-lucide="edit" class="w-4 h-4"></i></button><button class="delete-btn p-1 text-red-600 hover:text-red-800" data-id="${key}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`;
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
                document.getElementById('xp').value = ((student.level - 1) * 1000) + student.xp;
                document.getElementById('hp').value = student.hp;
                document.getElementById('coin').value = student.coin || 0;
                if (student.fotoProfilBase64) {
                    imagePreview.src = student.fotoProfilBase64;
                    imagePreviewContainer.classList.remove('hidden');
                }
            }
        }
    });

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
    
    async function updateStudentStats(uid, action, studentData = null) {
        const studentRef = ref(db, `students/${uid}`);
        const data = studentData || (await get(studentRef)).val();
        if (!data) return;

        let updates = {};
        let message = '';
        const xpPerLevel = 1000;
        
        switch(action) {
            case 'hadir':
                const newTotalXp = ((data.level || 1) - 1) * xpPerLevel + (data.xp || 0) + 10;
                updates.xp = newTotalXp % xpPerLevel;
                updates.level = Math.floor(newTotalXp / xpPerLevel) + 1;
                updates.coin = (data.coin || 0) + 10;
                message = `+10 XP, +10 Koin untuk ${data.nama}!`;
                break;
            case 'sakit':
                updates.hp = Math.max(0, (data.hp || 100) - 2);
                message = `-2 HP untuk ${data.nama}. Cepat sembuh!`;
                break;
            case 'izin':
                updates.hp = Math.max(0, (data.hp || 100) - 5);
                message = `-5 HP untuk ${data.nama}.`;
                break;
            case 'alfa':
                updates.hp = Math.max(0, (data.hp || 100) - 10);
                message = `-10 HP untuk ${data.nama}. Jangan diulangi!`;
                break;
        }
        await update(studentRef, updates);
        showToast(message);
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
    lucide.createIcons();
}

// Panggil lucide.createIcons() secara global sekali untuk halaman login & student
lucide.createIcons();
