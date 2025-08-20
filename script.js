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

// --- Audio Player ---
const audioPlayer = {
    isReady: false,
    synth: null,
    async init() {
        if (this.isReady || typeof Tone === 'undefined') return;
        try {
            await Tone.start();
            this.synth = new Tone.Synth().toDestination();
            this.isReady = true;
            console.log("Konteks audio berhasil dimulai!");
        } catch (e) { console.error("Gagal memulai audio:", e); }
    },
    play(note, duration = '8n') { if (!this.isReady) return; this.synth.triggerAttackRelease(note, duration); },
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
    closeModal() { this.play('C4', '16n'); },
    victory() {
        if (!this.isReady) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease("C4", "8n", now);
        this.synth.triggerAttackRelease("E4", "8n", now + 0.2);
        this.synth.triggerAttackRelease("G4", "8n", now + 0.4);
        this.synth.triggerAttackRelease("C5", "4n", now + 0.6);
    }
};
document.body.addEventListener('click', () => audioPlayer.init(), { once: true });

// --- KARTU PENJAGA AGAR SETUP HANYA SEKALI JALAN ---
let isAppSetup = false;

// --- Router & Fungsi Bantuan ---
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('/') || path.endsWith('index.html');
    const isAdminPage = path.endsWith('admin.html');
    const isStudentPage = path.endsWith('student.html');
    
    if (isAppSetup) return; // Jika sudah di-setup, jangan jalankan lagi

    if (user) {
        const roleRef = ref(db, `roles/${user.uid}`);
        const roleSnap = await get(roleRef);
        const isAdmin = roleSnap.exists() && roleSnap.val().isAdmin;
        if (isAdmin) {
            if (isLoginPage || isStudentPage) { window.location.href = 'admin.html'; } 
            else if (isAdminPage) { 
                isAppSetup = true; // Tandai sudah di-setup
                setupAdminDashboard(); 
            }
        } else {
            if (isLoginPage || isAdminPage) { window.location.href = 'student.html'; } 
            else if (isStudentPage) { 
                isAppSetup = true; // Tandai sudah di-setup
                setupStudentDashboard(user.uid); 
            }
        }
    } else {
        if (isAdminPage || isStudentPage) { window.location.href = 'index.html'; }
    }
});
const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    toast.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => toast.classList.add('hidden'), 3000);
    if (isError) { audioPlayer.error(); } else { audioPlayer.success(); }
};
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
            let width = img.width; let height = img.height;
            if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
            else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
    });
}
const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginButton = document.getElementById('login-button');
        const loginNotification = document.getElementById('login-notification');
        loginButton.disabled = true; loginButton.textContent = 'Memeriksa...';
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            loginNotification.textContent = 'Email atau password salah!';
            loginNotification.classList.remove('hidden');
            loginNotification.classList.add('bg-red-500');
            audioPlayer.error();
            loginButton.disabled = false; loginButton.textContent = 'Masuk Dunia DREAMY';
        }
    });
}

