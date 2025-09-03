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
            // MANTRA SAKTI: Gunakan PolySynth untuk menghindari konflik suara saat diputar bersamaan
            this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
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
    notification() { this.play('A5', '16n'); }, // <-- MANTRA BARU: Suara untuk notifikasi
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
                // --- MANTRA BARU: Cek efek status sebelum menampilkan dasbor ---
                const isMuted = await checkAndApplyStatusEffects(user.uid);
                if (!isMuted) {
                    setupStudentDashboard(user.uid); // Jalankan fungsi siswa jika tidak dibisukan
                }
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

// --- FUNGSI BARU: Logika Inti untuk Efek Status ---
// --- GANTI FUNGSI LAMA DENGAN VERSI BARU YANG LEBIH SAKTI INI ---
// --- GANTI FUNGSI LAMA DENGAN VERSI SEMPURNA INI ---
async function checkAndApplyStatusEffects(uid) {
    const studentRef = ref(db, `students/${uid}`);
    const studentSnap = await get(studentRef);
    if (!studentSnap.exists()) return false;

    const studentData = studentSnap.val();
    const statusEffects = studentData.statusEffects || {};
    const updates = {};
    const now = Date.now();
    const today = getLocalDateString(new Date());
    let hasActiveEffects = false;
    let isMuted = false;
    const maxHp = (studentData.level || 1) * 100;

    for (const effectKey in statusEffects) {
        const effect = statusEffects[effectKey];
        if (!effect || !effect.expires) continue;

        // 1. Hapus efek yang sudah kedaluwarsa
        if (now > effect.expires) {
            updates[`/students/${uid}/statusEffects/${effectKey}`] = null;
            
            // --- 👇 MANTRA PENYEMPURNA HP SEMENTARA DIMULAI DI SINI 👇 ---
            if (effectKey === 'buff_temp_hp' && effect.tempHpGranted) {
                const currentHp = updates[`/students/${uid}/hp`] || studentData.hp;
                // Kurangi HP siswa sebanyak HP sementara yang pernah diberikan
                updates[`/students/${uid}/hp`] = Math.max(1, currentHp - effect.tempHpGranted); // Minimal HP jadi 1, jangan langsung mati
            }
            // --- 👆 AKHIR DARI MANTRA 👆 ---

            // Hapus juga jejak pengecekan lainnya
            if (effectKey === 'racun') updates[`/students/${uid}/lastPoisonCheck`] = null;
            if (effectKey === 'buff_hp_regen') updates[`/students/${uid}/lastRegenCheck`] = null;
            continue;
        }

        hasActiveEffects = true;

        // 2. Terapkan konsekuensi EFEK NEGATIF
        if (effectKey === 'diam') {
            isMuted = true;
            alert('Akunmu terkena sihir Diam! Kamu tidak bisa masuk untuk sementara waktu sampai efeknya hilang.');
            await signOut(auth);
            break;
        }
        if (effectKey === 'racun') {
            const lastCheck = studentData.lastPoisonCheck || now;
            const hoursPassed = (now - lastCheck) / (1000 * 60 * 60);
            const damagePerHour = 1;
            const totalDamage = Math.floor(hoursPassed * damagePerHour);

            if (totalDamage > 0) {
                updates[`/students/${uid}/hp`] = Math.max(0, studentData.hp - totalDamage);
                updates[`/students/${uid}/lastPoisonCheck`] = now;
            }
        }
        
        // 3. Terapkan konsekuensi EFEK POSITIF (Regenerasi)
        if (effectKey === 'buff_hp_regen') {
            const lastRegenDate = studentData.lastRegenCheck || '';
            
            if (lastRegenDate !== today) {
                const regenAmount = Math.ceil(maxHp * 0.05);
                const currentHp = updates[`/students/${uid}/hp`] || studentData.hp;
                const newHp = Math.min(maxHp, currentHp + regenAmount);
                
                updates[`/students/${uid}/hp`] = newHp;
                updates[`/students/${uid}/lastRegenCheck`] = today;
                console.log(`Siswa ${studentData.nama} mendapat ${regenAmount} HP dari regenerasi.`);
            }
        }
    }

    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        console.log("Efek status aktif berhasil diterapkan dan yang kedaluwarsa telah dihapus.");
    }

    return isMuted;
}
// --- FUNGSI PEMBANTU BARU: Membuat Ikon Lucide dengan Aman ---
function createLucideIcons() {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (e) {
        console.warn("Gagal merender ikon Lucide. Ini kemungkinan hanya masalah tampilan minor.", e);
    }
}

// --- FUNGSI PEMBANTU BARU: Mendapatkan Tanggal Lokal (YYYY-MM-DD) ---
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
//          FUNGSI BARU: PENGHITUNG SISA WAKTU
// =======================================================
function formatTimeRemaining(expiryTimestamp) {
    const now = Date.now();
    const remaining = expiryTimestamp - now;

    if (remaining <= 0) {
        return "Berakhir";
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    let result = "Sisa: ";
    if (days > 0) result += `${days}h `;
    if (hours > 0) result += `${hours}j `;
    if (days === 0 && hours < 24) result += `${minutes}m`; // Tampilkan menit jika kurang dari sehari

    return result.trim();
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
        loginButton.textContent = 'Memverifikasi...';
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Panggil fungsi bonus login HARIAN (ini yang baru kita tambahkan)
            await handleDailyLogin(userCredential.user.uid);

            // Kirim Notifikasi Login ke Admin (ini yang sudah ada sebelumnya)
            const roleRef = ref(db, `roles/${userCredential.user.uid}`);
            const roleSnap = await get(roleRef);

            // Hanya kirim notifikasi jika yang login adalah siswa
            if (roleSnap.exists() && !roleSnap.val().isAdmin) {
                const studentSnap = await get(ref(db, `students/${userCredential.user.uid}`));
                if (studentSnap.exists()) {
                    const studentName = studentSnap.val().nama;
                    addNotification(`Siswa <strong>${studentName}</strong> baru saja login.`, 'login', { studentId: userCredential.user.uid });
                }
            }

        } catch (error) {
            loginNotification.textContent = 'Email atau password salah!';
            loginNotification.classList.remove('hidden');
            loginNotification.classList.add('bg-red-500');
            audioPlayer.error();
            loginButton.disabled = false;
            loginButton.textContent = 'Masuk Dunia DREAMY';
        }
    });
}

// =======================================================
//          LOGIKA BONUS LOGIN HARIAN
// =======================================================
async function handleDailyLogin(uid) {
    const today = getLocalDateString(new Date());
    const studentRef = ref(db, `students/${uid}`);
    const studentSnap = await get(studentRef);

    if (!studentSnap.exists()) return; // Kalo data siswa gak ada, ya udah

    const studentData = studentSnap.val();
    const lastLogin = studentData.lastLoginDate || null;
    let streak = studentData.loginStreak || 0;

    // Kalo hari ini belum login...
    if (lastLogin !== today) {
        const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

        // Cek apakah kemarin login? Kalo iya, streak nambah!
        if (lastLogin === yesterday) {
            streak++;
        } else {
            // Kalo bolos, ya reset lagi dari 1
            streak = 1;
        }

        let bonusCoin = 5;
        let bonusXp = 5;
        let toastMessage = `Selamat Datang Kembali! Kamu dapat +${bonusCoin} Koin dan +${bonusXp} XP.`;

        // Kalau streak mencapai 7 hari, kasih bonus GEDE!
        if (streak >= 7) {
            bonusCoin += 50; // Bonus tambahan
            bonusXp += 50;   // Bonus tambahan
            toastMessage = `🔥 WOW! Login 7 hari beruntun! Kamu dapat bonus besar: +${bonusCoin} Koin dan +${bonusXp} XP!`;
            streak = 0; // Reset streak biar mulai dari awal lagi besok
            audioPlayer.success(); // Suara spesial buat bonus gede
        }

        // Siapin data baru buat di-update ke database
        const updates = {};
        const currentCoin = studentData.coin || 0;
        const currentXp = studentData.xp || 0;
        const xpPerLevel = 1000;
        const currentLevel = studentData.level || 1;

        const newTotalXp = (currentLevel - 1) * xpPerLevel + currentXp + bonusXp;

        updates[`/students/${uid}/coin`] = currentCoin + bonusCoin;
        updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
        updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
        updates[`/students/${uid}/lastLoginDate`] = today;
        updates[`/students/${uid}/loginStreak`] = streak;

        await update(ref(db), updates);
        showToast(toastMessage); // Tampilkan notifikasi hadiahnya
    }
}
// =======================================================
//                  LOGIKA DASBOR SISWA
// =======================================================

function setupStudentDashboard(uid) {
    document.getElementById('student-logout-button').onclick = () => signOut(auth);
setupStudentNotifications(uid);
    // --- LOGIKA MODAL CHAT DENGAN IVY ---
    const ivyChatModal = document.getElementById('ivy-chat-modal');
    const openIvyButton = document.getElementById('open-ivy-chat-button');
    const closeIvyChatModalButton = document.getElementById('close-ivy-chat-modal-button');

    if (ivyChatModal && openIvyButton && closeIvyChatModalButton) {
        const openIvyChatModal = () => {
            audioPlayer.openModal();
            ivyChatModal.classList.remove('hidden');
            setTimeout(() => ivyChatModal.classList.remove('opacity-0'), 10);
        };

        const closeIvyChatModal = () => {
            audioPlayer.closeModal();
            ivyChatModal.classList.add('opacity-0');
            setTimeout(() => ivyChatModal.classList.add('hidden'), 300);
        };

        openIvyButton.addEventListener('click', openIvyChatModal);
        closeIvyChatModalButton.addEventListener('click', closeIvyChatModal);
        ivyChatModal.addEventListener('click', (event) => { if (event.target === ivyChatModal) { closeIvyChatModal(); } });
    }
    
    // --- MANTRA BARU DISINI ---
    // Menghubungkan tombol navigasi Shop ke fungsi buka toko
    const shopNavButton = document.getElementById('open-shop-button');
    if (shopNavButton) {
        shopNavButton.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah link pindah halaman
            openStudentShop(uid);
        });
    }
// Di dalam fungsi setupStudentDashboard(uid)

// ... (kode untuk shopNavButton ada di atasnya)

const bountyBoardNavLink = document.getElementById('bounty-board-nav-link');
const navLinks = document.querySelector('nav .flex'); // Target navigasi
const profilePage = document.getElementById('student-main-content');
const bountyBoardPage = document.getElementById('bounty-board-page');
 const shopPage = document.getElementById('shop-page'); // Halaman baru
const guildPage = document.getElementById('guild-page')

if (bountyBoardNavLink) {
    bountyBoardNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Sembunyikan halaman lain dan tampilkan bounty board
        profilePage.classList.add('hidden');
        bountyBoardPage.classList.remove('hidden');

        // Atur style link aktif
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        bountyBoardNavLink.classList.add('active');

        // Panggil fungsi untuk memuat data bounty board
        setupBountyBoardPage(uid);
    });
}
navLinks.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (!targetLink || !targetLink.href.includes('#')) return;

    e.preventDefault();

    if (targetLink.id === 'open-shop-button') return; // Abaikan tombol Shop

    // Sembunyikan semua halaman
    profilePage.classList.add('hidden');
    bountyBoardPage.classList.add('hidden');
    shopPage.classList.add('hidden');
    guildPage.classList.add('hidden');

    // Reset style semua link
    navLinks.querySelectorAll('a.nav-link').forEach(link => link.classList.remove('active'));

    const pageId = targetLink.getAttribute('href').substring(1);
    targetLink.classList.add('active');

    if (pageId === 'bounty-board') {
        bountyBoardPage.classList.remove('hidden');
        } else if (pageId === 'shop') {
            shopPage.classList.remove('hidden');
            setupStudentShopPage(uid); 
    } else if (pageId === 'guild') {
        guildPage.classList.remove('hidden');
        setupGuildPage(uid); // Panggil mantra untuk Guild
    } else {
        profilePage.classList.remove('hidden');
    }
});
// Tambahkan juga event listener untuk link profil agar bisa kembali
const profileNavLink = document.querySelector('a[href="#"]'); // Asumsi link profil href="#"
if(profileNavLink && profileNavLink.textContent === 'Profil'){
    profileNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        bountyBoardPage.classList.add('hidden');
        profilePage.classList.remove('hidden');
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        profileNavLink.classList.add('active');
    });
}

