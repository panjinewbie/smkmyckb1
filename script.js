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

// --- MANTRA BARU: Loader HTML ---
const LOADER_HTML = `
<div class="loading-container">
    <div class="loader"></div>
    <p class="loading-text">Memuat data...</p>
</div>`;
// =======================================================
//          KITAB AGUNG SEMUA SKILL
// =======================================================
const SKILL_BOOK = {
    Prajurit: {
        passive: [
            { name: "Dasar Pertahanan", desc: "Mengurangi 3% damage fisik.", mpCost: 3 },
            { name: "Fokus Bertahan", desc: "Pengurangan damage jadi 6%.", mpCost: 5 },
            { name: "Tekad Baja", desc: "Damage -6%, tahan 10% dari skill Knock.", mpCost: 10 },
            { name: "Pancingan Halus", desc: "Sedikit meningkatkan kemungkinan diserang.", mpCost: 10 },
            { name: "Kulit Keras", desc: "Pengurangan damage fisik jadi 12%.", mpCost: 10 }
        ],
        active: [
            { name: "Tanggung Jawab Ksatria", desc: "Minta admin agar hukuman teman ditimpakan padamu.", mpCost: 15 },
            { name: "Permohonan Maaf", desc: "Minta admin batalkan -5 HP 'Izin' teman.", mpCost: 20 },
            { name: "Perisai Pelindung Diri", desc: "Aktifkan buff +20% Defense untuk diri sendiri (24 jam).", mpCost: 25 },
            { name: "Negosiasi Hukuman", desc: "Minta admin ubah 'Alfa' jadi 'Izin' untuk teman.", mpCost: 35 },
            { name: "Sumpah Setia", desc: "Aktifkan buff +10% Defense untuk seluruh Guild (24 jam).", mpCost: 40 }
        ]
    },
    Penyihir: {
        passive: [
            { name: "Insting Tajam", desc: "Meningkatkan 5% damage fisik.", mpCost: 5 },
            { name: "Mata Elang", desc: "Peluang dapat koin ekstra setelah menang.", mpCost: 5 },
            { name: "Analisis Cepat", desc: "Peluang 10% melihat HP monster.", mpCost: 5 },
            { name: "Studi Efisien", desc: "Meningkatkan perolehan XP sebesar 8%.", mpCost: 5 },
            { name: "Titik Lemah", desc: "Peluang 15% serangan jadi Critical.", mpCost: 10 }
        ],
        active: [
            { name: "Bisikan Sihir", desc: "Minta 1 petunjuk untuk tugas/ice breaking.", mpCost: 15 }, // Level 1
            { name: "Mantra Penguat Diri", desc: "Aktifkan buff +20% Attack untuk diri sendiri (24 jam).", mpCost: 25 }, // Level 2
            { name: "Lingkaran Sihir", desc: "Aktifkan buff +10% Attack untuk seluruh Guild (24 jam).", mpCost: 40 }, // Level 3
            { name: "Kutukan Racun", desc: "Minta admin untuk memberikan kutukan Racun pada 1 siswa lain.", mpCost: 45 }, // Level 4
            { name: "Kutukan Diam", desc: "Minta admin untuk memberikan kutukan Diam pada 1 siswa lain.", mpCost: 50 } // Level 5
        ]
    },
    Penyembuh: {
        passive: [
            { name: "Meditasi Ringan", desc: "Memulihkan 1 HP setiap giliran.", mpCost: 5 },
            { name: "Tangan Penolong", desc: "Efektivitas item penyembuh +15%.", mpCost: 7 },
            { name: "Kekebalan Alami", desc: "Memberikan 25% ketahanan dari kutukan Racun.", mpCost: 5 },
            { name: "Penawar Stres", desc: "Regenerasi MP harian +2.", mpCost: 5 },
            { name: "Hati yang Murni", desc: "10% penyembuhan diri juga diterima teman.", mpCost: 10 }
        ],
        active: [
            { name: "Ikatan Hati", desc: "Minta izin agar tim boleh saling bantu.", mpCost: 15 },
            { name: "Permohonan Keringanan", desc: "Minta admin batalkan -2 HP 'Sakit' teman.", mpCost: 20 },
            { name: "Aura Penyembuh Diri", desc: "Aktifkan buff Regen HP untuk diri sendiri (24 jam).", mpCost: 25 },
            { name: "Penawar Guild", desc: "Minta admin untuk menghilangkan 1 kutukan dari teman satu Guild.", mpCost: 35 },
            { name: "Mukjizat", desc: "Minta admin ubah 'Alfa' teman jadi 'Izin'.", mpCost: 60 }
        ]
    }
};
// --- MANTRA BARU: Konfigurasi AI Quiz Battle ---
const AI_QUIZ_PRIZES = [
    { xp: 10, coin: 5 }, { xp: 20, coin: 10 }, { xp: 30, coin: 15 }, { xp: 50, coin: 20 }, { xp: 75, coin: 25 }, // Level 1-5
    { xp: 100, coin: 30 }, { xp: 125, coin: 35 }, { xp: 150, coin: 40 }, { xp: 200, coin: 50 }, { xp: 250, coin: 60 }, // Level 6-10
    { xp: 300, coin: 75 }, { xp: 400, coin: 100 }, { xp: 500, coin: 125 }, { xp: 750, coin: 150 }, { xp: 1000, coin: 200 } // Level 11-15
];
const AI_QUIZ_SAFE_HAVENS = [4, 9, 14]; // Indeks dari array AI_QUIZ_PRIZES (soal ke-5, 10, 15)
const LIFELINE_COSTS = { '5050': 15, 'phone': 20, 'audience': 25 };
let currentAiQuizState = {}; // Menyimpan state quiz yang sedang berjalan