// =======================================================
//                  LOGIKA DASBOR SISWA
// =======================================================
function setupStudentDashboard(uid) {
    document.getElementById('student-logout-button').onclick = () => signOut(auth);
    
    const studentNavLinks = document.getElementById('student-nav-links');
    const profilePage = document.getElementById('student-profile-page');
    const questsPage = document.getElementById('student-quests-page');
    studentNavLinks.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLink = e.target.closest('a');
        if (!targetLink) return;
        studentNavLinks.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'text-blue-600', 'border-blue-600');
            link.classList.add('text-gray-500', 'border-transparent');
        });
        targetLink.classList.add('active', 'text-blue-600', 'border-blue-600');
        targetLink.classList.remove('text-gray-500', 'border-transparent');
        const pageId = targetLink.getAttribute('href').substring(1);
        profilePage.classList.toggle('hidden', pageId !== 'profile');
        questsPage.classList.toggle('hidden', pageId !== 'quests');
    });

    const studentRef = ref(db, `students/${uid}`);
    onValue(studentRef, (snapshot) => {
        if(!snapshot.exists()) return;
        const studentData = snapshot.val();
        document.getElementById('student-name').textContent = studentData.nama;
        document.getElementById('student-class-role').textContent = `${studentData.kelas} | ${studentData.peran}`;
        document.getElementById('student-avatar').src = studentData.fotoProfilBase64 || `https://placehold.co/128x128/e2e8f0/3d4852?text=${studentData.nama.charAt(0)}`;
        
        const statusContainer = document.getElementById('status-effects-container');
        statusContainer.innerHTML = '';
        if (studentData.status_effects) {
            Object.values(studentData.status_effects).forEach(effect => {
                const now = Date.now();
                if (effect.expires_at > now) {
                    const remainingDays = Math.ceil((effect.expires_at - now) / (1000 * 60 * 60 * 24));
                    let icon = '', color = 'gray', title = `${effect.type} - Sisa ${remainingDays} hari`;
                    if (effect.type === 'racun') { icon = 'biohazard'; color = 'green'; }
                    if (effect.type === 'diam') { icon = 'mic-off'; color = 'gray'; }
                    statusContainer.innerHTML += `<div class="flex items-center gap-1 p-1 bg-${color}-200 rounded-full text-xs" title="${title}"><i data-lucide="${icon}" class="w-4 h-4 text-${color}-600"></i></div>`;
                }
            });
            lucide.createIcons();
        }
    });

    const questListContainer = document.getElementById('student-quest-list');
    const questsRef = ref(db, 'quests');
    onValue(questsRef, (snapshot) => {
        questListContainer.innerHTML = '';
        if (!snapshot.exists()) {
            questListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Tidak ada monster untuk dilawan saat ini.</p>';
            return;
        }
        const questsData = snapshot.val();
        Object.entries(questsData).forEach(([questId, quest]) => {
            const questCard = document.createElement('div');
            questCard.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col items-center gap-2 cursor-pointer hover:shadow-xl transition-shadow';
            questCard.innerHTML = `
                <img src="${quest.monster.imageUrl}" class="w-32 h-32 object-contain">
                <h3 class="font-bold text-lg">${quest.monster.name}</h3>
                <p class="text-sm text-red-500">HP: ${quest.monster.hp}</p>
                <button class="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg">Lawan!</button>
            `;
            questCard.addEventListener('click', () => startBattle(uid, questId, quest));
            questListContainer.appendChild(questCard);
        });
    });
}

// =======================================================
//                  LOGIKA PERTARUNGAN
// =======================================================
let currentBattle = {};

async function startBattle(studentUid, questId, questData) {
    const studentSnap = await get(ref(db, `students/${studentUid}`));
    const studentData = studentSnap.val();

    if(studentData.status_effects && Object.values(studentData.status_effects).some(e => e.type === 'diam' && e.expires_at > Date.now())) {
        showToast('Kamu dalam status Diam dan tidak bisa bertarung!', true);
        return;
    }

    currentBattle = {
        studentUid,
        studentData,
        questId,
        questData,
        monsterCurrentHp: questData.monster.hp,
        currentQuestionIndex: 0,
    };

    const modal = document.getElementById('battle-modal');
    document.getElementById('battle-monster-name').textContent = questData.monster.name;
    document.getElementById('battle-monster-image').src = questData.monster.imageUrl;
    
    document.getElementById('battle-question-area').classList.remove('hidden');
    document.getElementById('battle-result-area').classList.add('hidden');

    modal.classList.remove('hidden');
    audioPlayer.openModal();
    displayNextQuestion();
}