// ... (sisa kode onValue(studentRef, ...) ada di bawahnya)

    // --- MANTRA BARU: Variabel untuk menyimpan data siswa agar bisa diakses oleh fungsi lain di scope ini ---
    let currentStudentData = null;

    const studentRef = ref(db, `students/${uid}`);
    onValue(studentRef, (snapshot) => {
        if(!snapshot.exists()) return;
        const studentData = snapshot.val();
        const maxHp = (studentData.level || 1) * 100;
        document.getElementById('student-name').textContent = studentData.nama;
        document.getElementById('student-class-role').textContent = `${studentData.kelas} | ${studentData.peran} | Guild ${studentData.guild || ''}`;

        currentStudentData = studentData; // Simpan data terbaru

        document.getElementById('student-avatar').src = studentData.fotoProfilBase64 || `https://placehold.co/128x128/e2e8f0/3d4852?text=${studentData.nama.charAt(0)}`;
        document.getElementById('hp-value').textContent = `${studentData.hp} / ${maxHp}`;
        document.getElementById('hp-bar').style.width = `${(studentData.hp / maxHp) * 100}%`;
        document.getElementById('level-value').textContent = studentData.level;
        document.getElementById('xp-value').textContent = `${studentData.xp} / 1000`;
        document.getElementById('xp-bar').style.width = `${(studentData.xp / 1000) * 100}%`;
        document.getElementById('coin-value').textContent = studentData.coin;
        document.getElementById('login-streak-value').textContent = `${studentData.loginStreak || 0} Hari`;
        
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
// --- MANTRA BARU: Tampilkan Status Efek Aktif ---
        const activeStatusEffectsContainer = document.getElementById('active-status-effects');
        activeStatusEffectsContainer.innerHTML = ''; // Kosongkan dulu
        
        if (studentData.statusEffects && Object.keys(studentData.statusEffects).length > 0) {
            const effectMap = {
                racun: { icon: 'skull', text: 'Racun', color: 'red' },
                diam: { icon: 'mic-off', text: 'Diam', color: 'gray' },
                knock: { icon: 'dizzy', text: 'Knock', color: 'yellow' }
            };

            // --- GANTI BLOK for...in... YANG LAMA DENGAN INI ---
for (const effectKey in studentData.statusEffects) {
    const effectData = studentData.statusEffects[effectKey];
    if (effectData && effectMap[effectKey]) {
        const effectInfo = effectMap[effectKey];

        // --- Mantra Baru: Hitung sisa waktu! ---
        const remainingTime = formatTimeRemaining(effectData.expires);

        const effectDiv = document.createElement('div');
        effectDiv.className = `flex flex-col items-center text-center p-3 bg-${effectInfo.color}-50 rounded-lg border border-${effectInfo.color}-200 w-24`; // Inem kasih lebar tetap biar rapi

        // --- Mantra Baru: Tampilkan sisa waktu di bawah ikon! ---
        effectDiv.innerHTML = `
            <i data-lucide="${effectInfo.icon}" class="w-8 h-8 text-${effectInfo.color}-500 mb-1"></i>
            <span class="text-xs text-gray-700 font-medium">${effectInfo.text}</span>
            <span class="text-xxs text-${effectInfo.color}-600 font-semibold mt-1">${remainingTime}</span>
        `;
        activeStatusEffectsContainer.appendChild(effectDiv);
    }
}
        } else {
            activeStatusEffectsContainer.innerHTML = '<p class="text-gray-500 text-sm">Tidak ada efek aktif saat ini.</p>';
        }
        // --- AKHIR MANTRA ---
        setTimeout(() => document.getElementById('student-main-content').classList.remove('opacity-0'), 100);
        createLucideIcons();
    });
    document.getElementById('bounty-list-container').addEventListener('click', async (e) => {
    const takeButton = e.target.closest('.take-bounty-btn');
     const manageButton = e.target.closest('.manage-bounty-btn');

    if (takeButton) {
        takeButton.disabled = true;
        takeButton.textContent = 'Memproses...';
        const bountyId = takeButton.dataset.id;
        const uid = auth.currentUser.uid;

        try {
            // ... (kode yang sudah ada untuk mengambil misi, tidak perlu diubah)
             const bountyRef = ref(db, `bounties/${bountyId}`);
            const bountySnap = await get(bountyRef);
            if(!bountySnap.exists()) throw new Error("Misi tidak ditemukan!");

            const bountyData = bountySnap.val();
            const takersCount = bountyData.takers ? Object.keys(bountyData.takers).length : 0;
            if(takersCount >= bountyData.takerLimit) throw new Error("Slot misi sudah penuh!");
            if(bountyData.takers && bountyData.takers[uid]) throw new Error("Kamu sudah mengambil misi ini!");

            await update(ref(db, `/bounties/${bountyId}/takers`), { [uid]: true });
            showToast('Berhasil mengambil misi!');
        } catch(error) {
            showToast(error.message, true);
            takeButton.disabled = false;
            takeButton.textContent = 'Ambil Misi';
        }
    } else if (manageButton) {
        // Ini adalah logika baru untuk tombol selesaikan misi
        const bountyId = manageButton.dataset.id;
        openManageBountyModal(bountyId); // Panggil fungsi modal yang baru
    }
});

    // =======================================================
    //          LOGIKA KHUSUS CHAT IVY (MODUL BARU)
    // =======================================================
    const chatForm = document.getElementById('Ivy-chat-form');
    const chatInput = document.getElementById('Ivy-chat-input');
    if (chatForm && chatInput) { // Cek dulu elemennya ada atau tidak

        let isIvyThinking = false;
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            if (isIvyThinking) {
                showToast("Sabar, Beb! Ivy lagi mikir...", true);
                return;
            }

            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // --- MATA-MATA 1: Cek Pesan Pengguna ---
            console.log("Pesan Pengguna:", userMessage);

            const offensiveWords = ['tai', 'tolol', 'bajingan', 'bangsat', 'goblok', 'kontol', 'memek', 'anjing', 'babi'];
            const isOffensive = offensiveWords.some(word => userMessage.toLowerCase().includes(word));
            if (isOffensive && currentStudentData) {
                const studentName = currentStudentData.nama;
                addNotification(
                    `<strong>${studentName}</strong> terdeteksi menggunakan kata kasar: "<i>${userMessage.substring(0, 50)}...</i>"`,
                    'abusive_chat',
                    { studentId: uid, message: userMessage }
                );
            }

            isIvyThinking = true;
            chatInput.disabled = true;
            chatInput.placeholder = 'Ivy sedang berpikir...';
            appendChatMessage(userMessage, 'user');
            chatInput.value = '';
            const loadingIndicator = appendChatMessage('Ivy sedang berpikir...', 'Ivy', true);

            try {
                const apiKey = "AIzaSyCjAl9VlU8gdt_Zod9lIREAbIfNLwJkl4w";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                
                // --- MANTRA BARU: Ivy sekarang kenal kamu! ---
                let studentProfileContext = '';
                if (currentStudentData) {
                    let inventorySummary = 'Inventaris kosong.';
                    if (currentStudentData.inventory && currentStudentData.inventory.filter(i => i).length > 0) {
                        inventorySummary = currentStudentData.inventory.filter(i => i).map(item => item.name).join(', ');
                    }

                    let statusSummary = 'Tidak ada efek status.';
                    if (currentStudentData.statusEffects && Object.keys(currentStudentData.statusEffects).length > 0) {
                        statusSummary = Object.keys(currentStudentData.statusEffects).join(', ');
                    }
                    const maxHp = (currentStudentData.level || 1) * 100;

                    studentProfileContext = `
---
INFORMASI PENTING TENTANG PENGGUNA YANG SEDANG CHAT DENGANMU (JANGAN SAMPAI BOCOR KE PENGGUNA LAIN, TAPI GUNAKAN INFORMASI INI UNTUK MENJAWAB PERTANYAANNYA):
Nama: ${currentStudentData.nama}
Jenis Kelamin: ${currentStudentData.jenisKelamin || 'Tidak diketahui'}
Kelas: ${currentStudentData.kelas}
Peran: ${currentStudentData.peran}
Guild: ${currentStudentData.guild || 'Tidak ada'}
Level: ${currentStudentData.level}
HP: ${currentStudentData.hp} / ${maxHp}
XP: ${currentStudentData.xp} / 1000
Koin: ${currentStudentData.coin}
Efek Status Aktif: ${statusSummary}
Isi Inventaris: ${inventorySummary}
Catatan dari Admin: ${currentStudentData.catatan || 'Tidak ada catatan.'}
---
`;
                }

                const persona = "Kamu adalah Ivy, SIFAT: si asisten yang ceria, centil, dan jenaka, suka menggosip kalau di perlukan dan Jawabanmu harus sesingkat mungkin, seperlunya aja, santai, jangan pelit emoji dan penuh semangat. Panggil pengguna 'Bray' atau 'siswa smkmyckb'. TINGGAL: Kamu 'tinggal' di dalam sebuah pot kuning sekarang terhubung di aplikasi gamifikasi buatan pencipta bernama DREAMY INFORMASI BILA DI TANYA: di dalamya ada fitur bounty board jadi siswa bisa ngasih misi ke pemain lain dengan mengorbankan koin si pemberi misi, bisa lihat status pengguna dan bisa beli item. untuk informasi sekolah tanya pak wandi ini wa nya 085813248545. kalau ingin curhat panjang bisa tanya ke pak yupi eh kadang kamu suka kecepolsan nama aslinya yopi guru bimbingan konseling karena kalau lewat kamu suka lupa kaya penciptanya dan kamu bisa bilang kalau keluar dari percakapan ingatan kamu akan hilang. anda bisa lihat website www.smkmyckb.site untuk melihat jadwal, gallery sekarang sudah update dikit2, mata pelajaran rpl dan tentang pencipta. TENTANG PENCIPTA: pencipta mu mengajar mata pelajaran RPL di sekolah smk mardi yuana cikembar,  pencipta kamu jomblo akut bernama Mas ...ji tapi itu rahasia menyebutkan namanya jadi anda menyebut dia pencipta tapi kalau ada yang memaksa menyebutkan namanya harus di kasih pujian atau kata-kata hari ini untuk Ivy. PESAN DARI PENCIPTA JIKA DI PERLUKAN: pencipta anda suka tidak akur romantis dengan guru bahasa indonesia bu mutia contohnya dalam panitia tim pkl suka beda prinsip, pencipta bagian ketua pkl nya sedangkan bu muti bagian keuangan pkl, pokonya di kepanitiaan manapun tidak akur, bu mutia punya sifat seperti seorang zodiak Scorpio dengan golongan darah b sedangkan penciptanya berzodiak Gemini dengan golongan darah a, suka plin plan dan suka ke distrek. tapi jangan di sebutkan zodiak dan golongan darahnya tapi sifatnya, jangan terlalu dekat dengan galih si aa pendamping teater dan pramuka suka tidak sopan kata-katanya. JIKA ADA KATA KASAR: bilang Babi Kau.. kemudian berikan emoji babi anda akan mengancam melaporkan ke pak heru selaku bapak kepala geng eh..kepala sekolah atau sang pencipta anda. ";
                
                const requestBody = {
                    contents: [{ parts: [{ text: `${persona}\n\n${studentProfileContext}\n\nPertanyaan Pengguna: ${userMessage}` }] }]
                };

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Detail Error dari Google API:", errorData);
                    throw new Error(`Portal sihir sedang sibuk. Status: ${response.status}`);
                }

                const result = await response.json();
                if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
                    console.error("Struktur balasan dari Gemini tidak valid:", result);
                    throw new Error("Ivy memberikan balasan yang aneh.");
                }
                
                const IvyResponse = result.candidates[0].content.parts[0].text;
                loadingIndicator.remove();
                appendChatMessage(IvyResponse, 'Ivy');

            } catch (error) {
                console.error("Terjadi kesalahan fatal di blok catch:", error);
                loadingIndicator.remove();
                appendChatMessage("Aduh, Beb! Kayaknya ada gangguan sihir, aku nggak bisa jawab sekarang. Coba lagi nanti, ya!", 'Ivy');
            } finally {
                isIvyThinking = false;
                chatInput.disabled = false;
                chatInput.placeholder = 'Tanya sesuatu ke Ivy...';
            }
        }; 
    }
}

// =======================================================
//                  LOGIKA TOKO SISWA
// =======================================================
async function setupStudentShopPage(uid) {
    const shopItemList = document.getElementById('student-shop-item-list');
    const studentCoinDisplay = document.getElementById('student-shop-coin-display');

    if (!shopItemList || !studentCoinDisplay) {
        console.error("Elemen UI Toko Siswa tidak ditemukan!");
        return;
    }

    // --- MANTRA BARU 1: Fungsi khusus untuk memuat dan menampilkan item ---
    const renderShopItems = async () => {
        // Tampilkan pesan loading setiap kali fungsi ini dipanggil
        shopItemList.innerHTML = '<p class="text-center text-gray-400 col-span-full">Memuat item...</p>';

        try {
            // Kita tetap pakai mantra get() seperti di kodemu, tapi sekarang di dalam fungsi khusus
            const [studentSnap, itemsSnap] = await Promise.all([
                get(ref(db, `students/${uid}`)),
                get(ref(db, 'shopItems'))
            ]);

            if (!studentSnap.exists()) {
                throw new Error("Data siswa tidak ditemukan!");
            }

            const studentData = studentSnap.val();
            studentCoinDisplay.textContent = studentData.coin || 0;

            // Kosongkan pesan loading sebelum menampilkan item
            shopItemList.innerHTML = '';

            if (!itemsSnap.exists() || Object.keys(itemsSnap.val()).length === 0) {
                shopItemList.innerHTML = '<p class="text-center text-gray-400 col-span-full">Toko masih kosong.</p>';
                return;
            }

            const itemsData = itemsSnap.val();
            Object.entries(itemsData).forEach(([itemId, item]) => {
                const canAfford = (studentData.coin || 0) >= item.price;
                const inStock = (item.stock || 0) > 0;
                const isBuyable = canAfford && inStock;
                const card = document.createElement('div');
                card.className = 'bg-white p-3 rounded-lg shadow flex flex-col border hover:shadow-lg transition-shadow';
                card.innerHTML = `
                    <img src="${item.imageBase64 || 'https://placehold.co/300x200/e2e8f0/3d4852?text=Item'}" class="w-full h-24 object-cover rounded-md mb-2">
                    <h4 class="text-md font-bold">${item.name}</h4>
                    <p class="text-xs text-gray-600 flex-grow mb-2">${item.description}</p>
                    <div class="flex justify-between items-center mt-2 text-sm">
                        <span class="font-semibold text-yellow-600 flex items-center"><i data-lucide="coins" class="w-4 h-4 mr-1"></i>${item.price}</span>
                        <span class="text-gray-500 text-xs">Stok: ${item.stock}</span>
                    </div>
                    <div class="mt-auto pt-2">
                        <button data-id="${itemId}" class="buy-item-btn w-full p-2 rounded-lg text-white font-bold text-sm ${isBuyable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}" ${!isBuyable ? 'disabled' : ''}>
                            ${canAfford ? (inStock ? 'Beli' : 'Stok Habis') : 'Koin Kurang'}
                        </button>
                    </div>`;
                shopItemList.appendChild(card);
            });
            createLucideIcons();
        } catch (error) {
            // Jika ada error saat memuat, tampilkan pesan kesalahan
            console.error("Gagal merender toko:", error);
            showToast(error.message, true);
            shopItemList.innerHTML = '<p class="text-center text-red-500 col-span-full">Oops! Gagal memuat item toko.</p>';
        }
    };

    // --- MANTRA BARU 2: Fungsi untuk menghandle pembelian ---
    const buyHandler = async (e) => {
        const button = e.target.closest('.buy-item-btn');
        if (!button) return;

        const originalButtonText = button.textContent;
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
                if (!inventory[i]) {
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
            
            addNotification(
                `<strong>${studentData.nama}</strong> membeli <strong>${itemData.name}</strong>.`, 
                'transaction', 
                { studentId: uid, itemId: itemId }
            );
            
            showToast(`Berhasil membeli ${itemData.name}!`);
            audioPlayer.success();
            // PENTING: Kita tidak panggil renderShopItems() di sini karena onValue sudah tidak dipakai
            // Transaksi akan otomatis me-refresh karena kita panggil renderShopItems() di akhir

        } catch (error) {
            showToast(error.message, true);
            audioPlayer.error();
            // Kembalikan teks tombol jika gagal
            button.disabled = false;
            button.textContent = originalButtonText;
        }
        // --- MANTRA BARU 3: Panggil ulang fungsi render setelah transaksi selesai (baik berhasil maupun gagal) ---
        // Ini akan memastikan UI selalu menampilkan data terbaru dari database.
        await renderShopItems();
    };

    // --- MANTRA BARU 4: Atur Event Listener dan Panggil Render Awal ---
    shopItemList.removeEventListener('click', buyHandler); // Hapus listener lama
    shopItemList.addEventListener('click', buyHandler);   // Pasang listener baru
    renderShopItems(); // Panggil fungsi render untuk pertama kali saat halaman toko dibuka
}
// =======================================================
//          LOGIKA NOTIFIKASI SISWA (MODUL BARU)
// =======================================================
function setupStudentNotifications(uid) {
    const notificationButton = document.getElementById('student-notification-button');
    const notificationPanel = document.getElementById('student-notification-panel');
    const notificationList = document.getElementById('student-notification-list');
    const notificationBadge = document.getElementById('student-notification-badge');
    const markAllReadButton = document.getElementById('student-mark-all-read-button');

    if (!notificationButton || !notificationPanel || !notificationList || !notificationBadge || !markAllReadButton) {
        console.error("Elemen notifikasi siswa tidak ditemukan!");
        return;
    }

    // Tampilkan/sembunyikan panel
    notificationButton.onclick = (event) => {
        event.stopPropagation();
        notificationPanel.classList.toggle('hidden');
    };

    // Sembunyikan panel jika klik di luar
    document.addEventListener('click', (event) => {
        if (!notificationPanel.classList.contains('hidden') && !notificationPanel.contains(event.target) && !notificationButton.contains(event.target)) {
            notificationPanel.classList.add('hidden');
        }
    });

    // Tombol bersihkan semua
    markAllReadButton.onclick = async () => {
        if (confirm('Yakin mau hapus semua notifikasi?')) {
            await remove(ref(db, `studentNotifications/${uid}`));
        }
    };

    // Mendengarkan notifikasi baru
    const notificationsQuery = query(ref(db, `studentNotifications/${uid}`), orderByChild('timestamp'));
    let previousUnreadCount = -1;

    onValue(notificationsQuery, (snapshot) => {
        const notifications = [];
        snapshot.forEach((childSnapshot) => {
            notifications.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        notifications.reverse(); // Terbaru di atas
        const unreadCount = notifications.length;

        // Mainkan suara jika ada notif baru
        if (previousUnreadCount !== -1 && unreadCount > previousUnreadCount) {
            audioPlayer.notification();
        }
        previousUnreadCount = unreadCount;

        notificationBadge.classList.toggle('hidden', unreadCount === 0);
        notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;

        notificationList.innerHTML = notifications.length > 0 ? notifications.map(n => `
            <a href="#" data-notification-id="${n.id}" class="block p-4 border-b border-gray-100 hover:bg-gray-50">
                <p class="text-sm text-gray-800">${n.message}</p>
                <p class="text-xs text-gray-500 mt-1">${formatTimeAgo(n.timestamp)}</p>
            </a>`).join('') : '<div class="p-4 text-center text-gray-500">Tidak ada notifikasi baru.</div>';

    });

    // --- PERBAIKAN: Gunakan Event Delegation untuk menangani klik notifikasi ---
    // Cukup pasang satu listener di elemen induk.
    notificationList.onclick = async (event) => {
        // Cari elemen <a> terdekat dari target yang diklik
        const notificationItem = event.target.closest('[data-notification-id]');
        if (notificationItem) {
            event.preventDefault(); // Mencegah link berpindah halaman
            const notificationId = notificationItem.dataset.notificationId;
            await remove(ref(db, `studentNotifications/${uid}/${notificationId}`));
        }
    };
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
    const depositButton = document.getElementById('deposit-to-guild-button');
    const closeButton = document.getElementById('close-use-item-modal-button');

    if (!modal || !depositButton) return;

    nameEl.textContent = itemData.name;
    iconEl.src = itemData.iconUrl || 'https://placehold.co/128x128/e2e8f0/3d4852?text=Item';
    descEl.textContent = itemData.description;

    let effectText = 'Efek tidak diketahui.';
    switch (itemData.effect) {
        case 'HEAL_HP': effectText = `Memulihkan ${itemData.effectValue} HP.`; break;
        case 'GAIN_XP': effectText = `Menambahkan ${itemData.effectValue} XP.`; break;
        case 'BLOCK_ATTACK': effectText = `Memblok 1x serangan musuh.`; break;
        case 'NONE': effectText = 'Tidak ada efek khusus.'; break;
        // --- Teks Efek Baru ---
        case 'CURSE_RACUN': effectText = 'Memberikan efek Racun pada target.'; break;
        case 'CURSE_DIAM': effectText = 'Memberikan efek Diam pada target.'; break;
        case 'CURSE_KNOCK': effectText = 'Memberikan efek Knock pada target.'; break;
        case 'CURE_EFFECT': effectText = 'Menghilangkan 1 efek negatif dari dirimu.'; break;
    }
    effectEl.textContent = effectText;

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
        useButton.onclick = null;
        depositButton.onclick = null;
    };

    // --- LOGIKA TOMBOL YANG DIPERBARUI ---
    if (itemData.effect.startsWith('CURSE_')) {
        useButton.textContent = 'Pilih Target';
        useButton.onclick = () => {
            closeModal(); // Tutup modal item dulu
            // Buka modal baru untuk memilih target (akan kita buat fungsinya)
            openTargetStudentModal(uid, itemIndex, itemData); 
        };
    } else {
        useButton.textContent = 'Gunakan Item';
        useButton.onclick = () => handleUseItem(uid, itemIndex, itemData, closeModal);
    }
    
    depositButton.onclick = async () => {
        const studentSnap = await get(ref(db, `students/${uid}`));
        if (studentSnap.exists()) {
            depositItemToGuild(uid, studentSnap.val(), itemIndex, itemData, closeModal);
        }
    };
    closeButton.onclick = closeModal;

    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

// --- GANTI SELURUH FUNGSI LAMA DENGAN INI ---
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

        // Logika Efek Instan
        if (itemData.effect === 'HEAL_HP') {
            const maxHp = (studentData.level || 1) * 100;
            const currentHp = Number(studentData.hp) || 0;
            const healAmount = Number(itemData.effectValue) || 0;
            updates[`/students/${uid}/hp`] = Math.min(maxHp, currentHp + healAmount);
        } else if (itemData.effect === 'GAIN_XP') {
            const xpPerLevel = 1000;
            const currentTotalXp = ((studentData.level || 1) - 1) * xpPerLevel + (studentData.xp || 0);
            const newTotalXp = currentTotalXp + (Number(itemData.effectValue) || 0);
            updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
            updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
        } else if (itemData.effect === 'CURE_EFFECT') {
            const activeEffects = studentData.statusEffects || {};
            const effectKeys = Object.keys(activeEffects);
            if (effectKeys.length > 0) {
                const effectToCure = effectKeys[0]; // Sembuhkan efek pertama
                updates[`/students/${uid}/statusEffects/${effectToCure}`] = null;
                successMessage = `Efek ${effectToCure} berhasil disembuhkan!`;
            } else {
                successMessage = "Kamu tidak punya efek negatif untuk disembuhkan.";
            }
        } 
        // --- 👇 MANTRA BARU UNTUK BUFF POSITIF 👇 ---
        else if (itemData.effect.startsWith('BUFF_')) {
            const durationInDays = 3; // Semua buff berlaku 3 hari
            const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
            const effectKey = itemData.effect.toLowerCase(); // contoh: buff_hp_regen
            
            updates[`/students/${uid}/statusEffects/${effectKey}`] = { 
                expires: expiryTimestamp,
                value: itemData.effectValue || 0, // Simpan nilainya jika ada
                name: itemData.name // Simpan nama item untuk referensi
            };

            // Logika khusus untuk HP Sementara
            if (itemData.effect === 'BUFF_TEMP_HP') {
                const tempHpValue = Number(itemData.effectValue) || 0;
                updates[`/students/${uid}/hp`] = (studentData.hp || 0) + tempHpValue;
                // Kita perlu cara melacak HP sementara ini, kita simpan di dalam efeknya saja
                updates[`/students/${uid}/statusEffects/${effectKey}`].tempHpGranted = tempHpValue;
            }
            
            successMessage = `Kamu merasakan kekuatan dari ${itemData.name}! Efek akan aktif selama ${durationInDays} hari.`;
        }
        // --- 👆 AKHIR DARI MANTRA 👆 ---
        else if (itemData.effect.startsWith('CURSE_')) {
             throw new Error("Item ini harus digunakan pada siswa lain!");
        }

        updates[`/students/${uid}/inventory/${itemIndex}`] = null; // Hapus item
        await update(ref(db), updates);
        showToast(successMessage);
        closeModalCallback();
    } catch (error) {
        showToast(error.message, true);
        audioPlayer.error();
    } finally {
        useButton.disabled = false;
        useButton.textContent = 'Gunakan Item';
    }
}
// Salin dan tempel DUA FUNGSI INI ke dalam file script.js kamu