// --- MANTRA BARU: State untuk Solo Battle ---
let currentSoloBattleState = {};
let soloBattleTimerId = null;

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
function renderActiveSkill(studentData, uid) {
    const container = document.getElementById('active-skill-container');
    const { peran, level, mp } = studentData;

    if (!peran || !level || !SKILL_BOOK[peran]) {
        container.innerHTML = '<p class="text-center text-gray-400 font-sans">Peran tidak valid.</p>';
        return;
    }

    const skillIndex = Math.min(level - 1, 4); // Skill max di level 5
    const skill = SKILL_BOOK[peran].active[skillIndex];

    if (!skill) {
        container.innerHTML = '<p class="text-center text-gray-400 font-sans">Skill belum terbuka.</p>';
        return;
    }

    const hasEnoughMp = mp >= skill.mpCost;
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center gap-4">
            <div class="flex-grow">
                <h4 class="font-bold text-lg font-sans">${skill.name} <span class="text-sm font-normal text-gray-500 font-sans">(Lv. ${level})</span></h4>
                <p class="text-sm py-2 font-mono text-gray-600 mt-1">${skill.desc}</p>
            </div>
            <button id="use-active-skill-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed" ${!hasEnoughMp ? 'disabled' : ''}>
                Gunakan (MP: ${skill.mpCost})
            </button>
        </div>
    `;

    document.getElementById('use-active-skill-button').onclick = () => handleUseActiveSkill(uid, studentData, skill);
}

// --- FUNGSI BARU: Logika Inti Penggunaan Skill Aktif ---
async function handleUseActiveSkill(uid, studentData, skill) {
    const confirmationMessage = `Yakin mau menggunakan skill "${skill.name}"? Ini akan memakai ${skill.mpCost} MP.`;

    showConfirmationModal(confirmationMessage, async () => {
        const skillName = skill.name;
        const updates = {};
        const now = Date.now();
        const expiryTimestamp = now + (24 * 60 * 60 * 1000); // Durasi buff/kutukan 24 jam

        try {
            // --- Logika untuk Self-Buffs ---
            if (skillName === 'Mantra Penguat Diri' || skillName === 'Perisai Pelindung Diri' || skillName === 'Aura Penyembuh Diri') {
                let buffType = 'buff_attack'; // Default untuk Penyihir
                if (skillName.includes('Perisai')) buffType = 'buff_defense';
                if (skillName.includes('Aura')) buffType = 'buff_hp_regen';

                updates[`/students/${uid}/mp`] = studentData.mp - skill.mpCost;
                updates[`/students/${uid}/statusEffects/${buffType}`] = { expires: expiryTimestamp, name: skill.name };
                await update(ref(db), updates);
                showToast(`Efek ${skill.name} aktif selama 24 jam!`);
            }
            // --- Logika untuk Guild-Buffs ---
            else if (skillName === 'Lingkaran Sihir' || skillName === 'Sumpah Setia') {
                const guildName = studentData.guild;
                if (!guildName || guildName === 'Tanpa Guild') {
                    showToast("Kamu harus berada di dalam guild untuk menggunakan skill ini!", true);
                    return;
                }
                const buffType = skillName.includes('Sihir') ? 'buff_attack' : 'buff_defense';
                updates[`/students/${uid}/mp`] = studentData.mp - skill.mpCost;

                const studentsQuery = query(ref(db, 'students'), orderByChild('guild'), equalTo(guildName));
                const guildSnaps = await get(studentsQuery);

                if (guildSnaps.exists()) {
                    guildSnaps.forEach(memberSnap => {
                        updates[`/students/${memberSnap.key}/statusEffects/${buffType}`] = { expires: expiryTimestamp, name: skill.name };
                    });
                }
                await update(ref(db), updates);
                showToast(`Efek ${skill.name} aktif untuk seluruh guild selama 24 jam!`);
            }
            // --- Logika untuk Skill Bertarget (Kutukan & Penyembuhan) ---
            else if (skillName.startsWith('Kutukan') || skillName === 'Penawar Guild') {
                openSkillTargetModal(uid, studentData, skill);
            }
            // --- Logika Default (Skill yang butuh intervensi admin) ---
            else {
                updates[`/students/${uid}/mp`] = studentData.mp - skill.mpCost;
                await update(ref(db), updates);
                
                const adminMessage = `Siswa <strong>${studentData.nama}</strong> (${studentData.peran} Lv. ${studentData.level}) menggunakan skill: <strong>${skill.name}</strong>.`;
                addNotification(adminMessage, 'skill_usage', { studentId: uid });
                showToast(`Skill "${skill.name}" berhasil digunakan! Permintaan dikirim ke admin.`);
            }
        } catch (error) {
            showToast(`Gagal menggunakan skill: ${error.message}`, true);
            console.error("Skill usage error:", error);
        }
    });
}

// --- FUNGSI BARU: Membuka Modal Pemilihan Target untuk Skill ---
async function openSkillTargetModal(casterUid, casterData, skill) {
    const modal = document.getElementById('target-student-modal');
    const studentList = document.getElementById('target-student-list');
    const modalTitle = document.getElementById('target-modal-title');
    const closeButton = document.getElementById('close-target-modal-button');

    if (!modal || !studentList || !closeButton || !modalTitle) {
        showToast("Elemen UI untuk memilih target tidak ditemukan!", true);
        return;
    }

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    closeButton.onclick = closeModal;
    studentList.innerHTML = LOADER_HTML;
    modalTitle.textContent = `Pilih Target untuk: ${skill.name}`;

    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    const studentsSnap = await get(ref(db, 'students'));
    if (!studentsSnap.exists()) {
        studentList.innerHTML = '<p class="text-gray-400 p-4 text-center">Tidak ada siswa lain di dunia ini.</p>';
        return;
    }

    studentList.innerHTML = '';
    let targetFound = false;
    studentsSnap.forEach(childSnap => {
        const targetStudent = childSnap.val();
        const targetUid = childSnap.key;

        let canBeTargeted = false;
        if (skill.name.startsWith('Kutukan')) {
            canBeTargeted = targetUid !== casterUid; // Tidak bisa mengutuk diri sendiri
        } else if (skill.name === 'Penawar Guild') {
            // Target harus satu guild dan bukan diri sendiri
            canBeTargeted = targetStudent.guild === casterData.guild && targetUid !== casterUid;
        }

        if (canBeTargeted) {
            targetFound = true;
            const studentDiv = document.createElement('div');
            studentDiv.className = 'flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer';
            studentDiv.innerHTML = `
                <img src="${targetStudent.fotoProfilBase64 || `https://placehold.co/40x40/e2e8f0/3d4852?text=${targetStudent.nama.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover mr-3">
                <div>
                    <p class="font-semibold">${targetStudent.nama}</p>
                    <p class="text-xs text-gray-500">Level ${targetStudent.level} | ${targetStudent.guild}</p>
                </div>
            `;
            studentDiv.onclick = () => {
                if (confirm(`Yakin ingin menggunakan "${skill.name}" pada ${targetStudent.nama}?`)) {
                    handleSkillOnTarget(casterUid, targetUid, casterData, targetStudent, skill);
                    closeModal();
                }
            };
            studentList.appendChild(studentDiv);
        }
    });

    if (!targetFound) {
        studentList.innerHTML = '<p class="text-gray-400 p-4 text-center">Tidak ada target yang valid ditemukan.</p>';
    }
}

// --- FUNGSI BARU: Mengeksekusi Skill pada Target yang Dipilih ---
async function handleSkillOnTarget(casterUid, targetUid, casterData, targetData, skill) {
    try {
        const updates = {};
        const now = Date.now();
        const expiryTimestamp = now + (24 * 60 * 60 * 1000); // Durasi 24 jam

        // 1. Kurangi MP si perapal sihir
        updates[`/students/${casterUid}/mp`] = casterData.mp - skill.mpCost;

        // 2. Terapkan efek ke target
        let successMessage = '';
        let targetNotificationMessage = '';

        if (skill.name === 'Kutukan Racun') {
            updates[`/students/${targetUid}/statusEffects/racun`] = { expires: expiryTimestamp, name: skill.name };
            successMessage = `Berhasil memberikan Kutukan Racun pada ${targetData.nama}!`;
            targetNotificationMessage = `Kamu telah dikutuk dengan <strong>Racun</strong> oleh <strong>${casterData.nama}</strong>!`;
        } else if (skill.name === 'Kutukan Diam') {
            updates[`/students/${targetUid}/statusEffects/diam`] = { expires: expiryTimestamp, name: skill.name };
            successMessage = `Berhasil memberikan Kutukan Diam pada ${targetData.nama}!`;
            targetNotificationMessage = `Kamu telah dikutuk dengan <strong>Diam</strong> oleh <strong>${casterData.nama}</strong>!`;
        } else if (skill.name === 'Penawar Guild') {
            const activeEffects = targetData.statusEffects || {};
            const negativeEffects = ['racun', 'diam', 'knock'];
            let curedEffect = null;
            for (const effect of negativeEffects) {
                if (activeEffects[effect]) {
                    updates[`/students/${targetUid}/statusEffects/${effect}`] = null;
                    curedEffect = effect;
                    break; // Sembuhkan satu kutukan saja
                }
            }
            if (curedEffect) {
                successMessage = `Berhasil menghilangkan kutukan ${curedEffect} dari ${targetData.nama}!`;
                targetNotificationMessage = `Kutukan <strong>${curedEffect}</strong>-mu telah dihilangkan oleh <strong>${casterData.nama}</strong>!`;
            } else {
                showToast(`${targetData.nama} tidak memiliki kutukan untuk dihilangkan. MP tetap terpakai.`, true);
                // Tetap kurangi MP walau target tidak punya kutukan
                await update(ref(db), { [`/students/${casterUid}/mp`]: casterData.mp - skill.mpCost });
                return;
            }
        }

        await update(ref(db), updates);
        showToast(successMessage);
        audioPlayer.success();

        // 3. Kirim notifikasi ke target
        if (targetNotificationMessage) {
            addNotification(targetNotificationMessage, 'skill_effect', { casterId: casterUid }, targetUid);
        }

    } catch (error) {
        showToast(`Gagal menggunakan skill: ${error.message}`, true);
        audioPlayer.error();
    }
}

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

// --- FUNGSI BARU: Modal Konfirmasi Umum (PENGGANTI POPUP) ---
function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const messageEl = document.getElementById('confirmation-message');
    const okButton = document.getElementById('confirm-ok-button');
    const cancelButton = document.getElementById('confirm-cancel-button');

    if (!modal || !messageEl || !okButton || !cancelButton) {
        console.error("Elemen modal konfirmasi tidak ditemukan! Menggunakan popup bawaan.");
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }

    messageEl.textContent = message;

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
        okButton.onclick = null;
        cancelButton.onclick = null;
    };

    okButton.onclick = () => { onConfirm(); closeModal(); };
    cancelButton.onclick = closeModal;

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    createLucideIcons(); // Render ikon di dalam modal
}
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
                const newHp = Math.max(0, studentData.hp - totalDamage);
                updates[`/students/${uid}/hp`] = newHp;
                updates[`/students/${uid}/lastPoisonCheck`] = now;

                // Jika HP habis karena racun, beri kutukan Diam
                if (newHp <= 0) {
                    const durationInDays = 1; // Kutukan 1 hari
                    const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                    updates[`/students/${uid}/statusEffects/diam`] = { expires: expiryTimestamp };
                    addNotification(`HP <strong>${studentData.nama}</strong> habis karena racun dan kini terkena kutukan Diam!`, 'curse_death', { studentId: uid });
                    addNotification(`HP-mu habis karena racun! Kamu terkena kutukan Diam selama 1 hari dan tidak bisa masuk.`, 'curse_death', { studentId: uid }, uid);
                }
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
// --- PERBAIKAN BESAR: Logika Inti Bonus Login Harian ---
async function handleDailyLogin(uid) {
    const today = getLocalDateString(new Date());
    const studentRef = ref(db, `students/${uid}`);
    const studentSnap = await get(studentRef);

    if (!studentSnap.exists()) return;

    const studentData = studentSnap.val();
    const lastLogin = studentData.lastLoginDate || null;

    // Siapkan satu objek update untuk semua perubahan
    const updates = {};
    let toastMessage = ''; // Pesan akan dibuat jika ada bonus

    // 1. Regenerasi MP setiap hari, terlepas dari login streak
    const maxMp = 50 + ((studentData.level - 1) * 5);
    const currentMp = studentData.mp || 50;
    const newMp = Math.min(maxMp, currentMp + 10);
    if (newMp !== currentMp) {
        updates[`/students/${uid}/mp`] = newMp;
    }

    // 2. Cek jika hari ini belum login untuk memberikan bonus
    if (lastLogin !== today) {
        let streak = studentData.loginStreak || 0;
        const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

        if (lastLogin === yesterday) {
            streak++;
        } else {
            streak = 1; // Reset streak
        }

        let bonusCoin = 5;
        let bonusXp = 10;
        toastMessage = `Selamat Datang! Kamu dapat bonus +${bonusCoin} Koin, +${bonusXp} XP, dan regenerasi MP.`;

        if (streak >= 7) {
            bonusCoin += 50;
            bonusXp += 50;
            toastMessage = `🔥 WOW! Login 7 hari beruntun! Bonus besar: +${bonusCoin} Koin & +${bonusXp} XP!`;
            streak = 0; // Reset streak
            audioPlayer.success();
        }

        // Kalkulasi dan tambahkan bonus ke objek updates
        const currentCoin = studentData.coin || 0;
        const xpPerLevel = 1000;
        const currentTotalXp = ((studentData.level || 1) - 1) * xpPerLevel + (studentData.xp || 0);
        const newTotalXp = currentTotalXp + bonusXp;

        updates[`/students/${uid}/coin`] = currentCoin + bonusCoin;
        updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
        updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
        updates[`/students/${uid}/lastLoginDate`] = today;
        updates[`/students/${uid}/loginStreak`] = streak;
    }
    
    // 3. Terapkan semua update ke database jika ada
    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        if (toastMessage) { // Hanya tampilkan toast jika ada bonus login harian
            showToast(toastMessage);
        }
    }
}

// =======================================================
//                  LOGIKA DASBOR SISWA
// =======================================================

function setupStudentDashboard(uid) {
    document.getElementById('student-logout-button').onclick = () => signOut(auth);
    setupStudentNotifications(uid);
    setupIvyChat(uid); // Panggil fungsi chat Ivy di sini
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
        const maxMp = 50 + ((studentData.level - 1) * 5); // Rumus Max MP baru
        document.getElementById('student-name').textContent = studentData.nama;
        document.getElementById('student-class-role').textContent = `${studentData.kelas} | ${studentData.peran} | Guild ${studentData.guild || ''}`;

        currentStudentData = studentData; // Simpan data terbaru

        document.getElementById('student-avatar').src = studentData.fotoProfilBase64 || `https://placehold.co/128x128/e2e8f0/3d4852?text=${studentData.nama.charAt(0)}`;
        document.getElementById('hp-value').textContent = `${studentData.hp} / ${maxHp}`;
        document.getElementById('hp-bar').style.width = `${(studentData.hp / maxHp) * 100}%`;
         document.getElementById('mp-value').textContent = `${studentData.mp} / ${maxMp}`;
        document.getElementById('mp-bar').style.width = `${(studentData.mp / maxMp) * 100}%`;
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
        
         // --- MANTRA BARU: Cek apakah objek statusEffects ada dan tidak kosong ---
        const activeEffects = studentData.statusEffects ? 
            Object.fromEntries(Object.entries(studentData.statusEffects).filter(([_, val]) => val !== null)) 
            : {};

        if (Object.keys(activeEffects).length > 0) {
            const effectMap = {
                racun: { icon: 'skull', text: 'Racun', color: 'red' }, // Efek Negatif
                diam: { icon: 'thumbs-down', text: 'Diam', color: 'gray' }, // Efek Negatif
                knock: { icon: 'tornado', text: 'Knock', color: 'yellow' }, // Efek Negatif
                buff_admin_key: { icon: 'key-round', text: 'Kunci Admin', color: 'yellow' } // Buff Kunci
                ,
                // --- 👇 MANTRA PERBAIKAN: Tambahkan definisi untuk buff positif ---
                buff_attack: { icon: 'sword', text: 'Attack Up', color: 'orange' },
                buff_defense: { icon: 'shield', text: 'Defense Up', color: 'blue' },
                buff_hp_regen: { icon: 'heart-pulse', text: 'Regen HP', color: 'green' },
                buff_temp_hp: { icon: 'heart-handshake', text: 'HP Sement.', color: 'pink' }
            };

            // --- GANTI BLOK for...in... YANG LAMA DENGAN INI ---
for (const effectKey in activeEffects) {
    const effectData = activeEffects[effectKey];
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
        renderActiveSkill(studentData, uid);
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
    async function setupIvyChat(uid) {
    const chatForm = document.getElementById('Ivy-chat-form');
    const chatInput = document.getElementById('Ivy-chat-input');

    if (!chatForm || !chatInput) { return; }

    // --- MANTRA BARU: Ambil data siswa & pengaturan Ivy sekaligus! ---
    const studentSnap = await get(ref(db, `students/${uid}`));
    const configSnap = await get(ref(db, 'config/ivySettings'));
    
    if (!studentSnap.exists() || !configSnap.exists()) {
        console.error("Data siswa atau pengaturan Ivy tidak ditemukan.");
        appendChatMessage("Aduh, Beb! Aku belum siap ngobrol, pengaturanku belum lengkap. Bilang ke admin, ya!", 'Ivy');
        return;
    }
    
    const studentData = studentSnap.val();
    const ivySettings = configSnap.val();
    let isIvyThinking = false;

    chatForm.onsubmit = async (e) => {
        e.preventDefault();
            if (isIvyThinking) {
                showToast("Sabar, Bray! Ivy lagi mikir...", true);
                return;
            }

            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // --- MATA-MATA 1: Cek Pesan Pengguna ---
            console.log("Pesan Pengguna:", userMessage);

            const offensiveWords = ['tai', 'tolol', 'bajingan', 'bangsat', 'goblok', 'kontol', 'memek', 'anjing', 'babi'];
            const isOffensive = offensiveWords.some(word => userMessage.toLowerCase().includes(word));
            if (isOffensive && currentStudentData) {
                const studentName = studentData.nama;
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
        let finalPersona = `${ivySettings.personality}\n\n${ivySettings.info}`;

        // --- MANTRA BARU: Menyisipkan profil lengkap siswa ke dalam persona Ivy ---
        const studentProfileInfo = `
---
INFORMASI PENTING TENTANG SISWA YANG SEDANG KAMU AJAK BICARA (GUNAKAN UNTUK KONTEKS):
- Nama: ${studentData.nama}
- Kelas: ${studentData.kelas}
- Peran Karakter: ${studentData.peran}
- Guild: ${studentData.guild || 'Belum ada'}
- Level: ${studentData.level || 1}
- HP (Health Points): ${studentData.hp} / ${(studentData.level || 1) * 100}
- MP (Mana Points): ${studentData.mp} / ${50 + (((studentData.level || 1) - 1) * 5)}
- XP (Experience): ${studentData.xp} / 1000
- Koin: ${studentData.coin || 0}
- Status Efek Aktif: ${studentData.statusEffects && Object.keys(studentData.statusEffects).length > 0 ? Object.keys(studentData.statusEffects).join(', ') : 'Tidak ada'}
- Isi Inventori: ${studentData.inventory && studentData.inventory.filter(i => i).length > 0 ? studentData.inventory.filter(i => i).map(i => i.name).join(', ') : 'Kosong'}
- Catatan dari Admin: ${currentStudentData.catatan || 'Tidak ada catatan.'}
---
`;
        finalPersona += `\n\n${studentProfileInfo}`;
        if (ivySettings.gossipEnabled && ivySettings.gossip) {
            finalPersona += `\n\n${ivySettings.gossip}`;
        }
        finalPersona += `\n\nKamu sedang berbicara dengan siswa bernama '${studentData.nama}'. Sapa dia dengan namanya dan gunakan informasi di atas untuk menjawab pertanyaan yang relevan.`;
            try {
            const apiKey = ivySettings.apiKey;
            if (!apiKey) throw new Error("API Key belum diatur oleh Admin!");

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            
            const requestBody = {
            contents: [{ parts: [{ text: `${finalPersona}\n\nPertanyaan: ${userMessage}` }] }]
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
//          MANTRA BARU: AI QUIZ BATTLE
// =======================================================
async function openStudentSelectionForAiQuiz() {
    // Kita bisa pakai ulang modal monster selection, tapi isinya siswa
    const selectionModal = document.getElementById('monster-selection-modal');
    const listDiv = document.getElementById('monster-selection-list');
    const closeButton = document.getElementById('close-monster-selection-modal-button');
    const modalTitle = selectionModal.querySelector('h3');

    if (!selectionModal || !listDiv || !closeButton || !modalTitle) {
        showToast("Elemen UI untuk seleksi siswa tidak ditemukan!", true);
        return;
    }

    modalTitle.textContent = 'Pilih Siswa untuk AI Quiz Battle';
    listDiv.innerHTML = LOADER_HTML;
    
    audioPlayer.openModal();
    selectionModal.classList.remove('hidden');
    setTimeout(() => selectionModal.classList.remove('opacity-0'), 10);

    const studentsSnap = await get(ref(db, 'students'));
    if (!studentsSnap.exists()) {
        listDiv.innerHTML = '<p class="text-center text-gray-400">Tidak ada siswa yang tersedia.</p>';
        return;
    }

    listDiv.innerHTML = ''; // Hapus teks loading
    const studentsData = studentsSnap.val();
    Object.entries(studentsData).forEach(([uid, student]) => {
        const studentCard = document.createElement('div');
        studentCard.className = 'flex items-center p-4 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors';
        studentCard.dataset.id = uid;
        studentCard.innerHTML = `
            <img src="${student.fotoProfilBase64 || `https://placehold.co/64x64/e2e8f0/3d4852?text=${student.nama.charAt(0)}`}" class="w-16 h-16 object-cover rounded-md mr-4">
            <div>
                <h4 class="font-bold text-lg">${student.nama}</h4>
                <p class="text-sm text-gray-600">Level ${student.level} | ${student.kelas}</p>
            </div>
        `;
        listDiv.appendChild(studentCard);
    });

    const closeModal = () => {
        audioPlayer.closeModal();
        selectionModal.classList.add('opacity-0');
        setTimeout(() => selectionModal.classList.add('hidden'), 300);
        listDiv.onclick = null; // Hapus listener untuk mencegah memory leak
    };

    closeButton.onclick = closeModal;

    listDiv.onclick = (e) => {
        const selectedCard = e.target.closest('[data-id]');
        if (selectedCard && selectedCard.dataset.id) {
            const studentId = selectedCard.dataset.id;
            closeModal();
            startAiQuizBattle(studentId);
        }
    };
}

async function startAiQuizBattle(studentId) {
    const [studentSnap, configSnap] = await Promise.all([
        get(ref(db, `students/${studentId}`)),
        get(ref(db, 'config/ivySettings'))
    ]);

    if (!studentSnap.exists() || !configSnap.exists()) {
        showToast("Data siswa atau konfigurasi Ivy tidak ditemukan!", true);
        return;
    }

    const studentData = studentSnap.val();
    const ivySettings = configSnap.val();

    if (!ivySettings.apiKey || !ivySettings.aiQuizPrompt) {
        showToast("API Key atau Prompt AI Quiz belum diatur di Pengaturan Ivy!", true);
        return;
    }

    currentAiQuizState = {
        studentId: studentId,
        studentData: studentData,
        ivySettings: ivySettings,
        questionIndex: 0,
        isAnswerLocked: false,
        lifelines: { '5050': false, 'phone': false, 'audience': false },
        currentQuestionData: null
    };

    const modal = document.getElementById('ai-quiz-modal');
    const prizeLadder = document.getElementById('ai-quiz-prize-ladder');
    const closeButton = document.getElementById('close-ai-quiz-modal-button');

    // Build prize ladder
    prizeLadder.innerHTML = '';
    AI_QUIZ_PRIZES.slice().reverse().forEach((prize, index) => {
        const originalIndex = AI_QUIZ_PRIZES.length - 1 - index;
        const li = document.createElement('li');
        li.textContent = `${originalIndex + 1}. ${prize.xp} XP`;
        li.dataset.index = originalIndex;
        if (AI_QUIZ_SAFE_HAVENS.includes(originalIndex)) {
            li.classList.add('safe-haven');
        }
        prizeLadder.appendChild(li);
    });

    // Setup lifelines
    modal.querySelectorAll('.lifeline').forEach(el => {
        el.classList.remove('used');
        el.onclick = () => handleAiQuizLifeline(el.id.replace('lifeline-', ''));
    });

    closeButton.onclick = () => {
        if (confirm("Yakin ingin keluar? Semua progres akan hilang.")) {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    };

    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    createLucideIcons();

    loadAiQuizQuestion();
}

async function loadAiQuizQuestion() {
    currentAiQuizState.isAnswerLocked = false;
    const questionTextEl = document.getElementById('ai-quiz-question-text');
    const optionsContainer = document.getElementById('ai-quiz-options-container');
    
    optionsContainer.innerHTML = '';
    questionTextEl.innerHTML = '<div class="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-yellow-400 mx-auto"></div><p class="mt-4 text-white">AI sedang meracik soal...</p>';
    
    // Update prize ladder highlight
    document.querySelectorAll('#ai-quiz-prize-ladder li').forEach(li => {
        li.classList.remove('current');
        if (parseInt(li.dataset.index) === currentAiQuizState.questionIndex) {
            li.classList.add('current');
        }
    });

    const difficulty = currentAiQuizState.questionIndex < 5 ? "sangat mudah" : currentAiQuizState.questionIndex < 10 ? "mudah" : "sedang";
    const basePrompt = currentAiQuizState.ivySettings.aiQuizPrompt;
    const finalPrompt = basePrompt
        .replace(/\[TOPIK\]/gi, "konsep dasar algoritma dan pemrograman") // Default topic
        .replace(/\[KESULITAN\]/gi, difficulty);

    const payload = {
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    story: { type: "STRING" },
                    question: { type: "STRING" },
                    options: { type: "ARRAY", items: { type: "STRING" } },
                    answerIndex: { type: "INTEGER" },
                    explanation: { type: "STRING" }
                },
                required: ["story", "question", "options", "answerIndex", "explanation"]
            }
        }
    };

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentAiQuizState.ivySettings.apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        currentAiQuizState.currentQuestionData = JSON.parse(jsonText);

        const data = currentAiQuizState.currentQuestionData;
        questionTextEl.innerHTML = `<p class="text-lg mb-4">${data.story}</p><p class="text-2xl font-bold">${data.question}</p>`;
        
        data.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option';
            button.innerHTML = `<span class="font-bold text-yellow-400 mr-4">${String.fromCharCode(65 + index)}:</span> ${option}`;
            button.dataset.index = index;
            button.onclick = () => handleAiQuizAnswer(index);
            optionsContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Gagal mengambil soal dari Gemini:", error);
        questionTextEl.innerHTML = `<p class="text-red-400">Gagal memuat soal dari AI. Cek API Key atau coba lagi nanti.</p>`;
    }
}

function handleAiQuizAnswer(selectedIndex) {
    if (currentAiQuizState.isAnswerLocked) return;
    currentAiQuizState.isAnswerLocked = true;

    const options = document.querySelectorAll('#ai-quiz-options-container .option');
    const selectedButton = options[selectedIndex];
    const correctAnswerIndex = currentAiQuizState.currentQuestionData.answerIndex;

    selectedButton.classList.add('selected');
    audioPlayer.click();

    setTimeout(() => {
        options.forEach(btn => btn.classList.add('disabled'));

        if (selectedIndex === correctAnswerIndex) {
            selectedButton.classList.remove('selected');
            selectedButton.classList.add('correct');
            audioPlayer.success();
            
            setTimeout(() => {
                currentAiQuizState.questionIndex++;
                if (currentAiQuizState.questionIndex >= AI_QUIZ_PRIZES.length) {
                    endAiQuiz(true); // Player wins the grand prize
                } else {
                    loadAiQuizQuestion();
                }
            }, 2000);
        } else {
            selectedButton.classList.remove('selected');
            selectedButton.classList.add('incorrect');
            options[correctAnswerIndex].classList.add('correct');
            audioPlayer.error();
            setTimeout(() => endAiQuiz(false), 3000);
        }
    }, 1500);
}

async function endAiQuiz(isWinner) {
    const questionContainer = document.getElementById('ai-quiz-question-container');
    let prizeWon = { xp: 0, coin: 0 };
    let message = '';

    if (isWinner) {
        prizeWon = AI_QUIZ_PRIZES[AI_QUIZ_PRIZES.length - 1];
        message = `🎉 SELAMAT! Kamu berhasil menjawab semua soal dan memenangkan hadiah utama: ${prizeWon.xp} XP & ${prizeWon.coin} Koin!`;
    } else {
        let lastSafeHavenIndex = -1;
        for (const havenIndex of AI_QUIZ_SAFE_HAVENS) {
            if (currentAiQuizState.questionIndex > havenIndex) {
                lastSafeHavenIndex = havenIndex;
            }
        }
        if (lastSafeHavenIndex !== -1) {
            prizeWon = AI_QUIZ_PRIZES[lastSafeHavenIndex];
        }
        message = `Yah, jawabanmu salah. Kamu pulang dengan hadiah dari titik aman: ${prizeWon.xp} XP & ${prizeWon.coin} Koin.`;
    }

    questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-yellow-400">${message}</h2>`;

    // Update data siswa di Firebase
    if (prizeWon.xp > 0 || prizeWon.coin > 0) {
        const studentRef = ref(db, `students/${currentAiQuizState.studentId}`);
        const studentData = (await get(studentRef)).val();
        
        const xpPerLevel = 1000;
        const currentTotalXp = ((studentData.level || 1) - 1) * xpPerLevel + (studentData.xp || 0);
        const newTotalXp = currentTotalXp + prizeWon.xp;
        
        const updates = {
            level: Math.floor(newTotalXp / xpPerLevel) + 1,
            xp: newTotalXp % xpPerLevel,
            coin: (studentData.coin || 0) + prizeWon.coin
        };
        await update(studentRef, updates);
    }

    setTimeout(() => {
        const modal = document.getElementById('ai-quiz-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }, 5000);
}

async function handleAiQuizLifeline(type) {
    if (currentAiQuizState.isAnswerLocked || currentAiQuizState.lifelines[type]) return;

    const cost = LIFELINE_COSTS[type];
    const studentRef = ref(db, `students/${currentAiQuizState.studentId}`);
    const studentSnap = await get(studentRef);
    const studentData = studentSnap.val();

    if ((studentData.mp || 0) < cost) {
        showToast(`MP tidak cukup! Butuh ${cost} MP.`, true);
        return;
    }

    if (!confirm(`Gunakan lifeline ini dengan biaya ${cost} MP?`)) return;

    // Deduct MP
    await update(studentRef, { mp: studentData.mp - cost });
    showToast(`-${cost} MP. Lifeline ${type} digunakan!`);
    
    currentAiQuizState.lifelines[type] = true;
    document.getElementById(`lifeline-${type}`).classList.add('used');

    const options = document.querySelectorAll('#ai-quiz-options-container .option');
    const correctAnswerIndex = currentAiQuizState.currentQuestionData.answerIndex;

    switch (type) {
        case '5050':
            let removedCount = 0;
            const indicesToRemove = [];
            while (removedCount < 2) {
                const randomIndex = Math.floor(Math.random() * options.length);
                if (randomIndex !== correctAnswerIndex && !indicesToRemove.includes(randomIndex)) {
                    indicesToRemove.push(randomIndex);
                    removedCount++;
                }
            }
            indicesToRemove.forEach(i => {
                options[i].classList.add('disabled', 'opacity-25');
                options[i].onclick = null;
            });
            break;
        case 'phone':
            // Simple hint: just highlight the correct answer for a moment
            options[correctAnswerIndex].classList.add('selected');
            setTimeout(() => options[correctAnswerIndex].classList.remove('selected'), 1000);
            break;
        case 'audience':
            // Simulate audience poll
            const pollResults = [0, 0, 0, 0];
            pollResults[correctAnswerIndex] = Math.floor(Math.random() * 40) + 50; // 50-89% for correct
            let remainingPercent = 100 - pollResults[correctAnswerIndex];
            for (let i = 0; i < 4; i++) {
                if (i !== correctAnswerIndex) {
                    const vote = Math.floor(Math.random() * remainingPercent);
                    pollResults[i] = vote;
                    remainingPercent -= vote;
                }
            }
            pollResults[pollResults.findIndex(p => p === 0)] += remainingPercent; // Give remainder to one
            alert(`Hasil polling penonton:\nA: ${pollResults[0]}%\nB: ${pollResults[1]}%\nC: ${pollResults[2]}%\nD: ${pollResults[3]}%`);
            break;
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
                    <h4 class="text-md font-bold font-sans">${item.name}</h4>
                    <p class="text-sm py-2 font-mono text-gray-600 flex-grow mb-2">${item.description}</p>
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
        case 'GACHA_MYSTERY': effectText = 'Memberikan hadiah acak! Apa ya isinya?'; break;
        // --- Teks Efek Baru ---
        case 'CURSE_RACUN': effectText = 'Memberikan efek Racun pada target.'; break;
        case 'CURSE_DIAM': effectText = 'Memberikan efek Diam pada target.'; break;
        case 'CURSE_KNOCK': effectText = 'Memberikan efek Knock pada target.'; break;
        case 'CURE_EFFECT': effectText = 'Menghilangkan 1 efek negatif dari dirimu.'; break;
        case 'BATTLE_TICKET': effectText = 'Gunakan untuk langsung bertarung dengan monster acak! (Solo, Pertanyaan AI)'; break;
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
            } else if (itemData.effect === 'HEAL_MP') {
    const studentLevel = studentData.level || 1;
    const maxMp = 50 + ((studentLevel - 1) * 5);
    const currentMp = Number(studentData.mp) || 0;
    const healAmount = Number(itemData.effectValue) || 0;
    updates[`/students/${uid}/mp`] = Math.min(maxMp, currentMp + healAmount);
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
        // --- 👇 MANTRA BARU UNTUK ITEM GACHA "MISTERY!" 👇 ---
        else if (itemData.effect === 'GACHA_MYSTERY') {
            const rand = Math.random() * 100;
            let gachaMessage = 'Kotak misteri dibuka...';
            
            if (rand < 50) { // 50% Kembang Api
                showFireworks();
                gachaMessage = 'Wow! Kembang api kejutan! ✨';
            } else if (rand < 65) { // 15% Hadiah Stat
                const rewards = ['coin', 'xp', 'hp'];
                const rewardType = rewards[Math.floor(Math.random() * rewards.length)];
                const rewardValue = 10;

                if (rewardType === 'coin') {
                    updates[`/students/${uid}/coin`] = (studentData.coin || 0) + rewardValue;
                } else if (rewardType === 'xp') {
                    const xpPerLevel = 1000;
                    const currentTotalXp = ((studentData.level || 1) - 1) * xpPerLevel + (studentData.xp || 0);
                    const newTotalXp = currentTotalXp + rewardValue;
                    updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
                    updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
                } else { // hp
                    const maxHp = (studentData.level || 1) * 100;
                    updates[`/students/${uid}/hp`] = Math.min(maxHp, (studentData.hp || 0) + rewardValue);
                }
                gachaMessage = `Hoki! Kamu dapat +${rewardValue} ${rewardType.toUpperCase()}!`;
            } else if (rand < 67) { // 2% Hadiah Buff
                const buffs = ['buff_hp_regen', 'CURE_EFFECT'];
                const buffType = buffs[Math.floor(Math.random() * buffs.length)];

                if (buffType === 'buff_hp_regen') {
                    const expiryTimestamp = Date.now() + (1 * 24 * 60 * 60 * 1000); // 1 hari
                    updates[`/students/${uid}/statusEffects/buff_hp_regen`] = { expires: expiryTimestamp, name: 'Aura Regenerasi (Gacha)' };
                    gachaMessage = 'Langka! Kamu dapat Aura Regenerasi HP selama 1 hari!';
                } else { // CURE_EFFECT
                    const activeEffects = studentData.statusEffects || {};
                    const effectToCure = Object.keys(activeEffects).find(k => ['racun', 'diam', 'knock'].includes(k));
                    if (effectToCure) {
                        updates[`/students/${uid}/statusEffects/${effectToCure}`] = null;
                        gachaMessage = `Langka! Efek negatif "${effectToCure}" berhasil disembuhkan!`;
                    } else {
                        gachaMessage = 'Kamu dapat penawar, tapi kamu tidak punya efek negatif. Sayang sekali...';
                    }
                }
            } else if (rand < 68) { // 1% Hadiah Item Kutukan
                const curseItem = { name: 'Gulungan Kutukan Knock', description: 'Merutuki target dengan efek Knock, membuat HP mereka menjadi 10.', effect: 'CURSE_KNOCK', effectValue: 0, iconUrl: 'https://cdn-icons-png.flaticon.com/512/2541/2541990.png' };
                const emptySlotIndex = (studentData.inventory || []).findIndex(slot => !slot);
                if (emptySlotIndex !== -1) {
                    updates[`/students/${uid}/inventory/${emptySlotIndex}`] = curseItem;
                    gachaMessage = 'SUPER LANGKA! Kamu mendapatkan Gulungan Kutukan Knock!';
                } else {
                    gachaMessage = 'Kamu dapat item langka, tapi inventarismu penuh! Zonk deh...';
                }
            } else { // 32% Zonk
                gachaMessage = 'Kotaknya kosong... Coba lagi lain kali!';
            }
            successMessage = gachaMessage;
        } else if (itemData.effect === 'BATTLE_TICKET') {
            // Efek ini tidak memberikan hadiah langsung, tetapi memulai pertarungan.
            // Kita hanya perlu mengonsumsi item dan memicu logika pertarungan.
            successMessage = `Tiket digunakan! Bersiap untuk pertarungan...`;
            updates[`/students/${uid}/inventory/${itemIndex}`] = null; // Konsumsi item
            await update(ref(db), updates);
            showToast(successMessage);
            closeModalCallback(); // Tutup modal penggunaan item
            
            // Mulai pertarungan setelah jeda singkat agar toast terlihat
            setTimeout(() => {
                startSoloAiBattle(uid);
            }, 500);
            return; // Kembali lebih awal untuk mencegah pembaruan ganda
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

// --- TAMBAHKAN FUNGSI BARU INI tombol admin untuk ivy---
function setupIvySettings() {
    const openBtn = document.getElementById('open-ivy-settings-button');
    const modal = document.getElementById('ivy-settings-modal');
    if (!openBtn || !modal) return; // Penjaga keamanan

    const closeBtn = document.getElementById('close-ivy-settings-modal');
    const cancelBtn = document.getElementById('cancel-ivy-settings');
    const saveBtn = document.getElementById('save-ivy-settings');
    const apiKeyInput = document.getElementById('ivy-api-key');
    const toggleVisibilityBtn = document.getElementById('toggle-api-key-visibility');
    const personalityInput = document.getElementById('ivy-personality');
    const infoInput = document.getElementById('ivy-info');
    const gossipToggle = document.getElementById('ivy-gossip-toggle');
    const gossipInput = document.getElementById('ivy-gossip');
    const aiQuizPromptInput = document.getElementById('ivy-ai-quiz-prompt'); // <-- ADD THIS

    const configRef = ref(db, 'config/ivySettings');

    const openModal = async () => {
        saveBtn.textContent = 'Memuat...';
        saveBtn.disabled = true;
        
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
            const settings = snapshot.val();
            apiKeyInput.value = settings.apiKey || '';
            personalityInput.value = settings.personality || '';
            infoInput.value = settings.info || '';
            gossipInput.value = settings.gossip || '';
            gossipToggle.checked = settings.gossipEnabled || false;
            aiQuizPromptInput.value = settings.aiQuizPrompt || ''; // <-- ADD THIS
        }
        
        updateGossipInputState();
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
        saveBtn.textContent = 'Simpan Pengaturan';
        saveBtn.disabled = false;
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    const updateGossipInputState = () => {
        if (gossipToggle.checked) {
            gossipInput.disabled = false;
            gossipInput.classList.remove('opacity-50', 'bg-gray-100');
        } else {
            gossipInput.disabled = true;
            gossipInput.classList.add('opacity-50', 'bg-gray-100');
        }
    };

    const saveSettings = async () => {
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.disabled = true;
        try {
            const newSettings = {
                apiKey: apiKeyInput.value.trim(),
                personality: personalityInput.value.trim(),
                info: infoInput.value.trim(),
                gossip: gossipInput.value.trim(),
                gossipEnabled: gossipToggle.checked,
                aiQuizPrompt: aiQuizPromptInput.value.trim() // <-- ADD THIS
            };
            await set(configRef, newSettings);
            showToast("Pengaturan Ivy berhasil disimpan!");
            closeModal();
        } catch (error) {
            showToast("Gagal menyimpan pengaturan.", true);
            console.error("Error saving Ivy settings:", error);
        } finally {
            saveBtn.textContent = 'Simpan Pengaturan';
            saveBtn.disabled = false;
        }
    };
    
    openBtn.onclick = openModal;
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    saveBtn.onclick = saveSettings;
    gossipToggle.onchange = updateGossipInputState;
    
    toggleVisibilityBtn.onclick = () => {
        const icon = toggleVisibilityBtn.querySelector('i');
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            apiKeyInput.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        createLucideIcons();
    };
}

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
    const confirmationMessage = `Ambil item "${itemData.name}" dari Peti Guild?`;
    showConfirmationModal(confirmationMessage, async () => {
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
    });
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
        // --- MANTRA BARU: Validasi Upah Minimum ---
            if (rewardCoin < 10) {
                throw new Error("Hadiah minimal untuk misi adalah 10 Koin!");
            }
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

     // --- PERUBAHAN BESAR: Memuat bounty dengan data siswa untuk cek buff ---
    const bountiesRef = ref(db, 'bounties');
    const studentRef = ref(db, `students/${uid}`);
    
    onValue(bountiesRef, async (snapshot) => { // Jadikan callback ini async
        const studentSnap = await get(studentRef); // Ambil data siswa TERBARU setiap kali bounty berubah
        const studentData = studentSnap.exists() ? studentSnap.val() : null;
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
            // --- MANTRA BARU: Cek apakah siswa punya kunci admin ---
            const now = Date.now();
            const hasAdminKey = studentData?.statusEffects?.buff_admin_key && studentData.statusEffects.buff_admin_key.expires > now;
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
            if (bounty.isAdminBounty) {
                if (hasAdminKey) {
                    if (isTakenByCurrentUser) buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-blue-400 cursor-not-allowed">Sudah Diambil</button>`;
                    else if (isFull) buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-red-400 cursor-not-allowed">Penuh</button>`;
                    else buttonHtml = `<button data-id="${bountyId}" class="take-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-green-500 hover:bg-green-600">Ambil Misi</button>`;
                } else {
                    buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-gray-400 cursor-not-allowed flex items-center justify-center"><i data-lucide="lock" class="w-4 h-4 mr-2"></i>Butuh Kunci Admin</button>`;
                }
            } else {
                if (isCreator) buttonHtml = `<button data-id="${bountyId}" class="manage-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-purple-600 hover:bg-purple-700">Kelola Misi</button>`;
                else if (isTakenByCurrentUser) buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-blue-400 cursor-not-allowed">Sudah Diambil</button>`;
                else if (isFull) buttonHtml = `<button disabled class="w-full p-2 rounded-lg text-white font-bold text-sm bg-red-400 cursor-not-allowed">Penuh</button>`;
                else buttonHtml = `<button data-id="${bountyId}" class="take-bounty-btn w-full p-2 rounded-lg text-white font-bold text-sm bg-green-500 hover:bg-green-600">Ambil Misi</button>`;
            }

            const card = document.createElement('div');
           // --- MANTRA BARU: Beri border khusus untuk misi admin ---
            const cardClasses = bounty.isAdminBounty ? 'border-2 border-indigo-400' : '';
            card.className = `bg-white p-4 rounded-lg shadow-lg flex flex-col ${cardClasses}`;
            card.innerHTML = `
                <img src="${bounty.imageUrl || 'https://placehold.co/300x200/e2e8f0/3d4852?text=Misi'}" class="w-full h-32 object-cover rounded-md mb-4">
                <h4 class="text-lg font-bold font-sans">${bounty.title}</h4>
                <p class="text-xs text-gray-500 mb-2 font-sans">Oleh: ${bounty.creatorName}</p>
                <p class="text-sm py-2 font-mono text-gray-600 flex-grow mb-2">${bounty.description}</p>
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

// --- FUNGSI BARU: Menambahkan log ke modal solo battle ---
function addSoloBattleLog(text, type = 'normal') {
    const logContainer = document.getElementById('solo-battle-log-container');
    if (!logContainer) return;
    const colorClass = type === 'damage' ? 'text-red-400' : type === 'heal' ? 'text-green-400' : 'text-gray-300';
    const logEntry = document.createElement('p');
    logEntry.className = colorClass;
    logEntry.textContent = `> ${text}`;
    
    const placeholder = logContainer.querySelector('.text-gray-400');
    if (placeholder) placeholder.remove();
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// =======================================================
//          MANTRA BARU: SOLO AI BATTLE
// =======================================================

async function startSoloAiBattle(uid) {
    // 1. Ambil semua data yang diperlukan
    const [studentSnap, questsSnap, configSnap] = await Promise.all([
        get(ref(db, `students/${uid}`)),
        get(ref(db, 'quests')),
        get(ref(db, 'config/ivySettings'))
    ]);

    if (!studentSnap.exists() || !questsSnap.exists() || !configSnap.exists()) {
        showToast("Gagal memulai: Data siswa, monster, atau AI tidak lengkap!", true);
        return;
    }
    if (!configSnap.val().apiKey) {
        showToast("Kunci API untuk AI belum diatur oleh admin!", true);
        return;
    }

    // 2. Pilih monster acak
    const allQuests = questsSnap.val();
    // --- PERBAIKAN: Cek apakah ada monster yang tersedia ---
    if (!allQuests || Object.keys(allQuests).length === 0) {
        showToast("Tidak ada monster di dunia ini untuk dilawan! Minta admin untuk membuatnya.", true);
        audioPlayer.error();
        return;
    }

    const questIds = Object.keys(allQuests);
    const randomQuestId = questIds[Math.floor(Math.random() * questIds.length)];
    const monsterData = allQuests[randomQuestId];

    // 3. Inisialisasi state pertarungan
    const studentData = studentSnap.val();
    currentSoloBattleState = {
        uid: uid,
        student: {
            ...studentData,
            currentHp: studentData.hp,
            maxHp: (studentData.level || 1) * 100
        },
        monster: {
            ...monsterData,
            currentHp: monsterData.monsterHp,
            maxHp: monsterData.monsterMaxHp || monsterData.monsterHp
        },
        ivySettings: configSnap.val(),
        isAnswerLocked: false,
    };

    // 4. Atur dan buka modal
    const modal = document.getElementById('solo-ai-battle-modal');
    if (!modal) return;

    // Reset log
    const logContainer = document.getElementById('solo-battle-log-container');
    if (logContainer) logContainer.innerHTML = '<p class="text-gray-400">> Pertarungan dimulai...</p>';

    document.getElementById('forfeit-solo-battle-button').onclick = () => {
        if (confirm("Yakin mau kabur? Kamu akan kehilangan sedikit HP.")) {
            endSoloAiBattle(false, true); // isVictory=false, isForfeit=true
        }
    };
    
    audioPlayer.openModal();
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    // 5. Mulai giliran pertama
    nextSoloAiTurn();
}

function updateSoloBattleUI() {
    const { student, monster } = currentSoloBattleState;

    // Info Pemain
    const playerInfo = document.getElementById('solo-battle-player-info');
    const playerHpPercent = Math.max(0, (student.currentHp / student.maxHp) * 100);
    playerInfo.innerHTML = `
        <div class="flex items-center gap-3">
            <img src="${student.fotoProfilBase64 || `https://placehold.co/64x64/e2e8f0/3d4852?text=${student.nama.charAt(0)}`}" class="w-16 h-16 rounded-full object-cover border-2 border-green-400">
            <div class="flex-grow">
                <p class="font-bold text-lg">${student.nama}</p>
                <div class="w-full bg-gray-600 rounded-full h-4 mt-1">
                    <div class="bg-green-500 h-4 rounded-full" style="width: ${playerHpPercent}%"></div>
                </div>
                <p class="text-sm font-mono">${student.currentHp} / ${student.maxHp} HP</p>
            </div>
        </div>
    `;

    // Info Monster
    const monsterInfo = document.getElementById('solo-battle-monster-info');
    const monsterHpPercent = Math.max(0, (monster.currentHp / monster.maxHp) * 100);
    monsterInfo.innerHTML = `
        <div class="flex items-center gap-3 justify-end">
            <div class="flex-grow text-right">
                <p class="font-bold text-lg">${monster.monsterName}</p>
                <div class="w-full bg-gray-600 rounded-full h-4 mt-1">
                    <div class="bg-red-500 h-4 rounded-full" style="width: ${monsterHpPercent}%"></div>
                </div>
                <p class="text-sm font-mono">${monster.currentHp} / ${monster.maxHp} HP</p>
            </div>
            <img src="${monster.monsterImageBase64 || 'https://placehold.co/64x64/a0aec0/ffffff?text=M'}" class="w-16 h-16 rounded-full object-cover border-2 border-red-400">
        </div>
    `;
}

async function nextSoloAiTurn() {
    if (currentSoloBattleState.isAnswerLocked) return;
    
    updateSoloBattleUI();
    
    const questionTextEl = document.getElementById('solo-battle-question-text');
    const optionsContainer = document.getElementById('solo-battle-options-container');
    const timerEl = document.getElementById('solo-battle-timer');

    // Reset UI
    optionsContainer.innerHTML = '';
    questionTextEl.innerHTML = '<div class="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-yellow-400 mx-auto"></div>';
    currentSoloBattleState.isAnswerLocked = true; // Kunci saat memuat

    // Pengaturan Timer
    let timeLeft = 30; 
    timerEl.textContent = timeLeft;
    timerEl.classList.remove('text-red-500');
    
    if (soloBattleTimerId) clearInterval(soloBattleTimerId);

    soloBattleTimerId = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 3) timerEl.classList.add('text-red-500');
        if (timeLeft <= 0) {
            clearInterval(soloBattleTimerId);
            handleSoloAiAnswer(-1); // -1 menandakan waktu habis
        }
    }, 1000);

    // Buat dan tampilkan pertanyaan
    try {
        const settings = currentSoloBattleState.ivySettings;
        const basePrompt = settings.aiQuizPrompt || "Buatkan satu soal kuis pilihan ganda (4 opsi) tentang [TOPIK]. Tingkat kesulitan: [KESULITAN].";
        const finalPrompt = basePrompt.replace(/\[TOPIK\]/gi, "pengetahuan umum acak").replace(/\[KESULITAN\]/gi, "mudah");
        const payload = {
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: { type: "OBJECT", properties: { question: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, answerIndex: { type: "INTEGER" } }, required: ["question", "options", "answerIndex"] }
            }
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.apiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const questionData = JSON.parse(result.candidates[0].content.parts[0].text);
        
        currentSoloBattleState.currentQuestionData = questionData;
        questionTextEl.textContent = questionData.question;
        
        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'p-4 rounded-lg text-left transition-colors bg-indigo-500 hover:bg-fuchsia-500';
            button.innerHTML = `<span class="font-bold text-amber-400 mr-2">${String.fromCharCode(65 + index)}:</span> ${option}`;
            button.onclick = () => handleSoloAiAnswer(index);
            optionsContainer.appendChild(button);
        });
        
        currentSoloBattleState.isAnswerLocked = false; // Buka kunci setelah memuat
    } catch (error) {
        console.error("Gagal memuat soal AI solo battle:", error);
        questionTextEl.textContent = "Gagal memuat soal. Silakan coba lagi nanti.";
        clearInterval(soloBattleTimerId);
        setTimeout(() => endSoloAiBattle(false), 2000); // Akhiri pertarungan jika ada error
    }
}

async function handleSoloAiAnswer(selectedIndex) {
    if (currentSoloBattleState.isAnswerLocked) return;
    currentSoloBattleState.isAnswerLocked = true;
    clearInterval(soloBattleTimerId);

    const { student, monster, currentQuestionData } = currentSoloBattleState;
    const options = document.querySelectorAll('#solo-battle-options-container button');
    const isCorrect = selectedIndex === currentQuestionData.answerIndex;

    // Umpan balik visual
    options.forEach(btn => btn.disabled = true);
    if (selectedIndex !== -1) { // Jika bukan timeout
        options[selectedIndex].classList.add(isCorrect ? 'bg-green-600' : 'bg-red-600');
    }
    if (!isCorrect) {
        options[currentQuestionData.answerIndex]?.classList.add('bg-green-600');
    }

    await new Promise(res => setTimeout(res, 1500)); // Jeda untuk umpan balik

    // Terapkan logika permainan
    if (isCorrect) {
        audioPlayer.success();
        const damage = 20 + Math.floor(Math.random() * 10);
        monster.currentHp = Math.max(0, monster.currentHp - damage);
        addSoloBattleLog(`Serangan berhasil! ${damage} damage!`, 'heal');
    } else {
        audioPlayer.error();
        const damage = 10 + Math.floor(Math.random() * 5);
        student.currentHp = Math.max(0, student.currentHp - damage);
        addSoloBattleLog(selectedIndex === -1 ? `Waktu habis! Kamu menerima ${damage} damage!` : `Jawaban salah! Kamu menerima ${damage} damage!`, 'damage');
    }

    // Cek akhir pertarungan
    if (monster.currentHp <= 0) {
        endSoloAiBattle(true);
    } else if (student.currentHp <= 0) {
        endSoloAiBattle(false);
    } else {
        currentSoloBattleState.isAnswerLocked = false;
        nextSoloAiTurn();
    }
}

async function endSoloAiBattle(isVictory, isForfeit = false) {
    clearInterval(soloBattleTimerId);
    currentSoloBattleState.isAnswerLocked = true;

    const { uid, student, monster } = currentSoloBattleState;
    const questionContainer = document.getElementById('solo-battle-question-container');
    document.getElementById('solo-battle-options-container').innerHTML = '';

    const updates = {};
    let finalHp = student.currentHp;

    if (isForfeit) {
        const penalty = Math.floor(student.maxHp * 0.05); // Penalti 5% HP karena kabur
        finalHp = Math.max(1, student.currentHp - penalty);
        questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-yellow-400">Kamu Kabur!</h2><p>Kamu kehilangan ${penalty} HP.</p>`;
        addSoloBattleLog(`Kamu kabur dan kehilangan ${penalty} HP.`, 'damage');
        audioPlayer.error();
    } else if (isVictory) {
        questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-green-400">KAMU MENANG!</h2><p>Hadiah: +${monster.rewardCoin} Koin, +${monster.rewardXp} XP</p>`;
        addSoloBattleLog(`KAMU MENANG! Hadiah diterima.`, 'heal');
        audioPlayer.success();
        
        const xpPerLevel = 1000;
        const currentTotalXp = ((student.level || 1) - 1) * xpPerLevel + (student.xp || 0);
        const newTotalXp = currentTotalXp + (monster.rewardXp || 0);
        
        updates[`/students/${uid}/level`] = Math.floor(newTotalXp / xpPerLevel) + 1;
        updates[`/students/${uid}/xp`] = newTotalXp % xpPerLevel;
        updates[`/students/${uid}/coin`] = (student.coin || 0) + (monster.rewardCoin || 0);
    } else {
        questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-red-500">KAMU KALAH...</h2><p>Coba lagi lain kali!</p>`;
        addSoloBattleLog(`Kamu telah dikalahkan...`, 'damage');
        audioPlayer.error();
    }

    updates[`/students/${uid}/hp`] = finalHp;
    
    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
    }

    setTimeout(() => {
        const modal = document.getElementById('solo-ai-battle-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }, 4000);
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
//          MANTRA BARU: EFEK KEMBANG API
// =======================================================
function showFireworks() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; pointer-events:none;';
    document.body.appendChild(overlay);

    for (let i = 0; i < 30; i++) { // 30 particles
        const particle = document.createElement('div');
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.cssText = `position:absolute; left:${x}%; top:${y}%; width:5px; height:5px; background-color:${color}; border-radius:50%;`;
        
        particle.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: `scale(${Math.random() * 2 + 1})`, opacity: 0 }
        ], {
            duration: Math.random() * 1000 + 500,
            easing: 'ease-out',
            delay: Math.random() * 200
        });
        
        overlay.appendChild(particle);
    }

    setTimeout(() => {
        overlay.remove();
    }, 3000);
}
// =======================================================
//                  LOGIKA DASBOR ADMIN
// =======================================================
function setupAdminDashboard() {
    
    // --- MANTRA BARU: Inisialisasi Notifikasi ---
    setupNotificationPanel();
    listenForNotifications();
    setupNoiseDetector(); 
    setupIvySettings(); 

    console.log("TIMER MANTRA: 'Detak Jantung' akan dimulai dalam 1 jam");
setTimeout(() => {
    gameTick(); // Panggil langsung sekali saat pertama kali buka
    setInterval(gameTick, 3600000); // Lalu ulangi setiap 10 detik
}, 5000); // kalau mau setiap hari, ganti jadi 86400000

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
    const adminQuestionBattleButton = document.getElementById('admin-question-battle-button');
    const aiQuizBattleButton = document.getElementById('ai-quiz-battle-button'); // <-- ADD THIS
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
    const openQrModal = (onSuccessCallback) => {
        audioPlayer.openModal();
        // Reset pesan hasil scan setiap kali modal dibuka
        const scanResultElement = document.getElementById('scan-result');
        if(scanResultElement) scanResultElement.textContent = 'Arahkan kamera ke Kode QR Siswa';

        qrScannerModal.classList.remove('hidden');
        setTimeout(() => {
            qrScannerModal.classList.remove('opacity-0');
            startQrScanner(onSuccessCallback); // Mulai scanner dengan callback yang diberikan setelah modal terlihat
        }, 50);
    };

    // Parameter `fromScanSuccess` untuk menandakan modal ditutup oleh scanner, bukan manual
    const closeQrModal = (fromScanSuccess = false) => {
        audioPlayer.closeModal();
        qrScannerModal.classList.add('opacity-0');

        const finalCleanup = () => {
            setTimeout(() => {
                qrScannerModal.classList.add('hidden');
                const qrReaderElement = document.getElementById('qr-reader');
                if (qrReaderElement) {
                    qrReaderElement.innerHTML = ""; // Hapus sisa elemen video
                }
                html5QrCode = null; // Reset instance
            }, 300); // Tunggu animasi fade-out selesai
        };

        // Jika scanner sedang berjalan dan modal ditutup manual, hentikan dulu
        if (!fromScanSuccess && html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop()
                .catch(err => console.error("Gagal menghentikan scanner, tapi tetap melanjutkan cleanup.", err))
                .finally(() => {
                    finalCleanup();
                });
        } else {
            // Jika scanner sudah berhenti (dari onScanSuccess) atau tidak pernah jalan
            finalCleanup();
        }
    };

    // --- EVENT LISTENER MODAL & NAVIGASI ---
    document.getElementById('admin-logout-button').onclick = () => signOut(auth);
    addStudentButton.onclick = () => openModal(false);
    closeModalButton.onclick = closeModal;
    cancelButton.onclick = closeModal;
    addQuestButton.onclick = () => openQuestModal();
    partyBattleButton.onclick = () => openPartyBattleModal({ battleType: 'ai' });
    adminQuestionBattleButton.onclick = () => openPartyBattleModal({ battleType: 'adminQuestion' });
    aiQuizBattleButton.onclick = () => openStudentSelectionForAiQuiz(); // <-- ADD THIS
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

        document.getElementById('journal-page').classList.toggle('hidden', pageId !== 'journal'); // New line
        if (pageId === 'quests') setupQuestsPage();
        if (pageId === 'attendance') setupAttendancePage();
        if (pageId === 'shop') setupShopPage();
        if (pageId === 'magic') setupMagicControlsPage();
        if (pageId === 'journal') setupJournalPage(); // New line
    });
// --- TAMBAHKAN BLOK KODE INI DI DALAM setupMagicControlsPage() ---
    // --- FUNGSI DATA SISWA (ADMIN) ---
    // --- GANTI KODE onValue(studentsRef, ...) YANG LAMA DENGAN KODE BARU INI ---
    const studentsRef = ref(db, 'students');
    onValue(studentsRef, (snapshot) => {
        const studentTableBody = document.getElementById('student-table-body');
        const filterKelas = document.getElementById('dashboard-filter-kelas');
        const filterGuild = document.getElementById('dashboard-filter-guild');
        const paginationControls = document.getElementById('pagination-controls');
        let allStudents = [];

        // --- MANTRA PAGINATION BARU ---
        let currentPage = 1;
        const itemsPerPage = 10; // 10 siswa per halaman

        if (snapshot.exists()) {
            // Urutkan siswa berdasarkan nama secara default
            allStudents = Object.entries(snapshot.val()).sort((a, b) => a[1].nama.localeCompare(b[1].nama));
        }

        // --- MANTRA BARU: Mengisi pilihan filter ---
        const uniqueKelas = [...new Set(allStudents.map(([_, student]) => student.kelas))];
        const uniqueGuilds = [...new Set(allStudents.map(([_, student]) => student.guild || 'No Guild'))];

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

        // --- MANTRA BARU: Fungsi untuk render kontrol pagination ---
        const renderPaginationControls = (totalItems) => {
            paginationControls.innerHTML = '';
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalPages <= 1) return;

            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, totalItems);

            let buttonsHtml = '';
            // Tombol Sebelumnya
            buttonsHtml += `<button class="pagination-btn px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>`;

            // Tombol Berikutnya
            buttonsHtml += `<button class="pagination-btn px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Berikutnya</button>`;

            paginationControls.innerHTML = `
                <p class="text-sm text-gray-700">
                    Menampilkan <span class="font-medium">${startItem}</span> - <span class="font-medium">${endItem}</span> dari <span class="font-medium">${totalItems}</span> hasil
                </p>
                <div class="flex gap-2">
                    ${buttonsHtml}
                </div>
            `;

            paginationControls.querySelectorAll('.pagination-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    currentPage = parseInt(e.target.dataset.page);
                    renderTable();
                });
            });
        };

        // --- MANTRA BARU: Fungsi untuk render tabel (dengan pagination) ---
        const renderTable = () => {
        const selectedKelas = filterKelas.value;
        const selectedGuild = filterGuild.value;

        const filteredStudents = allStudents.filter(([_, student]) => {
            const kelasMatch = selectedKelas === 'semua' || student.kelas === selectedKelas;
            const guildMatch = selectedGuild === 'semua' || (student.guild || 'No Guild') === selectedGuild;
            return kelasMatch && guildMatch;
        });

            // --- Logika Pagination ---
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

        studentTableBody.innerHTML = '';
        let totalStudents = 0, totalLevel = 0, totalCoins = 0;

            if (paginatedStudents.length === 0) {
            studentTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-400">Tidak ada siswa yang cocok.</td></tr>';
        } else {
                paginatedStudents.forEach(([key, student]) => {
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
                    const effectMap = { 
                        racun: { icon: 'skull', color: 'text-red-500', title: 'Racun' }, 
                        diam: { icon: 'thumbs-down', color: 'text-gray-500', title: 'Diam' }, 
                        knock: { icon: 'tornado', color: 'text-yellow-500', title: 'Pusing' },
                        buff_attack: { icon: 'arrow-big-up-dash', color: 'text-orange-500', title: 'Attack Up' },
                        buff_defense: { icon: 'shield', color: 'text-blue-500', title: 'Defense Up' },
                        buff_hp_regen: { icon: 'heart-pulse', color: 'text-green-500', title: 'Regen HP' }
                    , buff_admin_key: { icon: 'key-round', text: 'Kunci Admin', color: 'text-yellow-500' } // Buff Kunci
                     };
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
            });
        }

            // Update summary stats berdasarkan SEMUA siswa yang terfilter, bukan hanya yang di halaman ini
            filteredStudents.forEach(([_, student]) => {
                totalStudents++;
                totalLevel += (student.level || 1);
                totalCoins += (student.coin || 0);
            });

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('average-level').textContent = totalStudents > 0 ? (totalLevel / totalStudents).toFixed(1) : '0';
        document.getElementById('total-coins').textContent = totalCoins;
        createLucideIcons();
            renderPaginationControls(filteredStudents.length); // Render kontrol berdasarkan jumlah total item yang terfilter
    };

        // Pasang pendengar di filter dan panggil renderTable pertama kali
        filterKelas.onchange = () => { currentPage = 1; renderTable(); }; // Reset ke halaman 1 saat filter berubah
        filterGuild.onchange = () => { currentPage = 1; renderTable(); }; // Reset ke halaman 1 saat filter berubah
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
    mp: parseInt(document.getElementById('mp').value), // Tambahkan ini
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
                document.getElementById('mp').value = student.mp || 50;
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
//          MANTRA BARU: DETAK JANTUNG DUNIA DREAMY
// =======================================================
async function gameTick() {
    console.log("GAME TICK: Memeriksa kondisi seluruh siswa...");
    const studentsRef = ref(db, 'students');
    const snapshot = await get(studentsRef);

    if (!snapshot.exists()) {
        console.log("GAME TICK: Tidak ada siswa untuk diperiksa.");
        return;
    }

    const allStudents = snapshot.val();
    const updates = {};
    const today = getLocalDateString(new Date()); // Kita butuh tanggal hari ini

    for (const uid in allStudents) {
        const student = allStudents[uid];
        const lastCheck = student.lastHpPenaltyCheck || '';

        // Cek jika HP di bawah 10 DAN hari ini belum dapat penalti
        if (student.hp < 10 && lastCheck !== today) {
            const currentXp = student.xp || 0;
            const penaltyXp = 5; // Jumlah XP yang dikurangi
            
            // Kurangi XP, tapi jangan sampai minus ya, kasian
            const newXp = Math.max(0, currentXp - penaltyXp);

            updates[`/students/${uid}/xp`] = newXp;
            updates[`/students/${uid}/lastHpPenaltyCheck`] = today; // Tandai sudah kena penalti hari ini

            console.log(`PENALTI: HP ${student.nama} kritis. XP dikurangi ${penaltyXp}.`);
            
            // Kirim notifikasi ke siswa biar dia sadar!
            addNotification(
                `😥 Gawat! HP-mu kritis (kurang dari 10). XP-mu berkurang ${penaltyXp} hari ini. Segera pulihkan HP!`,
                'hp_penalty',
                { studentId: uid },
                uid // Kirim notifikasi ini ke siswa yang bersangkutan
            );
        }
    }

    // Kalau ada data yang perlu di-update, kirim ke Firebase!
    if (Object.keys(updates).length > 0) {
        try {
            await update(ref(db), updates);
            console.log("GAME TICK: Penalti XP berhasil diterapkan pada siswa yang HP-nya kritis.");
        } catch (error) {
            console.error("GAME TICK: Gagal menerapkan penalti XP.", error);
        }
    } else {
        console.log("GAME TICK: Tidak ada siswa yang perlu diberi penalti XP hari ini.");
    }
}
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
            document.getElementById('monster-reward-xp').value = questData.rewardXp || 50;
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
            rewardXp: parseInt(document.getElementById('monster-reward-xp').value),
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
            questListContainer.innerHTML = ''; // Hapus loader
            if (!snapshot.exists()) {
                questListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Belum ada monster quest.</p>';
                return;
            }
            const questsData = snapshot.val();
            Object.entries(questsData).forEach(([questId, quest]) => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-lg flex flex-col transform transition duration-300 hover:scale-110 hover:shadow-xl';
                card.innerHTML = `
                    <img src="${quest.monsterImageBase64 || 'https://placehold.co/300x200/a0aec0/ffffff?text=Monster'}" class="w-full h-32 object-cover rounded-md mb-4">
                    <h4 class="text-lg font-bold">${quest.monsterName}</h4>
                    <p class="text-sm text-red-500 font-semibold">HP: ${quest.monsterHp}</p>
                    <div class="text-sm mt-2 space-y-1 flex-grow">
                        <p class="text-yellow-600 font-medium flex items-center"><i data-lucide="coins" class="w-4 h-4 mr-1.5"></i> ${quest.rewardCoin} Koin</p>
                        <p class="text-blue-600 font-medium flex items-center"><i data-lucide="star" class="w-4 h-4 mr-1.5"></i> ${quest.rewardXp || 0} XP</p>
                    </div>
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
            adminBountyListContainer.innerHTML = ''; // Hapus loader
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
    studentListEl.innerHTML = LOADER_HTML;
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

        container.innerHTML = LOADER_HTML;

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

    // --- MANTRA BARU: Event listener untuk Scan QR di halaman Magic ---
    // Diletakkan di sini agar listener di-refresh setiap kali halaman dibuka,
    // dan memiliki akses ke fungsi-fungsi di dalam scope setupAdminDashboard.
    const scanQrMagicButton = document.getElementById('scan-qr-magic-button');
    if (scanQrMagicButton) {
        // Fungsi khusus untuk memilih siswa dari hasil scan
        const selectStudentByNis = async (nis) => {
            const snapshot = await get(query(ref(db, 'students'), orderByChild('nis'), equalTo(nis)));
            if (snapshot.exists()) {
                const [uid, student] = Object.entries(snapshot.val())[0];
                const checkbox = document.querySelector(`#magic-student-list-container input[data-uid="${uid}"]`);
                if (checkbox) {
                    checkbox.checked = true; // Ceklis kotak siswa yang ditemukan
                    showToast(`${student.nama} berhasil dipilih sebagai target!`);
                } else {
                    showToast(`${student.nama} tidak ada di daftar filter saat ini.`, true);
                }
            } else {
                showToast(`Siswa dengan NIS ${nis} tidak ditemukan!`, true);
            }
        };

        // Menggunakan .onclick untuk memastikan hanya ada satu listener aktif,
        // mencegah penumpukan listener jika tab diklik berulang kali.
        scanQrMagicButton.onclick = () => {
            openQrModal(selectStudentByNis); // Buka modal dan langsung jalankan scanner dengan callback
        };
    }
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
                            newValue = Math.max(0, Math.min(maxHp, newValue));
                            if (newValue <= 0) {
                                const durationInDays = 1;
                                const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                                updates[`/students/${uid}/statusEffects/diam`] = { expires: expiryTimestamp };
                            }
                        } else if (stat === 'mp') { // Tambahkan kondisi ini
                            const maxMp = 50 + ((studentData.level - 1) * 5);
                            newValue = Math.max(0, Math.min(maxMp, newValue));
                        } else {
                            newValue = Math.max(0, newValue);
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
                        
                        // --- MANTRA BARU: Durasi buff kunci lebih lama ---
                        let durationInDays = 3; // Durasi default
                        if (effect === 'buff_admin_key') {
                            durationInDays = 30; // Kunci Admin berlaku 30 hari
                        }
                        const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);

                        if (action.operation === 'add') {
                            updates[`/students/${uid}/statusEffects/${effect}`] = { expires: expiryTimestamp };
                            // Logika khusus untuk efek tertentu
                            if (effect === 'racun') {
                                updates[`/students/${uid}/lastPoisonCheck`] = Date.now();
                            } else if (effect === 'knock') {
                                updates[`/students/${uid}/hp`] = 10;
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
            shopItemList.innerHTML = ''; // Hapus loader
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

        monsterListDiv.innerHTML = LOADER_HTML;
        
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
                    <p class="text-sm text-gray-600">HP: ${quest.monsterHp} | Reward: ${quest.rewardCoin} Koin, ${quest.rewardXp || 0} XP</p>
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
    async function openPartyBattleModal(options = {}) {
        const partyBattleModal = document.getElementById('party-battle-modal');
        const closeButton = document.getElementById('close-party-battle-modal-button');
        const startButton = document.getElementById('start-party-battle-button');
        const monsterListDiv = document.getElementById('party-monster-selection-list');
        const guildSelect = document.getElementById('guild-select');
        const classSelect = document.getElementById('class-select');
        // Reset UI state saat modal dibuka
        const studentListDiv = document.getElementById('party-manual-student-selection-list');
        const searchInput = document.getElementById('party-student-search');

        // --- LOGIKA BARU: Mengisi daftar siswa untuk seleksi manual ---
        studentListDiv.innerHTML = LOADER_HTML;
        const allStudentsSnap = await get(ref(db, 'students'));
        let allStudentsForSelection = [];
        if (allStudentsSnap.exists()) {
            allStudentsForSelection = Object.entries(allStudentsSnap.val());
        }

        const renderManualStudentList = (filter = '') => {
            studentListDiv.innerHTML = '';
            const filteredStudents = allStudentsForSelection.filter(([_, student]) => 
                student.nama.toLowerCase().includes(filter.toLowerCase())
            );

            if (filteredStudents.length === 0) {
                studentListDiv.innerHTML = '<p class="text-center text-gray-400 text-sm">Siswa tidak ditemukan.</p>';
                return;
            }

            filteredStudents.forEach(([uid, student]) => {
                const label = document.createElement('label');
                label.className = "flex items-center p-1.5 hover:bg-gray-200 rounded-md cursor-pointer";
                label.innerHTML = `<input type="checkbox" data-uid="${uid}" class="party-student-checkbox mr-3 rounded"><span>${student.nama} (${student.kelas})</span>`;
                studentListDiv.appendChild(label);
            });
        };

        searchInput.onkeyup = () => renderManualStudentList(searchInput.value);
        renderManualStudentList(); // Panggil pertama kali tanpa filter
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

        monsterListDiv.innerHTML = LOADER_HTML;
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
        const selectedMonsterId = document.querySelector('input[name="monster-select"]:checked')?.value;
        if (!selectedMonsterId) {
            showToast("Pilih monster dulu, Beb!", true);
            return;
        }

        const manuallySelectedCheckboxes = document.querySelectorAll('#party-manual-student-selection-list .party-student-checkbox:checked');
        let party = [];

        const allStudentsSnap = await get(ref(db, 'students'));
        if (!allStudentsSnap.exists()) {
            showToast(`Tidak ada data siswa ditemukan!`, true);
            return;
        }
        const allStudentsData = allStudentsSnap.val();

        if (manuallySelectedCheckboxes.length > 0) {
            // --- LOGIKA BARU: Gunakan siswa yang dipilih manual ---
            const selectedUids = Array.from(manuallySelectedCheckboxes).map(cb => cb.dataset.uid);
            party = selectedUids.map(uid => ({ id: uid, ...allStudentsData[uid] }));
            showToast(`Memulai battle dengan ${party.length} siswa pilihan.`);

        } else {
            // --- LOGIKA LAMA: Fallback ke filter Kelas/Guild ---
            const selectedGuild = document.getElementById('guild-select').value;
            const selectedClass = document.getElementById('class-select').value;

            const allStudents = [];
            allStudentsSnap.forEach(childSnap => {
                allStudents.push({ id: childSnap.key, ...childSnap.val() });
            });

            party = allStudents.filter(student => {
                const guildMatch = (selectedGuild === 'SEMUA_GUILD') || (student.guild === selectedGuild);
                const classMatch = (selectedClass === 'SEMUA_KELAS') || (student.kelas === selectedClass);
                return guildMatch && classMatch;
            });
            showToast(`Memulai battle dengan ${party.length} siswa dari filter.`);
        }

    if (party.length === 0) {
        showToast(`Tidak ada siswa yang cocok dengan kriteria yang dipilih!`, true);
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
    setupBattleUI(party, monster, options);
    };
    }
    
    
    // FUNGSI INTI UNTUK MENGATUR BATTLE (SOLO & PARTY)
    async function setupBattleUI(party, monster, options = {}) {
        const battleType = options.battleType || 'ai'; // Default ke AI battle
        let ivySettings = null; // Deklarasikan di sini agar bisa diakses nanti

        // --- NEW: Fetch Ivy settings for AI questions ---
        if (battleType === 'ai') {
            const configSnap = await get(ref(db, 'config/ivySettings'));
            if (!configSnap.exists() || !configSnap.val().apiKey || !configSnap.val().aiQuizPrompt) {
                showToast("Konfigurasi AI (API Key/Prompt) tidak ditemukan! Batal memulai battle.", true);
                return;
            }
            ivySettings = configSnap.val();
        }
        let currentQuestionData = null; // To store AI question details
        let isAnswerLocked = false;

        // --- NEW: Helper to generate AI question ---
        async function generateAiBattleQuestion(settings) {
            const difficulty = "sedang"; // Or make it dynamic based on party level
            const basePrompt = settings.aiQuizPrompt || "Buatkan satu soal kuis pilihan ganda (4 opsi) tentang [TOPIK]. Tingkat kesulitan: [KESULITAN].";
            const finalPrompt = basePrompt
                .replace(/\[TOPIK\]/gi, "pengetahuan umum, sains, atau logika") // Change topic for party battle
                .replace(/\[KESULITAN\]/gi, difficulty);

            const payload = {
                contents: [{ parts: [{ text: finalPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: { type: "OBJECT", properties: { question: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, answerIndex: { type: "INTEGER" }, explanation: { type: "STRING" } }, required: ["question", "options", "answerIndex"] }
                }
            };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            return JSON.parse(result.candidates[0].content.parts[0].text);
        }
        // --- DEBUGGING: Cek data yang diterima oleh fungsi battle ---
        console.log("setupBattleUI menerima party:", JSON.parse(JSON.stringify(party)));
        // --- END DEBUGGING ---

        // --- NEW: UI Toggling based on battleType ---
        const aiBattleQuestionContainer = document.getElementById('ai-battle-question-container');
        const adminBattleQuestionContainer = document.getElementById('admin-battle-question-container');
        const adminQuestionInput = document.getElementById('admin-question-input');
        const adminCorrectButton = document.getElementById('admin-answer-correct-button');
        const adminIncorrectButton = document.getElementById('admin-answer-incorrect-button');

        if (battleType === 'adminQuestion') {
            aiBattleQuestionContainer.classList.add('hidden');
            adminBattleQuestionContainer.classList.remove('hidden');
        } else {
            aiBattleQuestionContainer.classList.remove('hidden');
            adminBattleQuestionContainer.classList.add('hidden');
        }

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
        const partyInfoDiv = document.getElementById('battle-student-info');
        const monsterInfoDiv = document.getElementById('battle-monster-info');
        const turnIndicator = document.getElementById('turn-indicator');
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
                        ${p.statusEffects.knock ? '<i data-lucide="tornado" class="w-4 h-4 text-yellow-400 bg-black bg-opacity-5 rounded-full p-0.5" title="Pusing"></i>' : ''}
                        ${p.statusEffects.diam ? '<i data-lucide="thumbs-down" class="w-4 h-4 text-gray-400 bg-black bg-opacity-5 rounded-full p-0.5" title="Diam"></i>' : ''}
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
        
        const loadQuestion = async () => {
            isAnswerLocked = false;
            turnIndicator.textContent = `Giliran: ${party[currentTurnIndex].nama}`;

            if (battleType === 'adminQuestion') {
                adminCorrectButton.onclick = () => handleAnswer(true);
            adminIncorrectButton.onclick = () => handleAnswer(false);
                adminQuestionInput.value = '';
                adminQuestionInput.focus();
                adminCorrectButton.disabled = false;
                adminIncorrectButton.disabled = false;
            } else { // AI Battle
                const questionTextEl = document.getElementById('battle-question-text');
                const optionsContainer = document.getElementById('battle-options-container');
                
                optionsContainer.innerHTML = '';
                questionTextEl.parentElement.classList.add('animate-pulse');
                questionTextEl.innerHTML = '<p class="text-sm text-gray-500">AI sedang meracik soal...</p>';

                try {
                    currentQuestionData = await generateAiBattleQuestion(ivySettings);
                    const data = currentQuestionData;
                    questionTextEl.textContent = data.question;
                    
                    data.options.forEach((option, index) => {
                        const button = document.createElement('button');
                        button.className = 'option';
                        button.innerHTML = `<span class="font-bold mr-2">${String.fromCharCode(65 + index)}:</span> ${option}`;
                        button.dataset.index = index;
                        button.onclick = () => handleAnswer(index);
                        optionsContainer.appendChild(button);
                    });
                } catch (error) {
                    console.error("Gagal memuat pertanyaan AI untuk battle:", error);
                    questionTextEl.textContent = "Gagal memuat pertanyaan AI. Jawab benar untuk menyerang.";
                    // Fallback: Tampilkan tombol Benar/Salah jika AI gagal
                    optionsContainer.innerHTML = `<button id="fallback-correct" class="option correct">Benar</button><button id="fallback-incorrect" class="option incorrect">Salah</button>`;
                    document.getElementById('fallback-correct').onclick = () => handleAnswer(0, true); // Anggap jawaban 0 benar
                    document.getElementById('fallback-incorrect').onclick = () => handleAnswer(1, true); // Anggap jawaban 1 salah
                }
                questionTextEl.parentElement.classList.remove('animate-pulse');
            }
        };

        const endBattle = async (isVictory) => {
            if (battleType === 'ai') document.getElementById('battle-options-container').innerHTML = '';
            else adminBattleQuestionContainer.classList.add('hidden');
            turnIndicator.textContent = "Pertarungan Selesai!";
            const updates = {};
            if (isVictory) {
                document.getElementById('battle-question-text').textContent = "SELAMAT! KALIAN MENANG!";
                
                const xpRewardPerPerson = monster.rewardXp || 50;
                const coinRewardPerPerson = Math.ceil((monster.rewardCoin || 0) / party.length);

                party.forEach(p => {
                     if (p.currentHp > 0) {
                        const currentTotalXp = ((p.level || 1) - 1) * 1000 + (p.xp || 0);
                        const newTotalXp = currentTotalXp + xpRewardPerPerson;
                        updates[`/students/${p.id}/xp`] = newTotalXp % 1000;
                        updates[`/students/${p.id}/level`] = Math.floor(newTotalXp / 1000) + 1;
                        updates[`/students/${p.id}/coin`] = (p.coin || 0) + coinRewardPerPerson;
                     }
                    
                    // Simpan HP final dan kelola status efek
                    updates[`/students/${p.id}/hp`] = p.currentHp;
                    const finalStatusEffects = p.statusEffects || {};
                    // Hapus efek sementara dari monster
                    delete finalStatusEffects.knock;
                    delete finalStatusEffects.racun;
                    // Jika siswa tumbang, beri kutukan Diam
                    if (p.currentHp <= 0) {
                        const durationInDays = 1;
                        const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                        finalStatusEffects.diam = { expires: expiryTimestamp };
                        addLog(`☠️ ${p.nama} terkena kutukan Diam karena HP habis!`);
                    }
                    updates[`/students/${p.id}/statusEffects`] = finalStatusEffects;
                });
                
                addLog(`Setiap anggota yang selamat mendapat ${xpRewardPerPerson} XP dan ${coinRewardPerPerson} Koin.`, 'heal');
                audioPlayer.success();

            } else {
                addLog(`☠️ Semua anggota party telah dikalahkan!`, 'damage');
                document.getElementById('battle-question-text').textContent = "YAH, KALIAN KALAH...";
                party.forEach(p => {
                    updates[`/students/${p.id}/hp`] = p.currentHp; // Hanya update HP
                    // Jika kalah, semua terkena kutukan Diam
                    const durationInDays = 1;
                    const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                    updates[`/students/${p.id}/statusEffects/diam`] = { expires: expiryTimestamp };
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

        const handleAnswer = async (answer, isFallback = false) => {
            if (isAnswerLocked) return;
            isAnswerLocked = true;

            let isCorrect;

            if (battleType === 'adminQuestion') {
                isCorrect = answer; // answer is already true or false
                adminCorrectButton.disabled = true;
                adminIncorrectButton.disabled = true;
                await sleep(500); // Short delay
            } else { // AI Battle
                const selectedIndex = answer;
                const options = document.querySelectorAll('#battle-options-container .option');
                const selectedButton = options[selectedIndex];
                const correctAnswerIndex = isFallback ? 0 : currentQuestionData.answerIndex;
                isCorrect = selectedIndex === correctAnswerIndex;

                if (selectedButton) selectedButton.classList.add('selected');
                await sleep(1000);

                options.forEach(btn => btn.classList.add('disabled'));
                if (isCorrect) {
                    if(selectedButton) selectedButton.classList.add('correct');
                    audioPlayer.success();
                } else {
                    if(selectedButton) selectedButton.classList.add('incorrect');
                    if(options[correctAnswerIndex]) options[correctAnswerIndex].classList.add('correct');
                    audioPlayer.error();
                }
                await sleep(1500);
            }

            const currentPlayer = party[currentTurnIndex];
    // Ambil data skill pasif dari Kitab
    const skillIndex = Math.min(currentPlayer.level - 1, 4);
    const passiveSkill = SKILL_BOOK[currentPlayer.peran].passive[skillIndex];

    // Cek & kurangi MP untuk skill pasif
    let passiveIsActive = false;
    if (currentPlayer.mp >= passiveSkill.mpCost) {
        currentPlayer.mp -= passiveSkill.mpCost;
        passiveIsActive = true;
        addLog(`✨ Skill Pasif [${passiveSkill.name}] aktif! (-${passiveSkill.mpCost} MP)`, 'heal');
    } else {
        addLog(`⚠️ MP tidak cukup! Skill Pasif tidak aktif.`, 'damage');
    }
    

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
        addLog(`Jawaban BENAR! ${currentPlayer.nama} bersiap menyerang...`);
        await sleep(800);// Jeda sedikit biar dramatis

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

        // 50% kemungkinan serangan skill, 50% fisik
        if (Math.random() > 0.5) {
            // Serangan Skill (contoh sederhana)
            let skillDamage = 30 + Math.floor(Math.random() * 15);
            if(passiveIsActive && currentPlayer.peran === 'Penyihir' && Math.random() < 0.15) { // Cek critical
                 skillDamage = Math.floor(skillDamage * 1.5);
                 addLog(`✨ CRITICAL HIT!`, 'heal');
            }
            monster.currentHp = Math.max(0, monster.currentHp - skillDamage);
            addLog(`🔮 ${currentPlayer.nama} menggunakan serangan skill, ${skillDamage} damage!`, 'heal');
        } else {
            // Serangan Fisik Biasa
            let physicalDamage = 25 + Math.floor(Math.random() * 10);
            if(passiveIsActive && currentPlayer.peran === 'Penyihir') {
                 physicalDamage = Math.floor(physicalDamage * 1.05); // Bonus 5% dari skill
            }
            monster.currentHp = Math.max(0, monster.currentHp - physicalDamage);
            addLog(`⚔️ ${currentPlayer.nama} menyerang secara fisik, ${physicalDamage} damage!`, 'heal');
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
            case 'racun': // Grouping racun and diam as they have similar application logic
            case 'diam': {
                const durationInDays = 2;
                const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                updates[`/students/${currentPlayer.id}/statusEffects/${randomSkill}`] = { expires: expiryTimestamp };
                await update(ref(db), updates);
                addLog(`☠️ ${monster.monsterName} menggunakan skill ${randomSkill}! ${currentPlayer.nama} terkena kutukan!`, 'damage');
                break;
            }
            case 'knock': {
                const durationInDays = 2;
                const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                currentPlayer.currentHp = 10; // Langsung ubah HP di state battle
                updates[`/students/${currentPlayer.id}/statusEffects/knock`] = { expires: expiryTimestamp };
                updates[`/students/${currentPlayer.id}/hp`] = 10; // Simpan HP baru ke database
                await update(ref(db), updates);
                addLog(`😵 ${monster.monsterName} menggunakan skill Knock! HP ${currentPlayer.nama} menjadi 10!`, 'damage');
                break;
            }

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
        if(passiveIsActive && currentPlayer.peran === 'Prajurit'){
            const reduction = Math.floor(monsterDamage * (passiveSkill.name.includes("12%") ? 0.12 : 0.06));
            monsterDamage -= reduction;
            addLog(`🛡️ Skill Pasif [${passiveSkill.name}] mengurangi ${reduction} damage!`, 'heal');
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
        loadQuestion(); // First question load
        updateUI();

        const closeAndResetBattle = () => {
            audioPlayer.closeModal();
            battleModal.classList.add('opacity-0');
            setTimeout(() => battleModal.classList.add('hidden'), 300);
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
    const attendanceDateInput = document.getElementById('attendance-date');
    const loadAttendanceButton = document.getElementById('load-attendance-button');

    // Set tanggal hari ini sebagai default
    if (attendanceDateInput) {
        attendanceDateInput.value = getLocalDateString(new Date());
    }

    const renderAttendanceList = async () => {
        const selectedDate = attendanceDateInput.value;
        if (!selectedDate) {
            showToast('Silakan pilih tanggal terlebih dahulu!', true);
            return;
        }

        attendanceContainer.innerHTML = LOADER_HTML;

        const [studentsSnap, attendanceSnap] = await Promise.all([
            get(ref(db, 'students')),
            get(ref(db, `attendance/${selectedDate}`))
        ]);

        if (!studentsSnap.exists()) {
            attendanceContainer.innerHTML = '<div class="bg-white rounded-lg shadow-md p-10 text-center text-gray-500"><p>Belum ada siswa terdaftar.</p></div>';
            return;
        }

        const studentsData = studentsSnap.val();
        const dailyAttendance = attendanceSnap.exists() ? attendanceSnap.val() : {};
        
        const studentsByClass = {};
        Object.entries(studentsData).forEach(([uid, student]) => {
            if (!studentsByClass[student.kelas]) studentsByClass[student.kelas] = [];
            studentsByClass[student.kelas].push({ uid, ...student });
        });
        
        attendanceContainer.innerHTML = '';
        for (const kelas in studentsByClass) {
            const classSection = document.createElement('div');
            classSection.className = 'bg-white rounded-lg shadow-md';
            classSection.innerHTML = `<h3 class="text-lg font-bold border-b-2 border-blue-200 p-4">${kelas}</h3>`;
            const studentGrid = document.createElement('div');
            studentGrid.className = 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
            
            studentsByClass[kelas].forEach(student => {
                const studentStatus = dailyAttendance[student.uid]?.status;
                const avatar = student.fotoProfilBase64 ? 
                    `<img src="${student.fotoProfilBase64}" alt="${student.nama}" class="w-16 h-16 rounded-full object-cover">` : 
                    `<div class="w-16 h-16 bg-gray-700 text-white flex items-center justify-center rounded-full font-bold text-2xl">${student.nama.charAt(0)}</div>`;
                
                const buttonHtml = ['hadir', 'sakit', 'izin', 'alfa'].map(action => {
                    const colors = {
                        hadir: 'bg-blue-500 hover:bg-blue-600',
                        sakit: 'bg-yellow-500 hover:bg-yellow-600',
                        izin: 'bg-orange-500 hover:bg-orange-600',
                        alfa: 'bg-red-500 hover:bg-red-600'
                    };
                    const activeClass = studentStatus === action ? 'ring-4 ring-offset-2 ring-green-400' : '';
                    return `<button data-uid="${student.uid}" data-action="${action}" class="attendance-btn ${colors[action]} text-white text-xs font-bold py-2 px-2 rounded ${activeClass}">${action.charAt(0).toUpperCase() + action.slice(1)}</button>`;
                }).join('');

                studentGrid.innerHTML += `
                    <div class="bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col gap-4">
                        <div class="flex items-center gap-4">
                            ${avatar}
                            <div>
                                <p class="font-bold text-gray-800">${student.nama}</p>
                                <p class="text-sm text-gray-500">NIS: ${student.nis}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            ${buttonHtml}
                        </div>
                    </div>`;
            });
            classSection.appendChild(studentGrid);
            attendanceContainer.appendChild(classSection);
        }
    };

    if (loadAttendanceButton) {
        loadAttendanceButton.onclick = renderAttendanceList;
        // Secara otomatis memuat absensi untuk hari ini saat halaman pertama kali dibuka
        renderAttendanceList();
    }
}
    // --- FUNGSI UPDATE STATS & LOG ABSENSI (DENGAN SUARA) ---
    async function updateStudentStats(uid, action, studentData = null, attendanceDate) {
        const studentRef = ref(db, `students/${uid}`);
        const data = studentData || (await get(studentRef)).val();
        if (!data) return;

        const allUpdates = {};
        let message = '';
        const xpPerLevel = 1000;

        // Validasi tanggal
        if (!attendanceDate) {
            showToast('Tanggal absensi tidak valid!', true);
            return;
        }
        
        let statUpdates = {};
        let hpPenalty = 0;
        let penaltyMessage = '';

        switch(action) {
            case 'hadir': {
                const currentTotalXp = ((data.level || 1) - 1) * xpPerLevel + (data.xp || 0);
                const newTotalXp = currentTotalXp + 10;
                statUpdates.xp = newTotalXp % xpPerLevel;
                statUpdates.level = Math.floor(newTotalXp / xpPerLevel) + 1;
                statUpdates.coin = (data.coin || 0) + 5;
                message = `+10 XP, +5 Koin untuk ${data.nama}!`;
                audioPlayer.xpGain();
                break;
            }
            case 'sakit': hpPenalty = 2; penaltyMessage = 'Cepat sembuh!'; break;
            case 'izin': hpPenalty = 5; penaltyMessage = ''; break;
            case 'alfa': hpPenalty = 10; penaltyMessage = 'Jangan diulangi!'; break;
        }

        if (hpPenalty > 0) {
            statUpdates.hp = Math.max(0, (data.hp || 100) - hpPenalty);
            message = `-${hpPenalty} HP untuk ${data.nama}. ${penaltyMessage}`;
            audioPlayer.hpLoss();
            checkAndNotifyCriticalHp(uid, statUpdates.hp, data.nama, data.hp);

            if (statUpdates.hp <= 0) {
                const durationInDays = 1;
                const expiryTimestamp = Date.now() + (durationInDays * 24 * 60 * 60 * 1000);
                allUpdates[`/students/${uid}/statusEffects/diam`] = { expires: expiryTimestamp };
                message += ` HP habis, terkena kutukan Diam!`;
            }
        }

        // Gabungkan semua update dalam satu operasi
        for (const key in statUpdates) {
            allUpdates[`/students/${uid}/${key}`] = statUpdates[key];
        }
        allUpdates[`/attendance/${attendanceDate}/${uid}`] = { status: action, timestamp: Date.now() };

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
        if (target) {
            const selectedDate = document.getElementById('attendance-date').value;
            if (!selectedDate) {
                showToast('Kesalahan: Tanggal tidak ditemukan. Silakan muat ulang absensi.', true);
                return;
            }
            // Disable all buttons for this student to prevent double-clicking
            target.parentElement.querySelectorAll('.attendance-btn').forEach(btn => btn.disabled = true);
            updateStudentStats(target.dataset.uid, target.dataset.action, null, selectedDate);
        }
    });
    
    // --- LOGIKA QR CODE SCANNER ---
    // Event listener untuk tombol utama "Scan QR"
    document.getElementById('scan-qr-button').addEventListener('click', () => {
    openQrModal(findStudentByNisAndMarkPresent); // Buka modal dan langsung jalankan scanner dengan callback absensi
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
        const selectedDate = document.getElementById('attendance-date').value;
        if (!selectedDate) {
            showToast('Pilih tanggal absensi terlebih dahulu sebelum memindai QR!', true);
            closeQrModal(true); // Tutup modal jika tanggal belum dipilih
            return;
        }
        const snapshot = await get(query(ref(db, 'students'), orderByChild('nis'), equalTo(nis)));
        if (snapshot.exists()) {
            const [uid, student] = Object.entries(snapshot.val())[0];
            updateStudentStats(uid, 'hadir', student, selectedDate);
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
        // PERBAIKAN: Tunda pencetakan untuk menghindari konflik audio dan tutup otomatis setelah cetak.
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        }, 200);
    }

    createLucideIcons();
}

// =======================================================
//          LOGIKA BARU: JURNAL REFLEKSI
// =======================================================
function setupJournalPage() {
    const addJournalButton = document.getElementById('add-journal-button');
    const journalModal = document.getElementById('journal-modal');
    const closeJournalModalButton = document.getElementById('close-journal-modal-button');
    const cancelJournalButton = document.getElementById('cancel-journal-button');
    const journalForm = document.getElementById('journal-form');
    const journalListContainer = document.getElementById('journal-list-container');
    const filterStartDate = document.getElementById('journal-filter-start-date');
    const filterEndDate = document.getElementById('journal-filter-end-date');
    const printButton = document.getElementById('print-journal-button');
    const journalDateInput = document.getElementById('journal-date');
    const journalDayNameInput = document.getElementById('journal-day-name');

    const updateDayName = () => {
        if (!journalDateInput.value) {
            journalDayNameInput.value = '';
            return;
        }
        const date = new Date(journalDateInput.value + 'T00:00:00'); // Ensure local timezone
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
        journalDayNameInput.value = dayName;
    };

    journalDateInput.onchange = updateDayName;

    const openModal = async () => {
        journalForm.reset();
        document.getElementById('journal-id').value = '';
        document.getElementById('journal-modal-title').textContent = 'Tambah Jurnal Refleksi Baru';
        journalDateInput.value = getLocalDateString(new Date());
        updateDayName(); // Set day name for today
        
        const checkedRadio = document.querySelector('.journal-selector input:checked');
        if (checkedRadio) checkedRadio.checked = false;

        journalModal.classList.remove('hidden');
        setTimeout(() => journalModal.classList.remove('opacity-0'), 10);
        audioPlayer.openModal();
    };

    const closeModal = () => {
        journalModal.classList.add('opacity-0');
        setTimeout(() => journalModal.classList.add('hidden'), 300);
        audioPlayer.closeModal();
    };

    const setupSelectors = () => {
        const weather = { 'Cerah': 'sun', 'Berawan': 'cloud', 'Hujan': 'cloud-rain', 'Badai': 'cloud-lightning' };
        const feelings = { 'Senang': 'smile', 'Biasa': 'meh', 'Sedih': 'frown', 'Marah': 'angry' };
        
        const weatherContainer = document.getElementById('journal-weather-selector');
        const feelingContainer = document.getElementById('journal-feeling-selector');

        weatherContainer.innerHTML = Object.entries(weather).map(([name, icon]) => `<div class="journal-selector"><input type="radio" name="weather" id="weather-${name}" value="${name}"><label for="weather-${name}"><i data-lucide="${icon}" class="icon text-yellow-500"></i><span class="text">${name}</span></label></div>`).join('');
        feelingContainer.innerHTML = Object.entries(feelings).map(([name, icon]) => `<div class="journal-selector"><input type="radio" name="feeling" id="feeling-${name}" value="${name}"><label for="feeling-${name}"><i data-lucide="${icon}" class="icon text-blue-500"></i><span class="text">${name}</span></label></div>`).join('');
        createLucideIcons();
    };

    journalForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitButton = document.getElementById('submit-journal-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        try {
            const journalData = {
                author: auth.currentUser.uid,
                kelas: document.getElementById('journal-class').value,
                date: document.getElementById('journal-date').value, subject: document.getElementById('journal-subject').value,
                day: document.getElementById('journal-day-name').value,
                weather: document.querySelector('input[name="weather"]:checked')?.value || '',
                feeling: document.querySelector('input[name="feeling"]:checked')?.value || '',
                tasks: document.getElementById('journal-tasks').value, achievements: document.getElementById('journal-achievements').value,
                notes: document.getElementById('journal-notes').value, tomorrowPlan: document.getElementById('journal-tomorrow-plan').value,
                createdAt: new Date().toISOString()
            };

            await push(ref(db, 'reflectionJournals'), journalData);
            showToast('Jurnal refleksi berhasil disimpan!');
            closeModal();

        } catch (error) {
            showToast(error.message, true);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan Jurnal';
        }
    };

    const renderJournals = () => {
        const journalsRef = query(ref(db, 'reflectionJournals'), orderByChild('date'));
        onValue(journalsRef, async (snapshot) => {
            journalListContainer.innerHTML = LOADER_HTML;

            if (!snapshot.exists()) {
                journalListContainer.innerHTML = '<div class="bg-white rounded-lg shadow-md p-10 text-center text-gray-500"><p>Belum ada jurnal refleksi yang dibuat.</p></div>';
                return;
            }

            const allJournals = [];
            snapshot.forEach(childSnap => allJournals.push({ id: childSnap.key, ...childSnap.val() }));
            allJournals.reverse();

            const startDate = filterStartDate.value, endDate = filterEndDate.value;
            const filteredJournals = allJournals.filter(j => (!startDate || j.date >= startDate) && (!endDate || j.date <= endDate));

            if (filteredJournals.length === 0) {
                journalListContainer.innerHTML = '<div class="bg-white rounded-lg shadow-md p-10 text-center text-gray-500"><p>Tidak ada jurnal yang cocok dengan filter.</p></div>';
                return;
            }

            journalListContainer.innerHTML = '';
            filteredJournals.forEach(j => {
                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-lg shadow-md border-l-4 border-emerald-500 relative';
                card.innerHTML = `<div class="flex justify-between items-start mb-3"><div><h4 class="font-bold text-lg">${j.subject}</h4><p class="text-sm text-gray-600">${j.kelas} | ${j.date} - ${j.day}</p></div><div class="flex gap-3 text-gray-500"><i data-lucide="${{ 'Cerah': 'sun', 'Berawan': 'cloud', 'Hujan': 'cloud-rain', 'Badai': 'cloud-lightning' }[j.weather] || 'sun'}" title="Cuaca: ${j.weather}"></i><i data-lucide="${{ 'Senang': 'smile', 'Biasa': 'meh', 'Sedih': 'frown', 'Marah': 'angry' }[j.feeling] || 'smile'}" title="Perasaan: ${j.feeling}"></i></div></div><div class="space-y-3 text-sm">${j.achievements ? `<p><strong>Pencapaian:</strong> ${j.achievements.replace(/\n/g, '<br>')}</p>` : ''}${j.notes ? `<p><strong>Catatan:</strong> ${j.notes.replace(/\n/g, '<br>')}</p>` : ''}${j.tomorrowPlan ? `<p><strong>Rencana Besok:</strong> ${j.tomorrowPlan.replace(/\n/g, '<br>')}</p>` : ''}</div><button data-id="${j.id}" class="delete-journal-btn text-red-500 hover:text-red-700 text-xs absolute top-3 right-3"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
                journalListContainer.appendChild(card);
            });
            createLucideIcons();
        });
    };
    
    const handlePrint = async () => {
        const startDate = filterStartDate.value, endDate = filterEndDate.value;
        if (!startDate || !endDate) { showToast('Pilih rentang tanggal untuk mencetak!', true); return; }
        showToast('Mempersiapkan jurnal untuk dicetak...');
        const journalsSnap = await get(query(ref(db, 'reflectionJournals'), orderByChild('date')));
        if (!journalsSnap.exists()) { showToast('Tidak ada jurnal ditemukan untuk siswa ini.', true); return; }
        const journalsToPrint = [];
        journalsSnap.forEach(childSnap => { const j = childSnap.val(); if (j.date >= startDate && j.date <= endDate) journalsToPrint.push(j); });
        if (journalsToPrint.length === 0) { showToast('Tidak ada jurnal pada rentang tanggal yang dipilih.', true); return; }
        let html = `<!DOCTYPE html><html><head><title>Jurnal Refleksi Guru</title><style>body{font-family:'Segoe UI',sans-serif;line-height:1.6}.journal-entry{border:1px solid #ccc;border-radius:8px;padding:15px;margin-bottom:20px;page-break-inside:avoid}h1,h2,h3{color:#333}h3{border-bottom:2px solid #eee;padding-bottom:5px}p{margin:5px 0}strong{color:#555}</style></head><body><h1>Jurnal Refleksi Guru</h1><h2>Nama: Mas Panji Purnomo</h2><p>Periode: ${startDate} s/d ${endDate}</p><hr>`;
        journalsToPrint.forEach(j => { html += `<div class="journal-entry"><h3>${j.kelas} | ${j.date} - ${j.day} (${j.subject})</h3><p><strong>Cuaca:</strong> ${j.weather} | <strong>Perasaan:</strong> ${j.feeling}</p><p><strong>Tugas:</strong><br>${j.tasks.replace(/\n/g, '<br>')||'-'}</p><p><strong>Pencapaian:</strong><br>${j.achievements.replace(/\n/g, '<br>')||'-'}</p><p><strong>Catatan:</strong><br>${j.notes.replace(/\n/g, '<br>')||'-'}</p><p><strong>Rencana Besok:</strong><br>${j.tomorrowPlan.replace(/\n/g, '<br>')||'-'}</p></div>`; });
        html += `</body></html>`;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        // PERBAIKAN: Tunda pencetakan untuk menghindari konflik audio.
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 200);
    };

    addJournalButton.onclick = openModal;
    closeJournalModalButton.onclick = closeModal;
    cancelJournalButton.onclick = closeModal;
    filterStartDate.onchange = renderJournals;
    filterEndDate.onchange = renderJournals;
    printButton.onclick = handlePrint;
    journalListContainer.addEventListener('click', async e => {
        const deleteBtn = e.target.closest('.delete-journal-btn');
        if (deleteBtn && confirm('Yakin ingin menghapus jurnal ini?')) {
            await remove(ref(db, `reflectionJournals/${deleteBtn.dataset.id}`));
            showToast('Jurnal berhasil dihapus.');
        }
    });

    setupSelectors();
    renderJournals();
}

// Panggil lucide.createIcons() secara global sekali untuk halaman login & student
createLucideIcons();