function displayNextQuestion() {
    const monsterHpBar = document.getElementById('battle-monster-hp-bar');
    const monsterMaxHp = currentBattle.questData.monster.hp;
    const monsterHpPercentage = (currentBattle.monsterCurrentHp / monsterMaxHp) * 100;
    monsterHpBar.style.width = `${monsterHpPercentage}%`;
    monsterHpBar.textContent = `${currentBattle.monsterCurrentHp}/${monsterMaxHp}`;

    const question = currentBattle.questData.questions[currentBattle.currentQuestionIndex];
    if (!question) {
        endBattle(false);
        return;
    }

    document.getElementById('battle-question-text').textContent = question.text;
    const answersContainer = document.getElementById('battle-answers-container');
    answersContainer.innerHTML = '';
    
    let answers = [...question.options];
    if(currentBattle.questData.monster.skills.includes('kabut')) {
        answers.sort(() => Math.random() - 0.5);
    }

    answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'w-full p-3 bg-gray-200 hover:bg-gray-300 rounded-lg';
        button.textContent = answer;
        button.onclick = () => handleAnswer(answer === question.correctAnswer);
        answersContainer.appendChild(button);
    });
}

async function handleAnswer(isCorrect) {
    const updates = {};
    if (isCorrect) {
        audioPlayer.xpGain();
        const damage = 25;
        currentBattle.monsterCurrentHp -= damage;
        
        const xpGain = 50;
        currentBattle.studentData.xp = (currentBattle.studentData.xp || 0) + xpGain;
        showToast(`Jawaban Benar! Monster -${damage} HP. Kamu +${xpGain} XP!`);

        if (currentBattle.monsterCurrentHp <= 0) {
            endBattle(true);
            return;
        }
    } else {
        audioPlayer.hpLoss();
        const damage = 10;
        currentBattle.studentData.hp = Math.max(0, (currentBattle.studentData.hp || 100) - damage);
        showToast(`Jawaban Salah! Kamu -${damage} HP!`, true);
        
        await triggerMonsterSkills(updates);

        if (currentBattle.studentData.hp <= 0) {
            endBattle(false);
            return;
        }
    }
    
    currentBattle.currentQuestionIndex++;
    displayNextQuestion();
}

async function triggerMonsterSkills(updates) {
    const skills = currentBattle.questData.monster.skills || [];
    const studentUid = currentBattle.studentUid;
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    if (skills.includes('racun')) {
        updates[`/students/${studentUid}/status_effects/racun`] = { type: 'racun', expires_at: now + threeDays };
        showToast('Kamu terkena Racun!', true);
    }
    if (skills.includes('diam')) {
        updates[`/students/${studentUid}/status_effects/diam`] = { type: 'diam', expires_at: now + threeDays };
        showToast('Kamu terkena status Diam!', true);
    }
    if (skills.includes('knock')) {
        currentBattle.studentData.hp = 10;
        showToast('Skill Knock! HP-mu tersisa 10!', true);
    }
    if (skills.includes('mencuri')) {
        const stolenCoins = Math.min(currentBattle.studentData.coin, 20);
        currentBattle.studentData.coin -= stolenCoins;
        showToast(`Monster mencuri ${stolenCoins} koin!`, true);
    }
    if (skills.includes('hisap')) {
        const stolenXp = Math.min(currentBattle.studentData.xp, 15);
        currentBattle.studentData.xp -= stolenXp;
        showToast(`Monster menghisap ${stolenXp} XP!`, true);
    }
    await update(ref(db), updates);
}

function endBattle(isVictory) {
    document.getElementById('battle-question-area').classList.add('hidden');
    const resultArea = document.getElementById('battle-result-area');
    const resultText = document.getElementById('battle-result-text');
    resultArea.classList.remove('hidden');

    const updates = {};
    if (isVictory) {
        audioPlayer.victory();
        const reward = currentBattle.questData.monster.rewardCoin;
        currentBattle.studentData.coin = (currentBattle.studentData.coin || 0) + reward;
        resultText.textContent = `KAMU MENANG! Mendapatkan ${reward} koin!`;
        updates[`/quests/${currentBattle.questId}`] = null;
    } else {
        audioPlayer.error();
        resultText.textContent = `KAMU KALAH! Coba lagi nanti!`;
    }

    updates[`/students/${currentBattle.studentUid}`] = currentBattle.studentData;
    update(ref(db), updates);

    document.getElementById('close-battle-button').onclick = () => {
        document.getElementById('battle-modal').classList.add('hidden');
        audioPlayer.closeModal();
    };
}