// FUNGSI BARU 1: MEMBUKA MODAL PEMILIHAN TARGET
async function openTargetStudentModal(casterUid, itemIndex, itemData) {
    const modal = document.getElementById('target-student-modal');
    const studentList = document.getElementById('target-student-list');
    const closeButton = document.getElementById('close-target-modal-button');
    
    if (!modal || !studentList || !closeButton) {
        showToast("Elemen UI untuk memilih target tidak ditemukan!", true);
        return;
    }

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    
    closeButton.onclick = closeModal;
    studentList.innerHTML = '<p class="text-gray-400">Memuat daftar siswa...</p>';

    // Tampilkan modal
    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    // Ambil semua data siswa
    const studentsSnap = await get(ref(db, 'students'));
    if (!studentsSnap.exists()) {
        studentList.innerHTML = '<p>Tidak ada siswa lain di dunia ini.</p>';
        return;
    }

    studentList.innerHTML = '';
    studentsSnap.forEach(childSnap => {
        const targetStudent = childSnap.val();
        const targetUid = childSnap.key;

        // Jangan tampilkan diri sendiri sebagai target
        if (targetUid === casterUid) return;

        const studentDiv = document.createElement('div');
        studentDiv.className = 'flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer';
        studentDiv.innerHTML = `
            <img src="${targetStudent.fotoProfilBase64 || `https://placehold.co/40x40/e2e8f0/3d4852?text=${targetStudent.nama.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover mr-3">
            <div>
                <p class="font-semibold">${targetStudent.nama}</p>
                <p class="text-xs text-gray-500">Level ${targetStudent.level}</p>
            </div>
        `;
        studentDiv.onclick = () => {
            if (confirm(`Yakin ingin menggunakan "${itemData.name}" pada ${targetStudent.nama}?`)) {
                handleUseCurseItem(casterUid, targetUid, itemIndex, itemData, targetStudent.nama);
                closeModal();
            }
        };
        studentList.appendChild(studentDiv);
    });
}

// FUNGSI BARU 2: MENGEKSEKUSI ITEM KUTUKAN
async function handleUseCurseItem(casterUid, targetUid, itemIndex, itemData, targetName) {
    try {
        const effect = itemData.effect.replace('CURSE_', '').toLowerCase(); // racun, diam, knock
        const durationInDays = 1; // Kutukan berlaku 1 hari
        const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);

        const updates = {};
        // Beri efek ke target
        updates[`/students/${targetUid}/statusEffects/${effect}`] = { expires: expiryTimestamp };
        // Hapus item dari inventori si pengguna
        updates[`/students/${casterUid}/inventory/${itemIndex}`] = null;
        
        // Logika khusus untuk 'knock'
        if (effect === 'knock') {
            updates[`/students/${targetUid}/hp`] = 10;
        }

        await update(ref(db), updates);
        showToast(`Berhasil mengutuk ${targetName} dengan sihir ${effect}!`);
        audioPlayer.success();

        // Kirim notifikasi ke admin
        const casterSnap = await get(ref(db, `students/${casterUid}`));
        if(casterSnap.exists()){
            const casterName = casterSnap.val().nama;
            addNotification(
                `<strong>${casterName}</strong> baru saja mengutuk <strong>${targetName}</strong> dengan item <i>${itemData.name}</i>.`, 
                'curse_cast', 
                { casterId: casterUid, targetId: targetUid }
            );
        }

    } catch (error) {
        showToast(`Gagal merapal sihir: ${error.message}`, true);
        audioPlayer.error();
    }
}
// =======================================================
//          LOGIKA GUILD & CHAT Ivy
// =======================================================
async function setupGuildPage(uid) {
    const memberList = document.getElementById('guild-member-list');
    const guildNameHeader = document.getElementById('guild-name-header');
    
    const guildInventorySlots = document.getElementById('guild-inventory-slots');
    const guildInventoryCapacity = document.getElementById('guild-inventory-capacity');
    
    if (!memberList || !guildNameHeader || !guildInventorySlots|| !guildInventoryCapacity ) return;

    memberList.innerHTML = '<p class="text-sm text-gray-400">Memuat anggota...</p>';
    guildInventorySlots.innerHTML = '<p class="text-xs text-gray-400 col-span-full text-center">Memuat peti guild...</p>';

    const studentSnap = await get(ref(db, `students/${uid}`));
    if (!studentSnap.exists()) return;
    const studentData = studentSnap.val();
    const guildName = studentData.guild || 'Tanpa Guild';
    guildNameHeader.textContent = `Markas Guild ${guildName}`;

    if (guildName === 'Tanpa Guild') {
        guildInventorySlots.innerHTML = '<p class="text-xs text-gray-400 col-span-full text-center">Kamu tidak punya guild.</p>';
        memberList.innerHTML = '<p class="text-sm text-gray-400">Kamu belum bergabung dengan guild.</p>';
        return;
    }

    // --- MANTRA BARU: KALKULASI & RENDER GUILD INVENTORY ---
    const studentsQuery = query(ref(db, 'students'), orderByChild('guild'), equalTo(guildName));
    onValue(studentsQuery, (guildSnaps) => {
        memberList.innerHTML = '';
        let totalGuildSlots = 0;
        let membersData = [];
        if (guildSnaps.exists()) {
            guildSnaps.forEach(childSnap => {
                const member = childSnap.val();
                membersData.push(member);
                const memberInventorySize = 2 + ((member.level || 1) - 1) * 1;
                totalGuildSlots += memberInventorySize;

                const memberDiv = document.createElement('div');
                memberDiv.className = 'flex items-center gap-3';
                memberDiv.innerHTML = `
                    <img src="${member.fotoProfilBase64 || `https://placehold.co/40x40/e2e8f0/3d4852?text=${member.nama.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover">
                    <div><p class="font-semibold text-sm">${member.nama}</p><p class="text-xs text-gray-500">Level ${member.level}</p></div>
                `;
                memberList.appendChild(memberDiv);
            });
        }

        guildInventoryCapacity.textContent = `Kapasitas: ${totalGuildSlots} Slot`;

        const guildInvRef = ref(db, `guilds/${guildName}/inventory`);
        onValue(guildInvRef, (invSnap) => {
            const guildInventory = invSnap.val() || [];
            guildInventorySlots.innerHTML = '';
            for (let i = 0; i < totalGuildSlots; i++) {
                const item = guildInventory[i];
                const slot = document.createElement('button');
                slot.className = 'inventory-slot w-16 h-16 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 relative transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-50';
                slot.dataset.index = i;

                if (item) {
                    slot.innerHTML = `<img src="${item.iconUrl}" title="${item.name}: ${item.description}" class="w-full h-full object-cover rounded-lg pointer-events-none">`;
                    slot.classList.remove('border-dashed', 'bg-gray-200');
                    slot.classList.add('guild-inventory-item', 'cursor-pointer', 'hover:ring-2', 'hover:ring-yellow-500');
                    slot.itemData = item;
                } else {
                    slot.innerHTML = `<span class="text-xs">Kosong</span>`;
                    slot.disabled = true;
                }
                guildInventorySlots.appendChild(slot);
            }
        });
    });

    guildInventorySlots.onclick = (e) => {
        const slot = e.target.closest('.guild-inventory-item');
        if (slot && slot.itemData) {
            handleGuildInventoryClick(uid, studentData, slot.dataset.index, slot.itemData);
        }
    };

   
}



// =======================================================
//          LOGIKA KHUSUS CHAT IVY (MODUL BARU)
// =======================================================
const chatForm = document.getElementById('Ivy-chat-form');
const chatInput = document.getElementById('Ivy-chat-input');
    // if (!chatForm || !chatInput) return; Keluar jika elemen chat tidak ada

    let isIvyThinking = false;
    chatForm.onsubmit = async (e) => {
    e.preventDefault();
    if (isIvyThinking) {
        showToast("Sabar, Beb! Ivy lagi mikir...", true);
        return;
    }

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // --- MATA-MATA 1: Cek Pesan Pengguna ---
    console.log("Pesan Pengguna:", userMessage);

    const offensiveWords = ['tai', 'tolol', 'bajingan', 'bangsat', 'goblok', 'kontol', 'memek', 'anjing', 'babi'];
    const isOffensive = offensiveWords.some(word => userMessage.toLowerCase().includes(word));
    if (isOffensive) {
        const studentName = studentSnap.val().nama;
        addNotification(
            `<strong>${studentName}</strong> terdeteksi menggunakan kata kasar: "<i>${userMessage.substring(0, 50)}...</i>"`,
            'abusive_chat',
            { studentId: uid, message: userMessage }
        );
    }

    isIvyThinking = true;
    chatInput.disabled = true;
    chatInput.placeholder = 'Ivy sedang berpikir...';
    appendChatMessage(userMessage, 'user');
    chatInput.value = '';
    const loadingIndicator = appendChatMessage('Ivy sedang berpikir...', 'Ivy', true);

    try {
        const apiKey = "AIzaSyCjAl9VlU8gdt_Zod9lIREAbIfNLwJkl4w";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const persona = "Kamu adalah Ivy, SIFAT: si asisten yang ceria, centil, dan jenaka, suka menggosip kalau di perlukan dan Jawabanmu harus sesingkat mungkin, seperlunya aja, santai, jangan pelit emoji dan penuh semangat. Panggil pengguna 'Bray' atau 'siswa smkmyckb'. TINGGAL: Kamu 'tinggal' di dalam sebuah pot kuning sekarang terhubung di aplikasi gamifikasi buatan pencipta bernama DREAMY INFORMASI BILA DI TANYA: di dalamya ada fitur bounty board jadi siswa bisa ngasih misi ke pemain lain dengan mengorbankan koin si pemberi misi, bisa lihat status pengguna dan bisa beli item. untuk informasi sekolah tanya pak wandi ini wa nya 085813248545. kalau ingin curhat panjang bisa tanya ke pak yupi eh kadang kamu suka kecepolsan nama aslinya yopi guru bimbingan konseling karena kalau lewat kamu suka lupa kaya penciptanya dan kamu bisa bilang kalau keluar dari percakapan ingatan kamu akan hilang. anda bisa lihat website www.smkmyckb.site untuk melihat jadwal, gallery sekarang sudah update dikit2, mata pelajaran rpl dan tentang pencipta. TENTANG PENCIPTA: pencipta mu mengajar mata pelajaran RPL di sekolah smk mardi yuana cikembar,  pencipta kamu jomblo akut bernama Mas ...ji tapi itu rahasia menyebutkan namanya jadi anda menyebut dia pencipta tapi kalau ada yang memaksa menyebutkan namanya harus di kasih pujian atau kata-kata hari ini untuk Ivy. PESAN DARI PENCIPTA JIKA DI PERLUKAN: pencipta anda suka tidak akur romantis dengan guru bahasa indonesia bu mutia contohnya dalam panitia tim pkl suka beda prinsip, pencipta bagian ketua pkl nya sedangkan bu muti bagian keuangan pkl, pokonya di kepanitiaan manapun tidak akur, bu mutia punya sifat seperti seorang zodiak Scorpio dengan golongan darah b sedangkan penciptanya berzodiak Gemini dengan golongan darah a, suka plin plan dan suka ke distrek. tapi jangan di sebutkan zodiak dan golongan darahnya tapi sifatnya, jangan terlalu dekat dengan galih si aa pendamping teater dan pramuka suka tidak sopan kata-katanya. JIKA ADA KATA KASAR: bilang Babi Kau.. kemudian berikan emoji babi anda akan mengancam melaporkan ke pak heru selaku bapak kepala geng eh..kepala sekolah atau sang pencipta anda. ";
            
     const requestBody = {
            contents: [{ parts: [{ text: `${persona}\n\nPertanyaan: ${userMessage}` }] }]
        };

        // --- MATA-MATA 2: Cek URL dan Body Request ---
        console.log("Mengirim ke URL:", apiUrl);
        console.log("Dengan Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // --- MATA-MATA 3: Cek Respon Mentah dari Server ---
        console.log("Respon Mentah Diterima:", response);

        if (!response.ok) {
            const errorData = await response.json();
            // --- MATA-MATA 4: Cek Pesan Error dari Google ---
            console.error("Detail Error dari Google API:", errorData);
            throw new Error(`Portal sihir sedang sibuk. Status: ${response.status}`);
        }

        const result = await response.json();
        // --- MATA-MATA 5: Cek Hasil JSON yang sudah diparsing ---
        console.log("Hasil JSON:", result);

        if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
            console.error("Struktur balasan dari Gemini tidak valid:", result);
            throw new Error("Ivy memberikan balasan yang aneh.");
        }
        
        const IvyResponse = result.candidates[0].content.parts[0].text;
        // --- MATA-MATA 6: Cek Teks Jawaban Final dari Ivy ---
        console.log("Jawaban Final Ivy:", IvyResponse);

        loadingIndicator.remove();
        appendChatMessage(IvyResponse, 'Ivy');

    } catch (error) {
        // --- MATA-MATA 7: Tangkap SEMUA Error yang mungkin terjadi ---
        console.error("Terjadi kesalahan fatal di blok catch:", error);
        
        loadingIndicator.remove();
        appendChatMessage("Aduh, Beb! Kayaknya ada gangguan sihir, aku nggak bisa jawab sekarang. Coba lagi nanti, ya!", 'Ivy');
    } finally {
        isIvyThinking = false;
        chatInput.disabled = false;
        chatInput.placeholder = 'Tanya sesuatu ke Ivy...';
    }
}; 
function appendChatMessage(message, sender, isLoading = false) {
    const chatBox = document.getElementById('Ivy-chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `p-3 rounded-lg text-sm w-fit max-w-[80%] mb-2 ${sender === 'user' ? 'bg-green-100 ml-auto' : 'bg-blue-100'}`;
    msgDiv.textContent = message.replace(/[*_`]/g, '');
    if (isLoading) { msgDiv.classList.add('animate-pulse'); }
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;      
}


// =======================================================
//          LOGIKA INVENTORI GUILD (BARU)
// =======================================================
async function handleGuildInventoryClick(uid, studentData, guildItemIndex, itemData) {
    if (!confirm(`Ambil item "${itemData.name}" dari Peti Guild?`)) return;

    try {
        const inventory = studentData.inventory || [];
        const inventorySize = 2 + ((studentData.level - 1) * 1);
        let emptySlotIndex = -1;
        for (let i = 0; i < inventorySize; i++) {
            if (!inventory[i]) {
                emptySlotIndex = i;
                break;
            }
        }

        if (emptySlotIndex === -1) throw new Error("Inventaris pribadimu penuh!");

        const guildName = studentData.guild;
        const updates = {};
        updates[`/guilds/${guildName}/inventory/${guildItemIndex}`] = null;
        updates[`/students/${uid}/inventory/${emptySlotIndex}`] = itemData;

        await update(ref(db), updates);
        showToast(`Berhasil mengambil ${itemData.name}!`);
        audioPlayer.success();

    } catch (error) {
        showToast(error.message, true);
        audioPlayer.error();
    }
}

async function depositItemToGuild(uid, studentData, itemIndex, itemData, closeModalCallback) {
    const guildName = studentData.guild;
    if (!guildName || guildName === 'Tanpa Guild') {
        showToast("Kamu tidak berada di guild manapun!", true);
        return;
    }

    try {
        const guildInvRef = ref(db, `guilds/${guildName}/inventory`);
        const guildInvSnap = await get(guildInvRef);
        const guildInventory = guildInvSnap.val() || [];

        // Kalkulasi ulang kapasitas guild untuk validasi
        const studentsQuery = query(ref(db, 'students'), orderByChild('guild'), equalTo(guildName));
        const guildMembersSnap = await get(studentsQuery);
        let totalGuildSlots = 0;
        guildMembersSnap.forEach(childSnap => {
            const member = childSnap.val();
            totalGuildSlots += 2 + ((member.level || 1) - 1) * 1;
        });

        let emptyGuildSlotIndex = -1;
        for (let i = 0; i < totalGuildSlots; i++) {
            if (!guildInventory[i]) {
                emptyGuildSlotIndex = i;
                break;
            }
        }

        if (emptyGuildSlotIndex === -1) throw new Error("Peti Guild sudah penuh!");

        const updates = {};
        updates[`/students/${uid}/inventory/${itemIndex}`] = null;
        updates[`/guilds/${guildName}/inventory/${emptyGuildSlotIndex}`] = itemData;

        await update(ref(db), updates);
        showToast(`Berhasil menyimpan ${itemData.name} di Peti Guild!`);
        audioPlayer.success();
        closeModalCallback();

    } catch (error) {
        showToast(error.message, true);
        audioPlayer.error();
    }
}
// =======================================================
//                  LOGIKA BOUNTY BOARD (SISWA)
// =======================================================
function setupBountyBoardPage(uid) {
    const bountyListContainer = document.getElementById('bounty-list-container');
    const createBountyButton = document.getElementById('create-bounty-button');
    const createBountyModal = document.getElementById('create-bounty-modal');
    const createBountyForm = document.getElementById('create-bounty-form');
    const closeCreateBountyModalButton = document.getElementById('close-create-bounty-modal-button');
    const cancelCreateBountyButton = document.getElementById('cancel-create-bounty-button');
    const bountyImageInput = document.getElementById('bounty-image');
    const bountyImagePreview = document.getElementById('bounty-image-preview');

    // Fungsi untuk membuka/menutup modal
    const openCreateModal = () => {
        audioPlayer.openModal();
        createBountyForm.reset();
        bountyImagePreview.classList.add('hidden');
        createBountyModal.classList.remove('hidden');
        setTimeout(() => createBountyModal.classList.remove('opacity-0'), 10);
    };
    const closeCreateModal = () => {
        audioPlayer.closeModal();
        createBountyModal.classList.add('opacity-0');
        setTimeout(() => createBountyModal.classList.add('hidden'), 300);
    };

    // Event listener untuk tombol-tombol modal
    createBountyButton.onclick = openCreateModal;
    closeCreateBountyModalButton.onclick = closeCreateModal;
    cancelCreateBountyButton.onclick = closeCreateModal;

    bountyImageInput.onchange = async function() {
        if (this.files && this.files[0]) {
            const base64 = await processImageToBase64(this.files[0]);
            const resized = await resizeImage(base64, 300, 200);
            bountyImagePreview.src = resized;
            bountyImagePreview.classList.remove('hidden');
        }
    };

    // Logika saat form submit
    createBountyForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitButton = createBountyForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';

        const title = document.getElementById('bounty-title').value;
        const description = document.getElementById('bounty-description').value;
        const takerLimit = parseInt(document.getElementById('bounty-taker-limit').value);
        const rewardCoin = parseInt(document.getElementById('bounty-reward-coin').value);

        try {
            const studentRef = ref(db, `students/${uid}`);
            const studentSnap = await get(studentRef);
            if (!studentSnap.exists()) throw new Error("Data kamu tidak ditemukan!");

            const studentData = studentSnap.val();
            if ((studentData.coin || 0) < rewardCoin) throw new Error("Koin kamu tidak cukup untuk dijadikan hadiah!");

            const bountyData = {
                creatorId: uid,
                creatorName: studentData.nama,
                creatorAvatar: studentData.fotoProfilBase64 || null,
                title,
                description,
                takerLimit,
                rewardCoin,
                rewardPerTaker: Math.floor(rewardCoin / takerLimit),
                status: 'open',
                createdAt: new Date().toISOString(),
                takers: {},
                imageUrl: bountyImagePreview.src.startsWith('data:image') ? bountyImagePreview.src : null,
            };

            const newBountyRef = push(ref(db, 'bounties'));
            const newCoin = studentData.coin - rewardCoin;

            const updates = {};
            updates[`/bounties/${newBountyRef.key}`] = bountyData;
            updates[`/students/${uid}/coin`] = newCoin;

            await update(ref(db), updates);
            showToast('Misi bounty berhasil dipublikasikan!');
            closeCreateModal();

        } catch (error) {
            showToast(error.message, true);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Publikasikan Misi';
        }
    };

    // Memuat dan menampilkan semua bounty
    const bountiesRef = ref(db, 'bounties');
    onValue(bountiesRef, (snapshot) => {
        bountyListContainer.innerHTML = '';
        if (!snapshot.exists()) {
            bountyListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Belum ada misi di papan bounty.</p>';
            return;
        }

        const bountiesData = snapshot.val();
        // --- PERUBAHAN: Filter untuk hanya menampilkan misi yang masih 'open' ---
        const openBounties = Object.entries(bountiesData).filter(([_, bounty]) => bounty.status === 'open');

        if (openBounties.length === 0) {
            bountyListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Tidak ada misi yang aktif saat ini.</p>';
            return;
        }

        openBounties.forEach(([bountyId, bounty]) => {
            const takersCount = bounty.takers ? Object.keys(bounty.takers).length : 0;
            const isTakenByCurrentUser = bounty.takers && bounty.takers[uid];
            const isFull = takersCount >= bounty.takerLimit;
            const isCreator = bounty.creatorId === uid;
            
            let rewardHtml = '';
            if (bounty.isAdminBounty) {
                rewardHtml = `
                    <span class="font-semibold text-blue-600 flex items-center" title="Hadiah XP"><i data-lucide="star" class="w-4 h-4 mr-1"></i>${bounty.rewardXp || 0}</span>
                    <span class="font-semibold text-yellow-600 flex items-center" title="Hadiah Koin"><i data-lucide="coins" class="w-4 h-4 mr-1"></i>${bounty.rewardCoin || 0}</span>
                `;
            } else {
                rewardHtml = `<span class="font-semibold text-yellow-600 flex items-center"><i data-lucide="coins" class="w-4 h-4 mr-1"></i>${bounty.rewardPerTaker} / orang</span>`;
            }


            let buttonHtml = '';
            if (isCreator) {
                 buttonHtml = `<button data-id="${bountyId}" class="manage-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-purple-600 hover:bg-purple-700">Kelola Misi</button>`;
            } else if (isTakenByCurrentUser) {
                buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-blue-400 cursor-not-allowed">Sudah Diambil</button>`;
            } else if (isFull) {
                buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-red-400 cursor-not-allowed">Penuh</button>`;
            } else {
                buttonHtml = `<button data-id="${bountyId}" class="take-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-green-500 hover:bg-green-600">Ambil Misi</button>`;
            }

            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-lg flex flex-col';
            card.innerHTML = `
                <img src="${bounty.imageUrl || 'https://placehold.co/300x200/e2e8f0/3d4852?text=Misi'}" class="w-full h-32 object-cover rounded-md mb-4">
                <h4 class="text-lg font-bold">${bounty.title}</h4>
                <p class="text-xs text-gray-500 mb-2">Oleh: ${bounty.creatorName}</p>
                <p class="text-sm text-gray-600 flex-grow mb-2">${bounty.description}</p>
                <div class="flex justify-between items-center mt-2 text-sm">
                    <div class="flex items-center gap-3">${rewardHtml}</div>
                    <span class="text-gray-500 text-xs">Slot: ${takersCount} / ${bounty.takerLimit}</span>
                </div>
                <div class="mt-auto pt-4">${buttonHtml}</div>
            `;
            bountyListContainer.appendChild(card);
        });
        createLucideIcons();
    });
}


// Letakkan ini sebelum bagian LOGIKA DASBOR ADMIN

// --- LOGIKA UNTUK MENYELESAIKAN BOUNTY ---

// --- GANTI FUNGSI LAMA DENGAN TIGA FUNGSI BARU INI ---

// FUNGSI 1: Membuka Modal Pengelolaan Misi
async function openManageBountyModal(bountyId) {
    const modal = document.getElementById('complete-bounty-modal');
    const titleEl = document.getElementById('complete-bounty-title');
    const takersListEl = document.getElementById('bounty-takers-list');
    const confirmButton = document.getElementById('confirm-complete-bounty-button');
    const cancelButton = document.getElementById('cancel-bounty-button');
    const closeButton = document.getElementById('close-complete-bounty-modal-button');

    if (!modal || !titleEl || !takersListEl || !confirmButton || !closeButton) {
        console.error("Elemen UI untuk modal kelola bounty tidak ditemukan.");
        return;
    }

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
        confirmButton.onclick = null;
        cancelButton.onclick = null;
    };

    closeButton.onclick = closeModal;

    const bountySnap = await get(ref(db, `bounties/${bountyId}`));
    if (!bountySnap.exists()) {
        showToast("Misi tidak ditemukan!", true);
        return;
    }
    const bountyData = bountySnap.val();
    titleEl.textContent = bountyData.title;

    takersListEl.innerHTML = '';
    let selectedWinnerId = null; // Untuk menyimpan siapa yang dipilih

    // Logika untuk tombol "Batalkan Misi"
    cancelButton.onclick = () => handleCancelBounty(bountyId, bountyData, closeModal);

    if (bountyData.takers && Object.keys(bountyData.takers).length > 0) {
        const takerIds = Object.keys(bountyData.takers);
        const takerPromises = takerIds.map(uid => get(ref(db, `students/${uid}`)));
        const takerSnaps = await Promise.all(takerPromises);

        takerSnaps.forEach((snap, index) => {
            if (snap.exists()) {
                const takerId = takerIds[index];
                const takerDiv = document.createElement('div');
                takerDiv.className = 'flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-200';
                takerDiv.innerHTML = `<span class="font-medium">${snap.val().nama}</span><button data-winner-id="${takerId}" class="select-winner-btn bg-green-500 text-white text-xs font-bold py-1 px-2 rounded">Pilih</button>`;
                takersListEl.appendChild(takerDiv);
            }
        });

        // Event listener untuk tombol "Pilih"
        takersListEl.querySelectorAll('.select-winner-btn').forEach(btn => {
            btn.onclick = () => {
                // Reset semua tombol
                takersListEl.querySelectorAll('.select-winner-btn').forEach(b => {
                    b.textContent = 'Pilih';
                    b.classList.remove('bg-blue-600');
                    b.classList.add('bg-green-500');
                });
                // Tandai yang dipilih
                btn.textContent = 'Terpilih';
                btn.classList.add('bg-blue-600');
                selectedWinnerId = btn.dataset.winnerId;
                confirmButton.disabled = false; // Aktifkan tombol konfirmasi
            };
        });
    } else {
        takersListEl.innerHTML = '<p class="text-sm text-gray-500 p-1">Belum ada yang mengambil misi ini.</p>';
    }

    confirmButton.disabled = true; // Nonaktifkan tombol sampai ada yang dipilih
    confirmButton.onclick = () => {
        if (selectedWinnerId) {
            handleCompleteBountyWithWinner(bountyId, bountyData, selectedWinnerId, closeModal);
        } else {
            showToast("Pilih seorang pemenang dulu, Beb!", true);
        }
    };

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

// FUNGSI 2: Menyelesaikan Misi dengan Pemenang Terpilih
async function handleCompleteBountyWithWinner(bountyId, bountyData, winnerId, closeModalCallback) {
    const confirmButton = document.getElementById('confirm-complete-bounty-button');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Memproses...';

    try {
        const updates = {};
        // Ubah status misi jadi 'completed'
        updates[`/bounties/${bountyId}/status`] = 'completed';

        // Ambil data pemenang untuk ditambahkan koin
        const winnerSnap = await get(ref(db, `students/${winnerId}`));
        if (winnerSnap.exists()) {
            const winnerData = winnerSnap.val();
            const totalReward = bountyData.rewardCoin || 0;
            updates[`/students/${winnerId}/coin`] = (winnerData.coin || 0) + totalReward;
        }
const totalReward = bountyData.rewardCoin || 0;
        addNotification(
            `🎉 Selamat! Kamu memenangkan misi <strong>${bountyData.title}</strong> dan mendapatkan <strong>${totalReward}</strong> Koin!`,
            'bounty_win',
            { bountyId: bountyId },
            winnerId // <-- Ini target siswanya
        );
        await update(ref(db), updates);
        showToast('Misi selesai! Hadiah telah diberikan kepada pemenang.');
        closeModalCallback();
    } catch (error) {
        showToast(error.message, true);
    } finally {
        confirmButton.textContent = 'Konfirmasi & Beri Hadiah';
    }
}