// =======================================================
//                  LOGIKA DASBOR ADMIN (DIPERBAIKI TOTAL)
// =======================================================
function setupAdminDashboard() {
    const adminDashboardMain = document.getElementById('admin-dashboard-main');
    const attendancePage = document.getElementById('attendance-page');
    const questsPage = document.getElementById('quests-page');
    const adminNavLinks = document.getElementById('admin-nav-links');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const studentIdInput = document.getElementById('student-id');
    const authFields = document.getElementById('auth-fields');
    const modalTitle = document.getElementById('modal-title');
    const studentTableBody = document.getElementById('student-table-body');
    const addStudentButton = document.getElementById('add-student-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const cancelButton = document.getElementById('cancel-button');
    const submitButton = document.getElementById('submit-button');

    const openModal = (isEdit = false) => {
        audioPlayer.openModal();
        studentForm.reset();
        studentIdInput.value = '';
        authFields.style.display = isEdit ? 'none' : 'block';
        modalTitle.textContent = isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru';
        document.getElementById('image-preview-container').classList.add('hidden');
        studentModal.classList.remove('hidden');
    };
    const closeModal = () => {
        audioPlayer.closeModal();
        studentModal.classList.add('hidden');
    };

    document.getElementById('admin-logout-button').onclick = () => signOut(auth);
    addStudentButton.onclick = () => openModal(false);
    closeModalButton.onclick = closeModal;
    cancelButton.onclick = closeModal;

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
        questsPage.classList.toggle('hidden', pageId !== 'quests');

        if (pageId === 'quests') setupQuestsPage();
        if (pageId === 'attendance') setupAttendancePage();
    });

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
        submitButton.disabled = true; submitButton.textContent = 'Menyimpan...';
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
                const base64 = await processImageToBase64(fotoFile);
                studentData.fotoProfilBase64 = await resizeImage(base64);
            }
            
            if (id) { 
                await update(ref(db, `students/${id}`), studentData);
                showToast('Data siswa berhasil diperbarui!');
            } else { 
                const email = document.getElementById('email-modal').value;
                const password = document.getElementById('password-modal').value;
                if (!email || !password) throw new Error('Email dan Password harus diisi!');
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
            submitButton.disabled = false; submitButton.textContent = 'Simpan';
        }
    });

    studentTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        
        if (target.classList.contains('delete-btn')) {
            if (confirm('Yakin mau hapus data siswa ini?')) {
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
            }
        }
    });
}

function setupAttendancePage() { /* ... Logika absensi yang sudah ada ... */ }
function setupQuestsPage() {
    const questListContainer = document.getElementById('quest-list-container');
    const addQuestButton = document.getElementById('add-quest-button');
    const questModal = document.getElementById('quest-modal');
    const closeQuestModalButton = document.getElementById('close-quest-modal-button');
    const cancelQuestButton = document.getElementById('cancel-quest-button');
    const questForm = document.getElementById('quest-form');
    const addQuestionButton = document.getElementById('add-question-button');
    const questionsContainer = document.getElementById('questions-container');

    const openQuestModal = (questData = null, questId = null) => {
        questForm.reset();
        document.getElementById('quest-id').value = questId || '';
        questionsContainer.innerHTML = '';
        document.getElementById('monster-image-preview').classList.add('hidden');
        if (questData) {
            // ... (isi form jika edit)
        } else {
            addQuestionField();
        }
        questModal.classList.remove('hidden');
        audioPlayer.openModal();
    };
    const closeQuestModal = () => {
        questModal.classList.add('hidden');
        audioPlayer.closeModal();
    };

    addQuestButton.onclick = () => openQuestModal();
    closeQuestModalButton.onclick = closeQuestModal;
    cancelQuestButton.onclick = closeQuestModal;

    const addQuestionField = (q = { text: '', options: ['', '', '', ''], correctAnswer: '' }) => {
        const div = document.createElement('div');
        div.className = 'p-3 border rounded-md bg-gray-50 space-y-2';
        div.innerHTML = `
            <label class="block text-sm font-medium">Teks Pertanyaan</label>
            <input type="text" class="question-text w-full p-2 border rounded-md" value="${q.text}">
            <label class="block text-sm font-medium">Pilihan Jawaban (yang benar di pilihan A)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="text" placeholder="A. Jawaban Benar" class="question-option w-full p-2 border rounded-md" value="${q.options[0]}">
                <input type="text" placeholder="B. Pilihan Salah" class="question-option w-full p-2 border rounded-md" value="${q.options[1]}">
                <input type="text" placeholder="C. Pilihan Salah" class="question-option w-full p-2 border rounded-md" value="${q.options[2]}">
                <input type="text" placeholder="D. Pilihan Salah" class="question-option w-full p-2 border rounded-md" value="${q.options[3]}">
            </div>
        `;
        questionsContainer.appendChild(div);
    };
    addQuestionButton.onclick = () => addQuestionField();

    document.getElementById('monster-image').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            const preview = document.getElementById('monster-image-preview');
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    const questsRef = ref(db, 'quests');
    onValue(questsRef, (snapshot) => {
        questListContainer.innerHTML = '';
        if (!snapshot.exists()) {
            questListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Belum ada monster. Buat satu!</p>';
            return;
        }
        const questsData = snapshot.val();
        Object.entries(questsData).forEach(([questId, quest]) => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-md';
            card.innerHTML = `
                <img src="${quest.monster.imageUrl}" class="w-full h-32 object-contain mb-2">
                <h3 class="font-bold text-lg">${quest.monster.name}</h3>
                <p class="text-sm text-red-500">HP: ${quest.monster.hp}</p>
                <p class="text-sm text-yellow-600">Reward: ${quest.monster.rewardCoin} Koin</p>
                <div class="mt-2 text-xs">Skills: ${quest.monster.skills.join(', ') || 'None'}</div>
                <div class="mt-4 flex justify-end gap-2">
                    <button class="delete-quest-btn bg-red-500 text-white p-2 rounded-md" data-id="${questId}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
            card.querySelector('.delete-quest-btn').onclick = async () => {
                if (confirm(`Yakin mau hapus monster ${quest.monster.name}?`)) {
                    await remove(ref(db, `quests/${questId}`));
                    showToast('Monster berhasil dihapus!');
                }
            };
            questListContainer.appendChild(card);
        });
        lucide.createIcons();
    });

    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = document.getElementById('submit-quest-button');
        submitButton.disabled = true; submitButton.textContent = 'Menyimpan...';

        try {
            const imageFile = document.getElementById('monster-image').files[0];
            let imageUrl = document.getElementById('monster-image-preview').src;
            if (imageFile) {
                const base64 = await processImageToBase64(imageFile);
                imageUrl = await resizeImage(base64, 200, 200);
            }

            const questions = [];
            questionsContainer.querySelectorAll('.p-3').forEach(qDiv => {
                const options = Array.from(qDiv.querySelectorAll('.question-option')).map(opt => opt.value);
                questions.push({
                    text: qDiv.querySelector('.question-text').value,
                    options: options,
                    correctAnswer: options[0]
                });
            });

            const skills = [];
            document.querySelectorAll('.monster-skill:checked').forEach(skillEl => {
                skills.push(skillEl.dataset.skill);
            });

            const questData = {
                monster: {
                    name: document.getElementById('monster-name').value,
                    hp: parseInt(document.getElementById('monster-hp').value),
                    rewardCoin: parseInt(document.getElementById('monster-reward-coin').value),
                    imageUrl: imageUrl,
                    skills: skills
                },
                questions: questions
            };
            
            const questId = document.getElementById('quest-id').value || push(questsRef).key;
            await set(ref(db, `quests/${questId}`), questData);
            
            showToast('Monster berhasil disimpan!');
            closeQuestModal();
        } catch (error) {
            showToast('Gagal menyimpan monster!', true);
            console.error(error);
        } finally {
            submitButton.disabled = false; submitButton.textContent = 'Simpan Monster';
        }
    });
}

// Panggil lucide.createIcons() secara global
lucide.createIcons();