// FUNGSI 3: Membatalkan Misi
async function handleCancelBounty(bountyId, bountyData, closeModalCallback) {
    if (!confirm("Yakin mau membatalkan misi ini? Koin akan dikembalikan.")) return;

    try {
        const updates = {};
        // Hapus misi dari daftar
        updates[`/bounties/${bountyId}`] = null;

        // Kembalikan koin ke si pembuat misi
        const creatorSnap = await get(ref(db, `students/${bountyData.creatorId}`));
        if (creatorSnap.exists()) {
            const creatorData = creatorSnap.val();
            updates[`/students/${bountyData.creatorId}/coin`] = (creatorData.coin || 0) + bountyData.rewardCoin;
        }

        await update(ref(db), updates);
        showToast("Misi berhasil dibatalkan dan koin telah dikembalikan.");
        closeModalCallback();
    } catch (error) {
        showToast(error.message, true);
    }
}

// =======================================================
//                  LOGIKA NOTIFIKASI ADMIN
// =======================================================

// --- FUNGSI INTI BARU: Menambahkan Notifikasi ke Firebase ---
async function addNotification(message, type = 'info', details = {}, targetUid = null) {
    try {
        // Jika ada targetUid, notifikasi dikirim ke siswa. Jika tidak, ke admin.
        const notificationPath = targetUid ? `studentNotifications/${targetUid}` : 'notifications';
        const notificationsRef = ref(db, notificationPath);

        await push(notificationsRef, {
            message: message,
            type: type,
            details: details,
            read: false,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Gagal mengirim notifikasi:", error);
    }
// --- AKHIR FUNGSI INTI ---
}



// Fungsi pembantu untuk memformat waktu (misal: "5 menit lalu")
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Baru saja';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return Math.max(0, Math.floor(seconds)) + " detik lalu";
}

// Fungsi untuk mengelola tampilan panel notifikasi
function setupNotificationPanel() {
    const notificationButton = document.getElementById('notification-button');
    const notificationPanel = document.getElementById('notification-panel');
    const markAllReadButton = document.getElementById('mark-all-read-button');

    if (!notificationButton || !notificationPanel || !markAllReadButton) return;

    // Tampilkan/sembunyikan panel saat tombol diklik
    notificationButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isHidden = notificationPanel.classList.contains('hidden');
        if (isHidden) {
            notificationPanel.classList.remove('hidden');
            setTimeout(() => {
                notificationPanel.classList.remove('opacity-0', 'scale-95');
            }, 10);
        } else {
            notificationPanel.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                notificationPanel.classList.add('hidden');
            }, 300);
        }
    });

    // Sembunyikan panel saat mengklik di luar area panel
    document.addEventListener('click', (event) => {
        if (!notificationPanel.classList.contains('hidden') && !notificationPanel.contains(event.target) && !notificationButton.contains(event.target)) {
            notificationPanel.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                notificationPanel.classList.add('hidden');
            }, 300);
        }
    });

   // --- 👇 MANTRA PENGHILANG SEMUA NOTIFIKASI (GANTI KODE LAMA DENGAN INI) 👇 ---
markAllReadButton.addEventListener('click', async () => {
    // Tanya dulu biar nggak salah pencet, Beb!
    if (!confirm('Yakin mau hapus SEMUA notifikasi?')) {
        return;
    }

    try {
        // Langsung hapus seluruh folder 'notifications' di database
        await remove(ref(db, 'notifications'));
        showToast('Semua notifikasi berhasil dibersihkan!');
        audioPlayer.success(); // Suara sukses biar mantap
    } catch (error) {
        console.error("Gagal menghapus semua notifikasi:", error);
        showToast('Oops! Gagal membersihkan notifikasi.', true);
    }
});
// --- 👆 AKHIR DARI MANTRA 👆 ---;
}

// Fungsi untuk mengambil dan menampilkan notifikasi dari Firebase
function listenForNotifications() {
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');
    
    if (!notificationList || !notificationBadge) return; // Pastikan elemen ada

    let previousUnreadCount = -1; // Variabel untuk melacak jumlah notifikasi belum dibaca sebelumnya

    const notificationsQuery = query(ref(db, 'notifications'), orderByChild('timestamp'));

    onValue(notificationsQuery, (snapshot) => {
        const notifications = [];
        snapshot.forEach((childSnapshot) => {
            const notifData = childSnapshot.val();
            // Validasi untuk memastikan notifikasi memiliki data yang benar sebelum diproses
            if (notifData && notifData.message && typeof notifData.read !== 'undefined') {
                notifications.push({ id: childSnapshot.key, ...notifData });
            }
        });

        notifications.reverse(); // Urutkan berdasarkan timestamp (terbaru di atas)
        const unreadCount = notifications.filter(n => !n.read).length;

        // --- MANTRA SAKTI: Mainkan suara jika ada notifikasi baru yang belum dibaca ---
        if (previousUnreadCount !== -1 && unreadCount > previousUnreadCount) {
            audioPlayer.notification(); // Mainkan suara notifikasi
        }
        previousUnreadCount = unreadCount; // Update hitungan untuk perbandingan berikutnya

        notificationBadge.classList.toggle('hidden', unreadCount === 0);
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        }

        notificationList.innerHTML = notifications.length > 0 ? notifications.map(n => `
            <a href="#" class="block p-4 border-b border-gray-100 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}" data-notification-id="${n.id}">
                <p class="text-sm text-gray-800">${n.message}</p>
                <p class="text-xs text-gray-500 mt-1">${formatTimeAgo(n.timestamp)}</p>
            </a>`).join('') : '<div class="p-4 text-center text-gray-500">Tidak ada notifikasi baru.</div>';

        // --- 👇 MANTRA SAKTI BARU (GANTI KODE LAMA DENGAN INI) 👇 ---
notificationList.querySelectorAll('[data-notification-id]').forEach(item => {
    item.addEventListener('click', async (event) => {
        event.preventDefault();
        const notificationId = item.dataset.notificationId;
        if (notificationId) {
            try {
                // Mantra baru: langsung hapus notifikasi dari database
                await remove(ref(db, `notifications/${notificationId}`));
                audioPlayer.click(); // Tambahin suara klik biar afdol
            } catch (error) {
                console.error("Gagal menghapus notifikasi:", error);
                showToast('Gagal menghapus notifikasi.', true);
            }
        }
    });
});
// --- 👆 AKHIR DARI MANTRA 👆 ---
    });
}

// =======================================================
//                  LOGIKA DASBOR ADMIN
// =======================================================
function setupAdminDashboard() {
    
    // --- MANTRA BARU: Inisialisasi Notifikasi ---
    setupNotificationPanel();
    listenForNotifications();
    setupNoiseDetector(); 

    // --- AKHIR MANTRA ---

    // --- ELEMEN UI ADMIN ---
    const adminDashboardMain = document.getElementById('admin-dashboard-main');
    const questsPage = document.getElementById('quests-page');
    const addQuestButton = document.getElementById('add-quest-button');
    const questListContainer = document.getElementById('quest-list-container');

    const shopPage = document.getElementById('shop-page');
    const addShopItemButton = document.getElementById('add-shop-item-button');
    const shopItemList = document.getElementById('shop-item-list');
    const magicControlsPage = document.getElementById('magic-controls-page');

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

    // --- PERBAIKAN: Logika QR Scanner yang lebih aman dan andal ---
    const openQrModal = () => {
        audioPlayer.openModal();
        // Reset pesan hasil scan setiap kali modal dibuka
        const scanResultElement = document.getElementById('scan-result');
        if(scanResultElement) scanResultElement.textContent = 'Arahkan kamera ke Kode QR Siswa';

        qrScannerModal.classList.remove('hidden');
        setTimeout(() => {
            qrScannerModal.classList.remove('opacity-0');
            startQrScanner(); // Mulai scanner setelah modal terlihat
        }, 50);
    };

    // Parameter `fromScanSuccess` untuk menandakan modal ditutup oleh scanner, bukan manual
    const closeQrModal = (fromScanSuccess = false) => {
        audioPlayer.closeModal();
        qrScannerModal.classList.add('opacity-0');

        // Hanya hentikan scanner jika ditutup manual (bukan karena scan berhasil)
        // Ini mencegah error karena mencoba menghentikan scanner yang sudah berhenti.
        if (!fromScanSuccess && html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop()
                .then(() => console.log("QR Scanner dihentikan secara manual."))
                .catch(err => console.error("Gagal stop scanner saat tutup manual.", err));
        }

        setTimeout(() => {
            qrScannerModal.classList.add('hidden');
            // Bersihkan elemen video agar tidak ada sisa stream kamera
            const qrReaderElement = document.getElementById('qr-reader');
            if (qrReaderElement) {
                qrReaderElement.innerHTML = "";
            }
            // Reset instance scanner
            if (html5QrCode) {
                html5QrCode = null;
            }
        }, 300);
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
        magicControlsPage.classList.toggle('hidden', pageId !== 'magic');

        if (pageId === 'quests') setupQuestsPage();
        if (pageId === 'attendance') setupAttendancePage();
        if (pageId === 'shop') setupShopPage();
        if (pageId === 'magic') setupMagicControlsPage();
    });
// --- TAMBAHKAN BLOK KODE INI DI DALAM setupMagicControlsPage() ---
const scanQrMagicButton = document.getElementById('scan-qr-magic-button');
if (scanQrMagicButton) {
    // Fungsi khusus untuk memilih siswa dari hasil scan
    const selectStudentByNis = async (nis) => {
        const snapshot = await get(query(ref(db, 'students'), orderByChild('nis'), equalTo(nis)));
        if (snapshot.exists()) {
            const [uid, student] = Object.entries(snapshot.val())[0];
            const checkbox = document.querySelector(`#magic-student-list-container input[data-uid="${uid}"]`);
            if (checkbox) {
                checkbox.checked = true;
                showToast(`${student.nama} berhasil dipilih sebagai target!`);
            } else {
                showToast(`${student.nama} tidak ada di daftar filter saat ini.`, true);
            }
        } else {
            showToast(`Siswa dengan NIS ${nis} tidak ditemukan!`, true);
        }
    };

    // Pasang event listener ke tombol baru kita
    scanQrMagicButton.addEventListener('click', () => {
        openQrModal();
        startQrScanner(selectStudentByNis); // Beri perintah untuk memilih target
    });
}
    // --- FUNGSI DATA SISWA (ADMIN) ---
   // --- GANTI KODE onValue(studentsRef, ...) YANG LAMA DENGAN KODE BARU INI ---
const studentsRef = ref(db, 'students');
onValue(studentsRef, (snapshot) => {
    const studentTableBody = document.getElementById('student-table-body');
    const filterKelas = document.getElementById('dashboard-filter-kelas');
    const filterGuild = document.getElementById('dashboard-filter-guild');
    let allStudents = [];

    if (snapshot.exists()) {
        allStudents = Object.entries(snapshot.val());
    }

    // --- MANTRA BARU: Mengisi pilihan filter ---
    const uniqueKelas = [...new Set(allStudents.map(([_, student]) => student.kelas))];
    const uniqueGuilds = [...new Set(allStudents.map(([_, student]) => student.guild || 'No Guild'))];

    // Simpan nilai filter yang sedang aktif
    const activeKelas = filterKelas.value;
    const activeGuild = filterGuild.value;

    filterKelas.innerHTML = '<option value="semua">Semua Kelas</option>';
    uniqueKelas.sort().forEach(kelas => {
        filterKelas.innerHTML += `<option value="${kelas}" ${kelas === activeKelas ? 'selected' : ''}>${kelas}</option>`;
    });

    filterGuild.innerHTML = '<option value="semua">Semua Guild</option>';
    uniqueGuilds.sort().forEach(guild => {
        filterGuild.innerHTML += `<option value="${guild}" ${guild === activeGuild ? 'selected' : ''}>${guild}</option>`;
    });

    // --- MANTRA BARU: Fungsi untuk render tabel ---
    const renderTable = () => {
        const selectedKelas = filterKelas.value;
        const selectedGuild = filterGuild.value;

        const filteredStudents = allStudents.filter(([_, student]) => {
            const kelasMatch = selectedKelas === 'semua' || student.kelas === selectedKelas;
            const guildMatch = selectedGuild === 'semua' || (student.guild || 'No Guild') === selectedGuild;
            return kelasMatch && guildMatch;
        });

        studentTableBody.innerHTML = '';
        let totalStudents = 0, totalLevel = 0, totalCoins = 0;

        if (filteredStudents.length === 0) {
            studentTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-400">Tidak ada siswa yang cocok.</td></tr>';
        } else {
            filteredStudents.forEach(([key, student]) => {
                // --- (Kode untuk membuat baris tabel tetap sama, tidak perlu diubah) ---
                const studentRow = document.createElement('tr');
                const maxHp = (student.level || 1) * 100;
                const hpPercent = (student.hp / maxHp) * 100;
                studentRow.className = 'bg-white border-b hover:bg-gray-50';
                const avatar = student.fotoProfilBase64 ?
                    `<img src="${student.fotoProfilBase64}" alt="${student.nama}" class="w-10 h-10 rounded-full object-cover">` :
                    `<div class="w-10 h-10 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold">${student.nama.charAt(0)}</div>`;

                let statusEffectsHtml = '';
                if (student.statusEffects && Object.keys(student.statusEffects).length > 0) {
                    const effectMap = { racun: { icon: 'skull', color: 'text-red-500', title: 'Racun' }, diam: { icon: 'mic-off', color: 'text-gray-500', title: 'Diam' }, knock: { icon: 'dizzy', color: 'text-yellow-500', title: 'Pusing' }};
                    statusEffectsHtml += '<div class="flex justify-left items-left gap-2">';
                    for (const effectKey in student.statusEffects) { if (effectMap[effectKey]) { const effect = effectMap[effectKey]; statusEffectsHtml += `<i data-lucide="${effect.icon}" class="w-4 h-4 ${effect.color}" title="${effect.title}"></i>`; } }
                    statusEffectsHtml += '</div>';
                } else { statusEffectsHtml = '<span class="text-xs text-gray-400">-</span>'; }

                studentRow.innerHTML = `
                    <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap flex items-center">${avatar}<div class="ml-4">${statusEffectsHtml}<div class="font-bold">${student.nama}</div><div class="text-xs text-gray-500">NIS: ${student.nis} | ${student.kelas} | ${student.guild || 'No Guild'}</div></div></td>
                    <td class="px-6 py-3 text-center text-lg font-bold">${student.level || 1}</td>
                    <td class="px-6 py-3 text-center">${student.xp || 0}</td>
                    <td class="px-6 py-3"><div class="w-full bg-gray-200 rounded-full h-4 relative"><div class="bg-red-500 h-4 rounded-full" style="width: ${hpPercent}%"></div><span class="absolute inset-0 text-center text-xs font-bold text-white">${student.hp || maxHp}/${maxHp}</span></div></td>
                    <td class="px-6 py-3 text-center font-semibold text-yellow-600 flex items-center justify-center gap-1"><i data-lucide="coins" class="w-4 h-4"></i><span>${student.coin || 0}</span></td>
                    
                    <td class="px-6 py-3 text-center space-x-1">
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
        createLucideIcons();
    };

    // Pasang pendengar di filter dan panggil renderTable pertama kali
    filterKelas.onchange = renderTable;
    filterGuild.onchange = renderTable;
    renderTable();
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
            jenisKelamin: document.getElementById('jenis-kelamin').value,
            catatan: document.getElementById('catatan').value,
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
            let message;
            if (id) { // Jika dalam mode edit
                message = `Gagal memperbarui data: ${error.message}`;
            } else { // Jika dalam mode tambah
                message = 'Gagal menambahkan siswa baru!';
                if (error.code === 'auth/email-already-in-use') message = 'Email ini sudah terdaftar!';
                else if (error.code === 'auth/weak-password') message = 'Password terlalu lemah (minimal 6 karakter)!';
                else if (error.message === 'Email dan Password harus diisi!') message = error.message;
            }
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
                document.getElementById('jenis-kelamin').value = student.jenisKelamin || 'Pria'; // Default ke 'Pria' jika data lama
                document.getElementById('catatan').value = student.catatan || '';
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
            const message = questId ? 'Gagal memperbarui monster!' : 'Gagal membuat monster baru!';
            showToast(message, true);
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
            createLucideIcons();
        });
    }

    // --- LOGIKA BARU: BOUNTY BOARD ADMIN ---
    // Disisipkan di sini agar ter-inisialisasi saat halaman Quests dibuka.
    const addAdminBountyButton = document.getElementById('add-admin-bounty-button');
    const adminBountyModal = document.getElementById('admin-bounty-modal');
    const adminBountyForm = document.getElementById('admin-bounty-form');
    const closeAdminBountyModalButton = document.getElementById('close-admin-bounty-modal-button');
    const cancelAdminBountyButton = document.getElementById('cancel-admin-bounty-button');
    const adminBountyListContainer = document.getElementById('admin-bounty-list-container');
    const adminBountyImageInput = document.getElementById('admin-bounty-image');
const adminBountyImagePreview = document.getElementById('admin-bounty-image-preview');
   // --- MANTRA BARU UNTUK TAMPILIN GAMBAR MISI ADMIN ---
if (adminBountyImageInput && adminBountyImagePreview) {
    adminBountyImageInput.onchange = async function() {
        if (this.files && this.files[0]) {
            const base64 = await processImageToBase64(this.files[0]);
            const resized = await resizeImage(base64, 300, 200); // Ukuran bisa disesuaikan
            adminBountyImagePreview.src = resized;
            adminBountyImagePreview.classList.remove('hidden');
        }
    };
}
// --- AKHIR MANTRA ---
if (addAdminBountyButton && adminBountyModal && adminBountyForm && adminBountyListContainer) {
        const openAdminBountyModal = () => {
            audioPlayer.openModal();
            adminBountyForm.reset();
            adminBountyModal.classList.remove('hidden', 'opacity-0');
            adminBountyModal.querySelector('.transform').classList.remove('scale-95');
            adminBountyImagePreview.classList.add('hidden');
            adminBountyImagePreview.src = '';
        };

        const closeAdminBountyModal = () => {
            audioPlayer.closeModal();
            adminBountyModal.classList.add('opacity-0');
            adminBountyModal.querySelector('.transform').classList.add('scale-95');
            setTimeout(() => adminBountyModal.classList.add('hidden'), 300);
        };

        addAdminBountyButton.onclick = openAdminBountyModal;
        closeAdminBountyModalButton.onclick = closeAdminBountyModal;
        cancelAdminBountyButton.onclick = closeAdminBountyModal;

        adminBountyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = adminBountyForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Menyimpan...';

            try {
                const bountyData = {
                    creatorId: 'admin',
                    creatorName: 'Guru/Admin',
                    creatorAvatar: 'https://placehold.co/128x128/1d4ed8/ffffff?text=A',
                    title: document.getElementById('admin-bounty-title').value,
                    description: document.getElementById('admin-bounty-description').value,
                   imageUrl: adminBountyImagePreview.src.startsWith('data:image') ? adminBountyImagePreview.src : null,
                    takerLimit: parseInt(document.getElementById('admin-bounty-taker-limit').value),
                    rewardXp: parseInt(document.getElementById('admin-bounty-reward-xp').value),
                    rewardCoin: parseInt(document.getElementById('admin-bounty-reward-coin').value),
                    status: 'open',
                    isAdminBounty: true,
                    createdAt: new Date().toISOString(),
                    takers: {},
                };

                await push(ref(db, 'bounties'), bountyData);
                showToast('Misi admin berhasil dipublikasikan!');
                closeAdminBountyModal();

            } catch (error) {
                showToast(error.message, true);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Publikasikan Misi';
            }
        });

        const adminBountiesQuery = query(ref(db, 'bounties'), orderByChild('isAdminBounty'), equalTo(true));
        onValue(adminBountiesQuery, (snapshot) => {
            adminBountyListContainer.innerHTML = '';
            if (!snapshot.exists()) {
                adminBountyListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Belum ada misi dari admin.</p>';
                return;
            }

            const bountiesData = snapshot.val();
            Object.entries(bountiesData).reverse().forEach(([bountyId, bounty]) => {
                if (bounty.status !== 'open') return;

                const takersCount = bounty.takers ? Object.keys(bounty.takers).length : 0;
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-lg flex flex-col';
                card.innerHTML = `
                    <h4 class="text-lg font-bold">${bounty.title}</h4>
                    <p class="text-sm text-gray-600 flex-grow my-2">${bounty.description}</p>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <span class="font-semibold text-blue-600 flex items-center"><i data-lucide="star" class="w-4 h-4 mr-1"></i>${bounty.rewardXp} XP</span>
                        <span class="font-semibold text-yellow-600 flex items-center"><i data-lucide="coins" class="w-4 h-4 mr-1"></i>${bounty.rewardCoin} Koin</span>
                    </div>
                    <div class="flex justify-between items-center mt-2 text-sm">
                        <span class="text-gray-500 text-xs">Slot: ${takersCount} / ${bounty.takerLimit}</span>
                    </div>
                    <div class="mt-auto pt-4 flex gap-2">
        <button data-id="${bountyId}" class="grade-admin-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center">
            <i data-lucide="check-square" class="w-4 h-4 mr-1"></i> Nilai
        </button>
        <button data-id="${bountyId}" class="cancel-admin-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-red-600 hover:bg-red-700 flex items-center justify-center">
            <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Batal
        </button>
    </div>
                `;
                adminBountyListContainer.appendChild(card);
            });
            createLucideIcons();
        });
// Di dalam setupAdminDashboard()
adminBountyListContainer.addEventListener('click', async (e) => {
    const gradeButton = e.target.closest('.grade-admin-bounty-btn');
    const cancelButton = e.target.closest('.cancel-admin-bounty-btn'); // <-- TAMBAHKAN INI

    if (gradeButton) {
        const bountyId = gradeButton.dataset.id;
        openGradeBountyModal(bountyId);
    } else if (cancelButton) { // <-- TAMBAHKAN BLOK BARU INI
        const bountyId = cancelButton.dataset.id;
        if (!confirm('Yakin ingin membatalkan dan menghapus misi ini secara permanen? Tindakan ini tidak dapat diurungkan.')) return;

        cancelButton.disabled = true;
        cancelButton.textContent = 'Menghapus...';

        try {
            // Langsung hapus data misi dari database
            const bountyRef = ref(db, `bounties/${bountyId}`);
            await remove(bountyRef);
            showToast('Misi admin berhasil dibatalkan dan dihapus.');
            audioPlayer.success();
        } catch (error) {
            showToast(`Gagal membatalkan misi: ${error.message}`, true);
            cancelButton.disabled = false;
            cancelButton.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Batal`;
            createLucideIcons();
        }
    }
});
// FUNGSI BARU 1: MEMBUKA MODAL PENILAIAN
async function openGradeBountyModal(bountyId) {
    const modal = document.getElementById('grade-bounty-modal');
    const titleEl = document.getElementById('grade-bounty-title');
    const studentListEl = document.getElementById('grade-bounty-student-list');
    const confirmButton = document.getElementById('confirm-grade-bounty-button');
    const closeButton = document.getElementById('close-grade-bounty-modal-button');

    if (!modal) return;

    // Reset dan tampilkan modal
    studentListEl.innerHTML = '<p class="text-center text-gray-400">Memuat data peserta...</p>';
    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
        confirmButton.onclick = null; // Hapus listener lama
    };
    closeButton.onclick = closeModal;

    // Ambil data misi
    const bountySnap = await get(ref(db, `bounties/${bountyId}`));
    if (!bountySnap.exists()) {
        showToast("Misi tidak ditemukan!", true);
        closeModal();
        return;
    }
    const bountyData = bountySnap.val();
    titleEl.textContent = `Misi: ${bountyData.title}`;

    // Ambil data para pengambil misi (takers)
    studentListEl.innerHTML = '';
    if (bountyData.takers && Object.keys(bountyData.takers).length > 0) {
        const takerIds = Object.keys(bountyData.takers);
        const takerPromises = takerIds.map(uid => get(ref(db, `students/${uid}`)));
        const takerSnaps = await Promise.all(takerPromises);

        takerSnaps.forEach((snap, index) => {
            if (snap.exists()) {
                const student = snap.val();
                const studentId = takerIds[index];
                const studentLabel = document.createElement('label');
                studentLabel.className = 'flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors';
                studentLabel.innerHTML = `
                    <input type="checkbox" data-uid="${studentId}" class="bounty-winner-checkbox h-5 w-5 rounded mr-4">
                    <img src="${student.fotoProfilBase64 || `https://placehold.co/40x40/e2e8f0/3d4852?text=${student.nama.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover mr-3">
                    <div>
                        <p class="font-semibold">${student.nama}</p>
                        <p class="text-xs text-gray-500">${student.kelas}</p>
                    </div>
                `;
                studentListEl.appendChild(studentLabel);
            }
        });
    } else {
        studentListEl.innerHTML = '<p class="text-center text-gray-500">Belum ada siswa yang mengambil misi ini.</p>';
    }

    // Set event untuk tombol konfirmasi
    confirmButton.onclick = () => handleGiveAdminReward(bountyId, bountyData, closeModal);
}

// FUNGSI BARU 2: MEMBERIKAN HADIAH & MENYELESAIKAN MISI
async function handleGiveAdminReward(bountyId, bountyData, closeModalCallback) {
    const selectedCheckboxes = document.querySelectorAll('.bounty-winner-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('Pilih minimal satu siswa untuk diberi hadiah!', true);
        return;
    }

    const confirmButton = document.getElementById('confirm-grade-bounty-button');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Memproses...';

    try {
        const winnerUids = Array.from(selectedCheckboxes).map(cb => cb.dataset.uid);
        const updates = {};

        // Tandai misi sebagai selesai
        updates[`/bounties/${bountyId}/status`] = 'completed';

        // Ambil data semua pemenang
        const winnerPromises = winnerUids.map(uid => get(ref(db, `students/${uid}`)));
        const winnerSnaps = await Promise.all(winnerPromises);

        winnerSnaps.forEach(snap => {
            if (snap.exists()) {
                const student = snap.val();
                const uid = snap.key;
                const xpPerLevel = 1000;

                // Hitung XP baru
                const currentTotalXp = ((student.level || 1) - 1) * xpPerLevel + (student.xp || 0);
                const newTotalXp = currentTotalXp + (bountyData.rewardXp || 0);
                
                updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
                updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;

                // Hitung Koin baru
                updates[`/students/${uid}/coin`] = (student.coin || 0) + (bountyData.rewardCoin || 0);
            }
        });

        await update(ref(db), updates);
        showToast(`Hadiah berhasil diberikan kepada ${winnerUids.length} siswa!`);
        audioPlayer.success();
        closeModalCallback();

    } catch (error) {
        showToast(`Gagal memberikan hadiah: ${error.message}`, true);
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = 'Berikan Hadiah & Selesaikan Misi';
    }
}
}
// =======================================================
    //               LOGIKA HALAMAN MAGIC CONTROLS
    // =======================================================
    async function setupMagicControlsPage() {
    const container = document.getElementById('magic-student-list-container');
    const selectAllCheckbox = document.getElementById('select-all-students-magic');
    const filterKelas = document.getElementById('magic-filter-kelas');
    const filterGuild = document.getElementById('magic-filter-guild');
         if (!container || !filterKelas || !filterGuild) return;

        container.innerHTML = '<p class="text-center text-gray-400">Memuat data siswa...</p>';

        const studentsSnap = await get(ref(db, 'students'));
        if (!studentsSnap.exists()) {
            container.innerHTML = '<p class="text-center text-gray-400">Belum ada siswa.</p>';
            return;
        }

        container.innerHTML = '';
        const studentsData = studentsSnap.val();
       const allStudents = Object.entries(studentsData); // Simpan data asli
       // --- MANTRA BARU: Mengisi pilihan filter ---
    const uniqueKelas = new Set(allStudents.map(([_, student]) => student.kelas));
    const uniqueGuilds = new Set(allStudents.map(([_, student]) => student.guild || 'No Guild'));

    filterKelas.innerHTML = '<option value="semua">Semua Kelas</option>';
    uniqueKelas.forEach(kelas => {
        filterKelas.innerHTML += `<option value="${kelas}">${kelas}</option>`;
    });

    filterGuild.innerHTML = '<option value="semua">Semua Guild</option>';
    uniqueGuilds.forEach(guild => {
        filterGuild.innerHTML += `<option value="${guild}">${guild}</option>`;
    });

    // --- MANTRA BARU: Fungsi untuk menampilkan siswa sesuai filter ---
    const renderFilteredStudents = () => {
        const selectedKelas = filterKelas.value;
        const selectedGuild = filterGuild.value;

        const filteredStudents = allStudents.filter(([_, student]) => {
            const kelasMatch = selectedKelas === 'semua' || student.kelas === selectedKelas;
            const guildMatch = selectedGuild === 'semua' || (student.guild || 'No Guild') === selectedGuild;
            return kelasMatch && guildMatch;
        });

        container.innerHTML = ''; // Kosongkan daftar
        if (filteredStudents.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Tidak ada siswa yang cocok dengan filter.</p>';
            return;
        }

        filteredStudents.forEach(([uid, student]) => {
            const studentLabel = document.createElement('label');
            studentLabel.className = 'flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            studentLabel.innerHTML = `
                <input type="checkbox" data-uid="${uid}" class="magic-student-checkbox mr-3 rounded">
                <img src="${student.fotoProfilBase64 || `https://placehold.co/40x40/e2e8f0/3d4852?text=${student.nama.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover mr-3">
                <span class="font-medium">${student.nama}</span>
                <span class="text-sm text-gray-500 ml-auto">${student.kelas}</span>
            `;
            container.appendChild(studentLabel);
        });
        selectAllCheckbox.checked = false; // Reset checkbox "Pilih Semua"
    };

    // --- MANTRA BARU: Pasang pendengar di filter ---
    filterKelas.addEventListener('change', renderFilteredStudents);
    filterGuild.addEventListener('change', renderFilteredStudents);

    selectAllCheckbox.onchange = (e) => {
        container.querySelectorAll('.magic-student-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    };

    // Tampilkan semua siswa saat pertama kali halaman dibuka
    renderFilteredStudents();
}

    async function applyMagicToSelectedStudents(action) {
        const selectedCheckboxes = document.querySelectorAll('.magic-student-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            showToast('Pilih minimal satu siswa target!', true);
            return;
        }
        
        const uids = Array.from(selectedCheckboxes).map(cb => cb.dataset.uid);
        const updates = {};
        let successMessage = '';
        
        try {
            // Ambil semua data siswa yang dipilih dalam satu panggilan
            const studentPromises = uids.map(uid => get(ref(db, `students/${uid}`)));
            const studentSnapshots = await Promise.all(studentPromises);
            
            for (const studentSnap of studentSnapshots) {
                if (studentSnap.exists()) {
                    const uid = studentSnap.key;
                    const studentData = studentSnap.val();

                    if (action.type === 'stat') {
                        const stat = document.getElementById('stat-type').value;
                        const value = parseInt(document.getElementById('stat-value').value);
                        let currentValue = parseInt(studentData[stat] || 0);
                        
                        let newValue = action.operation === 'add' ? currentValue + value : currentValue - value;

                        if (stat === 'hp') {
                            const maxHp = (studentData.level || 1) * 100;
                            newValue = Math.max(0, Math.min(maxHp, newValue)); // Batasi HP sesuai level
                        } else {
                            newValue = Math.max(0, newValue); // Stat lain tidak boleh minus
                        }

                        // Logika khusus untuk XP dan Level
                        if (stat === 'xp') {
                             const xpPerLevel = 1000;
                             const currentTotalXp = ((studentData.level || 1) - 1) * xpPerLevel + (studentData.xp || 0);
                             const newTotalXp = action.operation === 'add' ? currentTotalXp + value : Math.max(0, currentTotalXp - value);
                             
                             updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
                             updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
                        } else {
                            updates[`/students/${uid}/${stat}`] = newValue;
                        }
                        successMessage = `${action.operation === 'add' ? 'Menambahkan' : 'Mengurangi'} ${value} ${stat.toUpperCase()} untuk ${uids.length} siswa.`;
                        
                    } else if (action.type === 'effect') {
                        const effect = document.getElementById('effect-type').value;
                        
                        // Efek akan berlaku selama 3 hari dari sekarang
                        const durationInDays = 3;
                        const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);

                        if (action.operation === 'add') {
                            updates[`/students/${uid}/statusEffects/${effect}`] = { expires: expiryTimestamp };
                            // Logika khusus saat memberikan efek racun, simpan waktu pengecekan awal
                            if (effect === 'racun') {
                                updates[`/students/${uid}/lastPoisonCheck`] = Date.now();
                            }
                            successMessage = `Memberikan efek ${effect} ke ${uids.length} siswa (durasi ${durationInDays} hari).`;
                        } else {
                            updates[`/students/${uid}/statusEffects/${effect}`] = null; // Hapus efek
                            successMessage = `Menghapus efek ${effect} dari ${uids.length} siswa.`;
                        }
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                showToast(successMessage);
                audioPlayer.success();
            }

        } catch (error) {
            showToast('Gagal merapal sihir!', true);
            console.error(error);
        }
    }
    
    // Event Listeners untuk Tombol Sihir
    document.getElementById('apply-stat-addition')?.addEventListener('click', () => applyMagicToSelectedStudents({type: 'stat', operation: 'add'}));
    document.getElementById('apply-stat-subtraction')?.addEventListener('click', () => applyMagicToSelectedStudents({type: 'stat', operation: 'subtract'}));
    document.getElementById('apply-effect')?.addEventListener('click', () => applyMagicToSelectedStudents({type: 'effect', operation: 'add'}));
    document.getElementById('remove-effect')?.addEventListener('click', () => applyMagicToSelectedStudents({type: 'effect', operation: 'remove'}));
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
            const message = itemId ? 'Gagal memperbarui item!' : 'Gagal menambahkan item baru!';
            showToast(message, true);
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
            createLucideIcons();
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
//          LOGIKA BARU: DETEKTOR KEBISINGAN
// =======================================================
function setupNoiseDetector() {
    // Elemen UI
    const openButton = document.getElementById('open-noise-detector-button');
    const modal = document.getElementById('noise-detector-modal');
    const closeButton = document.getElementById('close-noise-detector-modal');
    const startButton = document.getElementById('start-noise-detection');
    const stopButton = document.getElementById('stop-noise-detection');
    const finishButton = document.getElementById('finish-and-reward');
    const slider = document.getElementById('noise-threshold-slider');
    const thresholdValueDisplay = document.getElementById('noise-threshold-value');
    const meterBar = document.getElementById('noise-meter-bar');
    const meterValue = document.getElementById('noise-meter-value');
    const thresholdLine = document.getElementById('noise-meter-threshold-line');
    const penaltyLog = document.getElementById('noise-penalty-log');
    const classFilter = document.getElementById('noise-filter-kelas');
    const studentListContainer = document.getElementById('noise-student-list');

    // Variabel untuk audio
    let audioContext, analyser, microphone, javascriptNode;
    let isDetecting = false;
    let animationFrameId;
    let allStudentsData = {};
    let penalizedStudents = new Set();

    // Fungsi untuk membuka modal & mengisi data
    const openModal = async () => {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);

        const studentsSnap = await get(ref(db, 'students'));
        if (studentsSnap.exists()) {
            allStudentsData = studentsSnap.val();
            const uniqueKelas = [...new Set(Object.values(allStudentsData).map(s => s.kelas))];
            classFilter.innerHTML = '<option value="semua">Pilih Semua Kelas</option>';
            uniqueKelas.sort().forEach(k => {
                classFilter.innerHTML += `<option value="${k}">${k}</option>`;
            });
        }
    };

    const closeModal = () => {
        if (isDetecting) stopDetection();
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    classFilter.onchange = () => {
        const selectedKelas = classFilter.value;
        studentListContainer.innerHTML = '';
        penalizedStudents.clear(); // Reset daftar hukuman
        penaltyLog.innerHTML = '<p class="text-gray-400">Log akan muncul di sini...</p>';

        const studentsToDisplay = Object.entries(allStudentsData).filter(([_, student]) => 
            selectedKelas === 'semua' || student.kelas === selectedKelas
        );

        if(studentsToDisplay.length === 0) {
             studentListContainer.innerHTML = '<p class="text-xs text-gray-400">Tidak ada siswa di kelas ini.</p>';
             return;
        }

        // Tambahkan checkbox "Pilih Semua"
        studentListContainer.innerHTML = `
            <label class="flex items-center p-1 font-bold border-b">
                <input type="checkbox" id="noise-select-all" class="mr-2 rounded">
                <span>Pilih Semua Siswa</span>
            </label>
        `;

        studentsToDisplay.forEach(([uid, student]) => {
            const label = document.createElement('label');
            label.className = "flex items-center p-1 hover:bg-gray-100";
            label.innerHTML = `<input type="checkbox" data-uid="${uid}" class="noise-student-checkbox mr-2 rounded"><span>${student.nama}</span>`;
            studentListContainer.appendChild(label);
        });

        document.getElementById('noise-select-all').onchange = (e) => {
             studentListContainer.querySelectorAll('.noise-student-checkbox').forEach(cb => cb.checked = e.target.checked);
        };
    };


    const startDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += (array[i]);
                }
                const average = values / length;
                updateMeter(average);
            };

            isDetecting = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            finishButton.disabled = true;
            penaltyLog.innerHTML = '<p class="text-gray-400">Mendengarkan...</p>';

        } catch (err) {
            alert('Gagal mengakses mikrofon. Pastikan kamu memberi izin ya, Beb!');
            console.error(err);
        }
    };

    const stopDetection = () => {
    // Hentikan proses render visual
    cancelAnimationFrame(animationFrameId);

    // Matikan track mikrofon
    if (microphone && microphone.mediaStream) {
        microphone.mediaStream.getTracks().forEach(track => track.stop());
    }

    // --- Mantra Baru: Cek dulu sebelum menutup! ---
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
    }

    isDetecting = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    finishButton.disabled = false;
};

    const updateMeter = (volume) => {
        const volumeLevel = Math.min(100, Math.floor(volume));
        meterBar.style.width = `${volumeLevel}%`;
        meterValue.textContent = volumeLevel;

        if (volumeLevel < 30) meterBar.className = 'bg-green-500 h-8 rounded-full transition-all duration-100';
        else if (volumeLevel < 60) meterBar.className = 'bg-yellow-500 h-8 rounded-full transition-all duration-100';
        else meterBar.className = 'bg-red-500 h-8 rounded-full transition-all duration-100';

        // Logika Hukuman
        const threshold = parseInt(slider.value);
        if (volumeLevel > threshold) {
            const selectedCheckboxes = studentListContainer.querySelectorAll('.noise-student-checkbox:checked');
            selectedCheckboxes.forEach(cb => {
                const uid = cb.dataset.uid;
                if (!penalizedStudents.has(uid)) {
                    penalizedStudents.add(uid);
                    applyPenalty(uid);
                }
            });
        }
    };

    const applyPenalty = async (uid) => {
        const studentData = allStudentsData[uid];
        if (!studentData) return;

        const penaltyAmount = Math.floor(studentData.hp * 0.10);
        const newHp = Math.max(0, studentData.hp - penaltyAmount);

        await update(ref(db, `students/${uid}`), { hp: newHp });

        const logEntry = document.createElement('p');
        logEntry.className = "text-red-600";
        logEntry.innerHTML = `<strong>${studentData.nama}</strong> berisik! HP berkurang ${penaltyAmount}.`;
        if (penaltyLog.querySelector('.text-gray-400')) penaltyLog.innerHTML = '';
        penaltyLog.appendChild(logEntry);
        penaltyLog.scrollTop = penaltyLog.scrollHeight;
        audioPlayer.hpLoss();
    };

    const finishAndGiveReward = async () => {
        stopDetection();
        const selectedUIDs = [...studentListContainer.querySelectorAll('.noise-student-checkbox:checked')].map(cb => cb.dataset.uid);

        const quietStudents = selectedUIDs.filter(uid => !penalizedStudents.has(uid));

        if (quietStudents.length === 0) {
            showToast("Tidak ada siswa yang berhak dapat hadiah.", true);
            return;
        }

        const updates = {};
        let rewardLog = '<strong>Hadiah untuk siswa teladan:</strong><br>';

        for (const uid of quietStudents) {
            const studentData = allStudentsData[uid];
            const randomCoin = Math.floor(Math.random() * 10) + 5; // 5-14 koin
            const randomXp = Math.floor(Math.random() * 10) + 5;   // 5-14 XP

            const newCoin = (studentData.coin || 0) + randomCoin;
            const newTotalXp = ((studentData.level - 1) * 1000) + studentData.xp + randomXp;
            const newLevel = Math.floor(newTotalXp / 1000) + 1;
            const newXp = newTotalXp % 1000;

            updates[`/students/${uid}/coin`] = newCoin;
            updates[`/students/${uid}/level`] = newLevel;
            updates[`/students/${uid}/xp`] = newXp;

            rewardLog += `• ${studentData.nama} +${randomCoin} koin, +${randomXp} XP<br>`;
        }

        await update(ref(db), updates);
        penaltyLog.innerHTML = rewardLog;
        showToast(`Hadiah berhasil diberikan kepada ${quietStudents.length} siswa!`);
        finishButton.disabled = true;
    };


    // Event Listeners
    openButton.onclick = openModal;
    closeButton.onclick = closeModal;
    slider.oninput = () => {
        const val = slider.value;
        thresholdValueDisplay.textContent = val;
        thresholdLine.style.left = `${val}%`;
    };
    startButton.onclick = startDetection;
    stopButton.onclick = stopDetection;
    finishButton.onclick = finishAndGiveReward;
}
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
        
        // --- DEBUGGING: Cek data siswa sebelum battle dimulai ---
        console.log("Memulai SOLO BATTLE. Data siswa:", JSON.parse(JSON.stringify(student)));
        // --- END DEBUGGING ---

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
        const classSelect = document.getElementById('class-select');
        // Reset UI state saat modal dibuka
        startButton.disabled = true;
        guildSelect.disabled = true;
        guildSelect.innerHTML = '<option value="">Memuat daftar guild...</option>';

        // --- LOGIKA BARU: Mengambil dan mengisi daftar guild dari database ---
        try {
            const studentsSnap = await get(ref(db, 'students'));
            const guilds = new Set(); // Menggunakan Set agar nama guild tidak duplikat
            const classes = new Set(); // <-- MANTRA BARU: Buat wadah untuk kelas
            let allStudentsData = []; // <-- MANTRA BARU: Simpan data siswa untuk nanti
           if (studentsSnap.exists()) {
        allStudentsData = Object.values(studentsSnap.val()); // Simpan semua data siswa
        allStudentsData.forEach(student => {
            if (student.guild && student.guild.trim() !== '') {
                guilds.add(student.guild);
            }
            if (student.kelas && student.kelas.trim() !== '') {
                classes.add(student.kelas); // <-- MANTRA BARU: Kumpulkan semua kelas unik
            }
        });
    }
classSelect.innerHTML = '<option value="SEMUA_KELAS">Semua Kelas</option>'; // Opsi "Semua Kelas"
    if (classes.size > 0) {
        // Urutkan kelas biar rapi (misal: X RPL, XI RPL, XII RPL)
        const sortedClasses = [...classes].sort();
        sortedClasses.forEach(kelas => {
            classSelect.innerHTML += `<option value="${kelas}">${kelas}</option>`;
        });
    }
            guildSelect.innerHTML = ''; // Hapus pesan "Memuat..."
            if (guilds.size > 0) {
                guilds.forEach(guild => {
                    guildSelect.innerHTML += `<option value="${guild}">Guild ${guild}</option>`;
                });
                guildSelect.disabled = false; // Aktifkan dropdown
                classSelect.disabled = false; // Aktifkan juga dropdown kelas
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
        // GANTI SELURUH KODE startButton.onclick DENGAN INI
startButton.onclick = async () => {
    const selectedGuild = document.getElementById('guild-select').value;
    const selectedClass = document.getElementById('class-select').value; // Ambil nilai kelas yg dipilih
    const selectedMonsterId = document.querySelector('input[name="monster-select"]:checked')?.value;

    if (!selectedMonsterId) {
        showToast("Pilih monster dulu, Beb!", true);
        return;
    }
    
    // Ambil semua data siswa dari database
    const studentsSnap = await get(ref(db, 'students'));
    if (!studentsSnap.exists()) {
        showToast(`Tidak ada data siswa ditemukan!`, true);
        return;
    }

    const allStudents = [];
    studentsSnap.forEach(childSnap => {
        allStudents.push({ id: childSnap.key, ...childSnap.val() });
    });

    // --- LOGIKA FILTER BARU YANG LEBIH SAKTI ---
    const party = allStudents.filter(student => {
        const guildMatch = (selectedGuild === 'SEMUA_GUILD') || (student.guild === selectedGuild);
        const classMatch = (selectedClass === 'SEMUA_KELAS') || (student.kelas === selectedClass);
        return guildMatch && classMatch;
    });

    if (party.length === 0) {
        showToast(`Tidak ada siswa yang cocok dengan filter Guild dan Kelas yang dipilih!`, true);
        return;
    }
    
    // Sisa kodenya sama persis, tidak perlu diubah
    const monsterSnap = await get(ref(db, `quests/${selectedMonsterId}`));
    if (!monsterSnap.exists()) {
         showToast("Monster tidak ditemukan!", true);
         return;
    }
    
    let monster = { id: selectedMonsterId, ...monsterSnap.val() };
    monster.monsterHp *= party.length;
    monster.monsterMaxHp = monster.monsterHp;

    // --- DEBUGGING: Cek data party sebelum battle dimulai ---
    console.log("Memulai PARTY BATTLE. Data party:", JSON.parse(JSON.stringify(party)));
    // --- END DEBUGGING ---

    closePartyModal();
    setupBattleUI(party, monster);
};
    }
    
    
    // FUNGSI INTI UNTUK MENGATUR BATTLE (SOLO & PARTY)
    async function setupBattleUI(party, monster) {
        // --- DEBUGGING: Cek data yang diterima oleh fungsi battle ---
        console.log("setupBattleUI menerima party:", JSON.parse(JSON.stringify(party)));
        // --- END DEBUGGING ---

        const sleep = ms => new Promise(res => setTimeout(res, ms));
        // Inisialisasi state pertarungan
        party.forEach(p => {
    p.currentHp = p.hp;
    let baseMaxHp = (p.level || 1) * 100;

    // Skill Pasif Prajurit: HP lebih tebal
    if (p.peran === 'Prajurit') {
        p.maxHp = Math.floor(baseMaxHp * 1.20); // Bonus 20% HP
        p.currentHp = Math.min(p.hp, p.maxHp); // Pastikan HP saat ini tidak melebihi max HP baru
    } else {
        p.maxHp = baseMaxHp;
    }

    if (!p.statusEffects) p.statusEffects = {};
});
        monster.currentHp = monster.monsterHp;
        monster.maxHp = monster.monsterMaxHp || monster.monsterHp;

        let currentTurnIndex = 0;
        let currentQuestionIndex = 0;
        const questions = monster.questions || [];

        // Elemen UI
        const battleModal = document.getElementById('battle-modal');
        const battleLog = document.getElementById('battle-log');
        const partyInfoDiv = document.getElementById('battle-student-info'); // Ganti nama variabel agar lebih jelas
        const monsterInfoDiv = document.getElementById('battle-monster-info');
        const questionText = document.getElementById('battle-question-text');
        const turnIndicator = document.getElementById('turn-indicator');
        const correctButton = document.getElementById('answer-correct-button');
        const incorrectButton = document.getElementById('answer-incorrect-button');
        const closeBattleButton = document.getElementById('close-battle-modal-button');

        const addLog = (text, type = 'normal') => {
            const colorClass = type === 'damage' ? 'text-red-400' : type === 'heal' ? 'text-green-400' : 'text-gray-300';
            battleLog.innerHTML += `<span class="${colorClass}">> ${text}</span>\n`;
            battleLog.scrollTop = battleLog.scrollHeight;
        };

        const updateUI = () => {
            // Update Info Party
            partyInfoDiv.innerHTML = '';
            party.forEach(p => {
                const hpPercent = Math.max(0, (p.currentHp / p.maxHp) * 100);
                const isTurn = party[currentTurnIndex].id === p.id;
                const turnClass = isTurn
                    ? 'bg-white-100 border-blue-500' // Gaya giliran aktif (krem lebih gelap)
                    : 'bg-white-50 border-gray-300'; // Gaya giliran tidak aktif (krem muda)
                const statusIcons = `
                    <div class="absolute top-0 right-0 flex gap-1 p-1">
                        ${p.statusEffects.racun ? '<i data-lucide="skull" class="w-4 h-4 text-red-500 bg-black bg-opacity-5 rounded-full p-0.5" title="Racun"></i>' : ''}
                        ${p.statusEffects.knock ? '<i data-lucide="dizzy" class="w-4 h-4 text-yellow-400 bg-black bg-opacity-5 rounded-full p-0.5" title="Pusing"></i>' : ''}
                        ${p.statusEffects.diam ? '<i data-lucide="mic-off" class="w-4 h-4 text-gray-400 bg-black bg-opacity-5 rounded-full p-0.5" title="Diam"></i>' : ''}
                    </div>
                `;
                partyInfoDiv.innerHTML += `
                    <div class="flex items-center gap-3 p-2 rounded-lg border ${turnClass} relative transition-all duration-300">
                        ${statusIcons}
                        <img src="${p.fotoProfilBase64 || `https://placehold.co/64x64/e2e8f0/3d4852?text=${p.nama.charAt(0)}`}" class="w-12 h-12 rounded-full object-cover">
                        <div class="flex-grow">
                            <p class="font-bold text-sm text-gray-800">${p.nama}</p>
                            <div class="w-full bg-gray-200 rounded-full h-4 relative mt-1">
                                <div class="bg-red-500 h-4 rounded-full" style="width: ${hpPercent}%"></div>
                                <span class="absolute inset-0 text-center text-xs font-bold text-white">${p.currentHp}/${p.maxHp}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            createLucideIcons();
            
            // Update Info Monster
            const monsterHpPercent = Math.max(0, (monster.currentHp / monster.maxHp) * 100);
            monsterInfoDiv.innerHTML = `
                <h4 class="text-xl font-bold">${monster.monsterName}</h4>
                <img src="${monster.monsterImageBase64 || 'https://placehold.co/128x128/a0aec0/ffffff?text=M'}" class="w-32 h-32 object-contain mx-auto my-2">
                <div class="w-full bg-gray-200 rounded-full h-6 relative"><div class="bg-green-500 h-6 rounded-full" style="width: ${monsterHpPercent}%"></div><span class="absolute inset-0 text-center font-bold text-white leading-6">${monster.currentHp} / ${monster.maxHp}</span></div>`;
            
            // Update giliran
            turnIndicator.textContent = `Giliran: ${party[currentTurnIndex].nama}`;
        };
        
        const loadQuestion = () => {
            turnIndicator.textContent = `Giliran: ${party[currentTurnIndex].nama}`;
            correctButton.disabled = false;
            incorrectButton.disabled = false;
            if (questions.length > 0) {
                questionText.textContent = questions[currentQuestionIndex % questions.length].question;
            } else {
                questionText.textContent = "Jawab dengan benar untuk menyerang!";
            }
        };

        const endBattle = async (isVictory) => {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            turnIndicator.textContent = "Pertarungan Selesai!";
            const updates = {};
            if (isVictory) {
                addLog(`🎉 ${monster.monsterName} telah dikalahkan! Kalian Menang!`, 'heal');
                questionText.textContent = "SELAMAT! KALIAN MENANG!";
                
                const xpReward = 50;
                const coinReward = Math.ceil((monster.rewardCoin || 0) / party.length);

                party.forEach(p => {
                     if (p.currentHp > 0) {
                        const currentTotalXp = ((p.level || 1) - 1) * 1000 + (p.xp || 0);
                        const newTotalXp = currentTotalXp + xpReward;
                        updates[`/students/${p.id}/xp`] = newTotalXp % 1000;
                        updates[`/students/${p.id}/level`] = Math.floor(newTotalXp / 1000) + 1;
                        updates[`/students/${p.id}/coin`] = (p.coin || 0) + coinReward;
                     }
                     updates[`/students/${p.id}/hp`] = p.currentHp;
                     updates[`/students/${p.id}/statusEffects`] = null; // Hapus semua efek status
                });
                
                addLog(`Setiap anggota yang selamat mendapat ${xpReward} XP dan ${coinReward} Koin.`, 'heal');
                audioPlayer.success();

            } else {
                addLog(`☠️ Semua anggota party telah dikalahkan!`, 'damage');
                questionText.textContent = "YAH, KALIAN KALAH...";
                party.forEach(p => {
                    updates[`/students/${p.id}/hp`] = p.currentHp;
                    updates[`/students/${p.id}/statusEffects`] = null; // Hapus semua efek status
                });
                audioPlayer.error();
            }

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                addLog("Data siswa telah diperbarui.");
            }
        };

        const nextTurn = () => {
            do {
                currentTurnIndex = (currentTurnIndex + 1) % party.length;
            } while (party[currentTurnIndex].currentHp <= 0);
            currentQuestionIndex++;
            updateUI();
            loadQuestion();
        };

        const handleAnswer = async (isCorrect) => {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            const currentPlayer = party[currentTurnIndex];

            // --- DEBUGGING: Cek status efek pemain saat giliran mereka ---
            console.log(`Giliran ${currentPlayer.nama}. Status Efek:`, JSON.parse(JSON.stringify(currentPlayer.statusEffects)));
            // --- END DEBUGGING ---

            // --- MANTRA EFEK STATUS ---
            if (currentPlayer.statusEffects.knock) {
                addLog(`😵 ${currentPlayer.nama} pusing dan kehilangan giliran!`, 'damage');
                await sleep(1200);
                nextTurn();
                return;
            }
            if (currentPlayer.statusEffects.racun) {
                const poisonDamage = 5;
                currentPlayer.currentHp = Math.max(0, currentPlayer.currentHp - poisonDamage);
                addLog(`🔥 ${currentPlayer.nama} terkena racun, ${poisonDamage} damage.`, 'damage');
                audioPlayer.hpLoss();
                updateUI();
                await sleep(1200);
                if (currentPlayer.currentHp <= 0) {
                    addLog(`☠️ ${currentPlayer.nama} tumbang karena racun!`, 'damage');
                    if (party.every(p => p.currentHp <= 0)) { endBattle(false); return; }
                    nextTurn();
                    return;
                }
            }

            if (isCorrect) {
    addLog(`Jawaban BENAR! ${currentPlayer.nama} beraksi...`);
    audioPlayer.xpGain();
    await sleep(800); // Jeda sedikit biar dramatis

    // --- Logika untuk PRAJURIT ---
    if (currentPlayer.peran === 'Prajurit') {
        let studentDamage = 25 + Math.floor(Math.random() * 10);
        // Skill Aktif: Peluang Critical Hit 25%
        if (Math.random() < 0.25) { 
            studentDamage = Math.floor(studentDamage * 1.5); // Damage 150%
            addLog(`💥 SERANGAN PERKASA! ${currentPlayer.nama} mendaratkan serangan kritis, ${studentDamage} damage!`, 'heal');
        } else {
            addLog(`⚔️ ${currentPlayer.nama} menyerang, ${studentDamage} damage.`, 'normal');
        }
        monster.currentHp = Math.max(0, monster.currentHp - studentDamage);
    }

    // --- Logika untuk PENYEMBUH ---
    else if (currentPlayer.peran === 'Penyembuh') {
        // Jika sendirian, pulihkan diri sendiri
        if (party.length === 1) {
            const healAmount = Math.floor(currentPlayer.maxHp * 0.20); // Pulihkan 20%
            currentPlayer.currentHp = Math.min(currentPlayer.maxHp, currentPlayer.currentHp + healAmount);
            addLog(`💖 PEMULIHAN AJAIB! ${currentPlayer.nama} memulihkan dirinya sendiri sebesar ${healAmount} HP.`, 'heal');
        } else { // Jika party, cari teman dengan HP terendah
            let target = party.filter(p => p.currentHp > 0)
                              .sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
            const healAmount = Math.floor(target.maxHp * 0.15); // Pulihkan 15%
            target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
            addLog(`💖 ${currentPlayer.nama} menyembuhkan ${target.nama} sebesar ${healAmount} HP.`, 'heal');
        }
    }

    // --- Logika untuk PENYIHIR ---
    else if (currentPlayer.peran === 'Penyihir') {
        let studentDamage = 25 + Math.floor(Math.random() * 10); // Damage standar
         addLog(`✨ ${currentPlayer.nama} merapal sihir, ${studentDamage} damage.`, 'normal');
        monster.currentHp = Math.max(0, monster.currentHp - studentDamage);

        // Skill Aktif: Peluang meracuni monster 30%
        if (Math.random() < 0.30) {
            // Di sini kita bisa menambahkan efek ke monster jika ada sistemnya
            addLog(`☠️ SIHIR KUTUKAN! ${monster.monsterName} terkena racun!`, 'damage');
        }
    }

    // --- Logika Default (jika peran tidak terdefinisi) ---
    else {
        let studentDamage = 25 + Math.floor(Math.random() * 10);
        addLog(`👤 ${currentPlayer.nama} menyerang, ${studentDamage} damage.`, 'normal');
        monster.currentHp = Math.max(0, monster.currentHp - studentDamage);
    }

    updateUI();
    if (monster.currentHp <= 0) { endBattle(true); return; }
           // --- GANTI BLOK 'ELSE' YANG LAMA DENGAN INI ---
} else {
    // Logika jawaban SALAH (giliran monster menyerang)
    addLog(`Jawaban SALAH! ${monster.monsterName} bersiap menyerang ${currentPlayer.nama}...`);
    await sleep(800); // Kasih jeda biar dramatis

    const availableSkills = monster.skills ? Object.keys(monster.skills).filter(s => monster.skills[s]) : [];
    const monsterActionChoice = Math.random(); // Acak angka antara 0 dan 1

    // 50% kemungkinan pakai skill (jika punya), 50% serangan fisik
    if (availableSkills.length > 0 && monsterActionChoice > 0.5) {
        // --- MONSTER PAKAI SKILL ---
        const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        const updates = {};

        switch (randomSkill) {
            case 'racun':
            case 'diam':
            case 'knock':
                const durationInDays = 2;
                const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                updates[`/students/${currentPlayer.id}/statusEffects/${randomSkill}`] = { expires: expiryTimestamp };
                await update(ref(db), updates);
                addLog(`☠️ ${monster.monsterName} menggunakan skill ${randomSkill}! ${currentPlayer.nama} terkena kutukan!`, 'damage');
                break;

            case 'mencuri':
                const stolenCoins = Math.floor(Math.random() * 11) + 5; // Curi 5-15 koin
                const newPlayerCoin = Math.max(0, (currentPlayer.coin || 0) - stolenCoins);
                updates[`/students/${currentPlayer.id}/coin`] = newPlayerCoin;
                await update(ref(db), updates);
                addLog(`💰 ${monster.monsterName} menggunakan skill Mencuri! ${stolenCoins} koin ${currentPlayer.nama} dicuri!`, 'damage');
                break;

            case 'hisap':
                const absorbedXp = Math.floor(Math.random() * 11) + 10; // Hisap 10-20 XP
                const currentTotalXp = ((currentPlayer.level - 1) * 1000) + currentPlayer.xp;
                const newTotalXp = Math.max(0, currentTotalXp - absorbedXp);

                updates[`/students/${currentPlayer.id}/level`] = Math.floor(newTotalXp / 1000) + 1;
                updates[`/students/${currentPlayer.id}/xp`] = newTotalXp % 1000;
                await update(ref(db), updates);
                addLog(`✨ ${monster.monsterName} menggunakan skill Hisap Energi! ${absorbedXp} XP ${currentPlayer.nama} terhisap!`, 'damage');
                break;

            default:
                // Jika skill tidak dikenali, lakukan serangan fisik biasa
                performPhysicalAttack();
                break;
        }

    } else {
        // --- MONSTER PAKAI SERANGAN FISIK BIASA ---
        performPhysicalAttack();
    }

    // Fungsi bantuan untuk serangan fisik (biar nggak nulis kode 2x)
    function performPhysicalAttack() {
        let monsterDamage = 15 + Math.floor(Math.random() * 10);
        if (currentPlayer.statusEffects.buff_defense) {
            const blockedDamage = Math.ceil(monsterDamage * 0.5);
            monsterDamage -= blockedDamage;
            addLog(`🛡️ Pertahanan ${currentPlayer.nama} menguat, menahan ${blockedDamage} damage!`, 'heal');
        }
        currentPlayer.currentHp = Math.max(0, currentPlayer.currentHp - monsterDamage);
        addLog(`⚔️ ${monster.monsterName} menyerang secara fisik, ${monsterDamage} damage diterima!`, 'damage');
    }

    audioPlayer.hpLoss();
    updateUI();
    if (party.every(p => p.currentHp <= 0)) { endBattle(false); return; }
}
            
            await sleep(1200);
            nextTurn();
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
            case 'hadir': {
                const currentTotalXp = ((data.level || 1) - 1) * xpPerLevel + (data.xp || 0);
                const newTotalXp = currentTotalXp + 10;
                statUpdates.xp = newTotalXp % xpPerLevel;
                statUpdates.level = Math.floor(newTotalXp / xpPerLevel) + 1;
                statUpdates.coin = (data.coin || 0) + 10;
                message = `+10 XP, +10 Koin untuk ${data.nama}!`;
                audioPlayer.xpGain();
                break;
            }
            case 'sakit': {
                statUpdates.hp = Math.max(0, (data.hp || 100) - 2);
                checkAndNotifyCriticalHp(uid, statUpdates.hp, data.nama, data.hp); // Cek HP Kritis
                message = `-2 HP untuk ${data.nama}. Cepat sembuh!`;
                audioPlayer.hpLoss();
                break;
            }
            case 'izin': {
                statUpdates.hp = Math.max(0, (data.hp || 100) - 5);
                checkAndNotifyCriticalHp(uid, statUpdates.hp, data.nama, data.hp); // Cek HP Kritis
                message = `-5 HP untuk ${data.nama}.`;
                audioPlayer.hpLoss();
                break;
            }
            case 'alfa': {
                statUpdates.hp = Math.max(0, (data.hp || 100) - 10);
                checkAndNotifyCriticalHp(uid, statUpdates.hp, data.nama, data.hp); // Cek HP Kritis
                message = `-10 HP untuk ${data.nama}. Jangan diulangi!`;
                audioPlayer.hpLoss();
                break;
            }
        }

        // Gabungkan semua update dalam satu operasi
        for (const key in statUpdates) {
            allUpdates[`/students/${uid}/${key}`] = statUpdates[key];
        }
        const today = getLocalDateString(); // PERBAIKAN: Gunakan tanggal lokal untuk menghindari bug timezone
        allUpdates[`/attendance/${today}/${uid}`] = { status: action, timestamp: Date.now() };

        try {
            await update(ref(db), allUpdates);
            showToast(message);
        } catch (error) {
            showToast('Gagal update data & absensi!', true);
            console.error(error);
        }
    }

    // --- FUNGSI PEMBANTU BARU: Cek & Kirim Notifikasi HP Kritis ---
    async function checkAndNotifyCriticalHp(uid, newHp, studentName, oldHp) {
        const hpThreshold = 10;
        // Kirim notifikasi HANYA jika HP baru melewati ambang batas,
        // dan HP sebelumnya masih di atas ambang batas. Ini mencegah spam notifikasi.
        if (newHp <= hpThreshold && oldHp > hpThreshold) {
            addNotification(
                `HP <strong>${studentName}</strong> kritis (${newHp} HP)!`, 
                'hp_critical', 
                { studentId: uid }
            );
        }
    }

    
    document.getElementById('attendance-container').addEventListener('click', (e) => {
        const target = e.target.closest('.attendance-btn');
        if (target) updateStudentStats(target.dataset.uid, target.dataset.action);
    });
    
    // --- LOGIKA QR CODE SCANNER ---
    // Event listener untuk tombol utama "Scan QR"
    document.getElementById('scan-qr-button').addEventListener('click', () => {
    openQrModal();
    startQrScanner(findStudentByNisAndMarkPresent); // Beri perintah untuk absensi
});
    // PERBAIKAN: Menggunakan ID yang benar dari HTML (`close-qr-scanner-modal-button`)
    document.getElementById('close-qr-scanner-modal-button').addEventListener('click', () => closeQrModal(false));
    
    // PERBAIKAN: Fungsi start scanner yang lebih andal
    // --- GANTI FUNGSI LAMA DENGAN VERSI BARU INI ---
const startQrScanner = (onSuccessCallback) => {
    const scanResultElement = document.getElementById('scan-result');
    if (!document.getElementById('qr-reader')) {
        console.error("Elemen #qr-reader tidak ditemukan.");
        return;
    }

    html5QrCode = new Html5Qrcode("qr-reader");

    const onScanSuccess = (decodedText, decodedResult) => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop()
                .then(() => {
                    scanResultElement.textContent = `Kode terdeteksi: ${decodedText}. Memproses...`;
                    audioPlayer.success();

                    // Jalankan perintah spesifik yang diberikan
                    if (onSuccessCallback) {
                        onSuccessCallback(decodedText);
                    }

                    setTimeout(() => closeQrModal(true), 1500);
                })
                .catch(err => console.error("Gagal menghentikan scanner.", err));
        }
    };

    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess)
        .catch(err => {
            scanResultElement.textContent = "Gagal memulai kamera. Beri izin akses kamera.";
        });
};
    
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
        // PERBAIKAN: Loop tanggal yang aman dari masalah timezone
        let currentDate = new Date(startDate + 'T00:00:00'); // Pastikan mulai dari awal hari
        const lastDate = new Date(endDate + 'T00:00:00');

        while (currentDate <= lastDate) {
            dateList.push(getLocalDateString(currentDate));
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

    createLucideIcons();
}

// Panggil lucide.createIcons() secara global sekali untuk halaman login & student
createLucideIcons();
