import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

// --- Audio Player Simple ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq = 440, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
const sounds = {
    coin: () => { playSound(1200, 'sine', 0.1); setTimeout(() => playSound(1600, 'sine', 0.2), 100); },
    xp: () => { playSound(400, 'square', 0.1); setTimeout(() => playSound(600, 'square', 0.1), 100); },
    error: () => playSound(200, 'sawtooth', 0.3),
    spell: () => { playSound(800, 'sine', 0.5); playSound(1200, 'triangle', 0.5); }
};

// --- Initialization ---
let currentUser = null;
let teacherData = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const roleRef = ref(db, `roles/${user.uid}`);
        const roleSnap = await get(roleRef);

        if (roleSnap.exists() && roleSnap.val().role === 'teacher') {
            initTeacherDashboard(user.uid);
        } else {
            // If not teacher, check if admin or student and redirect accordingly
            if (roleSnap.exists() && roleSnap.val().isAdmin) {
                window.location.replace('admin.html');
            } else {
                window.location.replace('student.html');
            }
        }

        // Setup Modal Close on Click Outside
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.onclick = toggleSidebar;

    } else {
        window.location.replace('index.html');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

async function initTeacherDashboard(uid) {
    const teacherRef = ref(db, `teachers/${uid}`);

    // Realtime Listener
    onValue(teacherRef, (snapshot) => {
        if (!snapshot.exists()) {
            // First time setup - Extended with new profile fields
            const initialData = {
                name: currentUser.displayName || "Unknown Mentor",
                email: currentUser.email,
                level: 1,
                xp: 0,
                max_xp: 1000,
                hp: 100,
                max_hp: 100,
                mp: 50,
                max_mp: 50,
                coin: 0,
                last_login: new Date().toISOString(),
                schedule_buff_active: false,
                // New Profile Fields
                niy: "",
                gender: "",
                dob: "",
                role_detail: "Guru Mapel",
                phone: "",
                address: "",
                avatar_seed: currentUser.displayName || "Teacher"
            };
            set(teacherRef, initialData);
            teacherData = initialData;
        } else {
            teacherData = snapshot.val();
            // Ensure new fields exist for legacy data
            if (!teacherData.avatar_seed) teacherData.avatar_seed = teacherData.name || "Teacher";
            if (!teacherData.role_detail) teacherData.role_detail = "Guru Mapel";
        }
        updateUI();
        fetchDashboardStats();
        populateClassDropdown(); // New function call
    });

    // Check Inactivity (The Curse of Sloth)
    const snap = await get(teacherRef);
    if (snap.exists()) {
        const data = snap.val();
        const lastLogin = new Date(data.last_login);
        const now = new Date();
        const diffTime = Math.abs(now - lastLogin);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            const newHp = Math.max(0, data.hp - 50);
            update(teacherRef, { hp: newHp, last_login: now.toISOString() });
            showToast("⚠️ THE CURSE OF SLOTH! HP decreased by 50 due to inactivity.", true);
            const avatar = document.getElementById('teacher-avatar');
            if (avatar) avatar.classList.add('cursed');
        } else {
            // Update last login if < 7 days (Daily check)
            // To avoid spamming updates, check if day changed
            if (diffDays >= 1) {
                update(teacherRef, { last_login: now.toISOString() });
            }
        }
    }
}

function updateUI() {
    if (!teacherData) return;

    // Sidebar & Header Profile
    document.getElementById('teacher-name').textContent = teacherData.name;
    document.getElementById('welcome-name').textContent = teacherData.name.split(' ')[0]; // First name only
    document.getElementById('teacher-level').textContent = teacherData.level;
    document.getElementById('teacher-role').textContent = teacherData.role_detail || "Guru Kejuruan";

    // Avatar Update
    document.getElementById('teacher-avatar').src = teacherData.photoBase64 || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherData.avatar_seed}`;

    // Header Stats HUD
    updateBar('hp-bar', teacherData.hp, teacherData.max_hp, 'hp-text');
    updateBar('mp-bar', teacherData.mp, teacherData.max_mp, 'mp-text');
    updateBar('xp-bar', teacherData.xp, teacherData.max_xp, 'xp-text');

    const coinDisplay = document.getElementById('coin-display');
    if (coinDisplay) coinDisplay.textContent = `${teacherData.coin}`;

    // Spell Locks
    toggleSpellLock('lock-noise', teacherData.level >= 5);
    toggleSpellLock('lock-chat', teacherData.level >= 3);

    // Spell Buttons
    const btnNoise = document.getElementById('btn-noise');
    if (btnNoise) btnNoise.disabled = teacherData.level < 5;

    const btnChat = document.getElementById('btn-chat');
    if (btnChat) btnChat.disabled = teacherData.level < 3;
}

// --- Profile Modal Logic ---
window.openProfileModal = () => {
    if (!teacherData) return;

    // Populate Fields
    document.getElementById('edit-name').value = teacherData.name || "";
    document.getElementById('edit-niy').value = teacherData.niy || "";
    document.getElementById('edit-gender').value = teacherData.gender || "";
    document.getElementById('edit-dob').value = teacherData.dob || "";
    document.getElementById('edit-role-detail').value = teacherData.role_detail || "Guru Mapel";
    document.getElementById('edit-phone').value = teacherData.phone || "";
    document.getElementById('edit-email').value = teacherData.email || "";
    document.getElementById('edit-address').value = teacherData.address || "";

    document.getElementById('modal-level-display').textContent = teacherData.level;
    document.getElementById('modal-avatar-preview').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherData.avatar_seed}`;

    // Show Modal with Animation
    const modal = document.getElementById('profile-modal');
    modal.classList.remove('hidden');
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);
};

window.closeProfileModal = () => {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    modal.querySelector('div').classList.remove('scale-100');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

// --- Avatar & Camera Logic ---
let tempAvatarSeed = null;
let cameraStream = null;
let capturedPhotoParams = null; // Store base64 photo

window.regenerateAvatar = () => {
    tempAvatarSeed = Math.random().toString(36).substring(7);
    capturedPhotoParams = null; // Reset photo if generating seed
    document.getElementById('modal-avatar-preview').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${tempAvatarSeed}`;
};

window.openCameraModal = async () => {
    const modal = document.getElementById('camera-modal');
    modal.classList.remove('hidden');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        document.getElementById('camera-stream').srcObject = cameraStream;

        // Reset state
        document.getElementById('camera-stream').classList.remove('hidden');
        document.getElementById('camera-canvas').classList.add('hidden');
        document.getElementById('btn-take-photo').classList.remove('hidden');
        document.getElementById('btn-retake-photo').classList.add('hidden');
        document.getElementById('btn-save-photo').classList.add('hidden');

    } catch (err) {
        console.error("Camera access denied:", err);
        showToast("❌ Tidak dapat mengakses kamera", true);
        closeCameraModal();
    }
};

window.closeCameraModal = () => {
    const modal = document.getElementById('camera-modal');
    modal.classList.add('hidden');

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
};

window.takePhoto = () => {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to Base64 (Resize/Compress simple approach: set smaller quality/size if needed)
    // For now, raw capture. For optimization, we could draw to smaller canvas.

    // UI Update
    video.classList.add('hidden');
    canvas.classList.remove('hidden');
    document.getElementById('btn-take-photo').classList.add('hidden');
    document.getElementById('btn-retake-photo').classList.remove('hidden');
    document.getElementById('btn-save-photo').classList.remove('hidden');
};

window.retakePhoto = () => {
    document.getElementById('camera-stream').classList.remove('hidden');
    document.getElementById('camera-canvas').classList.add('hidden');
    document.getElementById('btn-take-photo').classList.remove('hidden');
    document.getElementById('btn-retake-photo').classList.add('hidden');
    document.getElementById('btn-save-photo').classList.add('hidden');
};

window.savePhotoToModal = () => {
    const canvas = document.getElementById('camera-canvas');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG

    capturedPhotoParams = dataUrl;
    tempAvatarSeed = null; // Clear seed since we used photo

    document.getElementById('modal-avatar-preview').src = dataUrl;
    closeCameraModal();
};

window.saveProfile = async () => {
    if (!currentUser) return;

    const updates = {
        name: document.getElementById('edit-name').value,
        niy: document.getElementById('edit-niy').value,
        gender: document.getElementById('edit-gender').value,
        dob: document.getElementById('edit-dob').value,
        role_detail: document.getElementById('edit-role-detail').value,
        phone: document.getElementById('edit-phone').value,
        address: document.getElementById('edit-address').value,
    };

    // Check if we have a photo or new seed
    if (capturedPhotoParams) {
        updates.photoBase64 = capturedPhotoParams;
        updates.avatar_seed = null; // Clear seed
    } else if (tempAvatarSeed) {
        updates.avatar_seed = tempAvatarSeed;
        updates.photoBase64 = null; // Clear photo
    }

    try {
        await update(ref(db, `teachers/${currentUser.uid}`), updates);
        showToast("✅ Profil berhasil diperbarui!");
        closeProfileModal();
    } catch (error) {
        console.error(error);
        showToast("❌ Gagal menyimpan profil.", true);
    }
};

// --- Attendance Logic ---
window.loadStudentsForAttendance = async () => {
    const classSelect = document.getElementById('attendance-class-select');
    const selectedClass = classSelect.value;
    const tbody = document.getElementById('attendance-table-body');

    if (!selectedClass) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 italic">Silakan pilih kelas terlebih dahulu.</td></tr>`;
        return;
    }

    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Memuat data siswa...</td></tr>`;

    const studentsRef = ref(db, 'students');
    const snapshot = await get(studentsRef);

    if (snapshot.exists()) {
        const students = snapshot.val();
        let studentList = [];

        Object.entries(students).forEach(([uid, s]) => {
            const studentClass = s.kelas || s.class;
            if (studentClass === selectedClass) {
                const displayName = s.name || s.nama || "Tanpa Nama";
                studentList.push({ uid, name: displayName, ...s });
            }
        });

        if (studentList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Tidak ada siswa di kelas ini.</td></tr>`;
            return;
        }

        studentList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        tbody.innerHTML = "";
        studentList.forEach((s, index) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-blue-50 transition-colors border-b border-gray-100";
            const groupName = `attend-${s.uid}`;

            row.innerHTML = `
                <td class="px-6 py-4 text-gray-600">${index + 1}</td>
                <td class="px-6 py-4 font-medium text-gray-800">${s.name}</td>
                <td class="px-6 py-4 text-center">
                    <div class="inline-flex bg-gray-100 rounded-lg p-1 space-x-1">
                        <label class="cursor-pointer" onclick="updateAttendanceRow('${s.uid}', 'H')">
                            <input type="radio" name="${groupName}" value="H" class="peer sr-only" checked>
                            <span class="px-3 py-1 rounded-md text-gray-500 text-xs font-bold peer-checked:bg-green-500 peer-checked:text-white hover:bg-gray-200 transition">H</span>
                        </label>
                        <label class="cursor-pointer" onclick="updateAttendanceRow('${s.uid}', 'S')">
                            <input type="radio" name="${groupName}" value="S" class="peer sr-only">
                            <span class="px-3 py-1 rounded-md text-gray-500 text-xs font-bold peer-checked:bg-yellow-400 peer-checked:text-white hover:bg-gray-200 transition">S</span>
                        </label>
                        <label class="cursor-pointer" onclick="updateAttendanceRow('${s.uid}', 'I')">
                            <input type="radio" name="${groupName}" value="I" class="peer sr-only">
                            <span class="px-3 py-1 rounded-md text-gray-500 text-xs font-bold peer-checked:bg-blue-400 peer-checked:text-white hover:bg-gray-200 transition">I</span>
                        </label>
                        <label class="cursor-pointer" onclick="updateAttendanceRow('${s.uid}', 'A')">
                            <input type="radio" name="${groupName}" value="A" class="peer sr-only">
                            <span class="px-3 py-1 rounded-md text-gray-500 text-xs font-bold peer-checked:bg-red-500 peer-checked:text-white hover:bg-gray-200 transition">A</span>
                        </label>
                    </div>
                </td>
                <td class="px-6 py-4" id="msg-cell-${s.uid}">
                     <span class="text-xs text-green-600 font-semibold">✨ Rajin pangkal pandai! (+XP)</span>
                     <input type="hidden" name="note-${s.uid}" value="Hadir">
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Data siswa tidak ditemukan.</td></tr>`;
    }
};

window.updateAttendanceRow = (uid, status) => {
    const cell = document.getElementById(`msg-cell-${uid}`);
    if (!cell) return;

    let content = '';
    if (status === 'H') {
        content = `
            <span class="text-xs text-green-600 font-semibold">✨ Rajin pangkal pandai! (+XP)</span>
            <input type="hidden" name="note-${uid}" value="Hadir">
        `;
    } else if (status === 'A') {
        content = `
            <span class="text-xs text-red-500 font-bold">⚠️ Bolos mengurangi kesehatan! (-HP)</span>
            <input type="hidden" name="note-${uid}" value="Alpha">
        `;
    } else if (status === 'S') {
        content = `
            <input type="text" name="note-${uid}" placeholder="Keterangan Sakit..." class="w-full text-xs px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:border-yellow-500 bg-yellow-50 animate-pulse">
        `;
    } else if (status === 'I') {
        content = `
            <input type="text" name="note-${uid}" placeholder="Keterangan Izin..." class="w-full text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 bg-blue-50 animate-pulse">
        `;
    }
    cell.innerHTML = content;
};

window.saveAttendance = async () => {
    const classSelect = document.getElementById('attendance-class-select');
    const dateInput = document.getElementById('attendance-date');
    const selectedClass = classSelect.value;
    const selectedDate = dateInput.value;

    if (!selectedClass || !selectedDate) {
        showToast("⚠️ Pilih kelas dan tanggal dulu!", true);
        return;
    }

    const rows = document.getElementById('attendance-table-body').querySelectorAll('tr');
    let attendanceData = {};
    let count = 0;
    const updates = {}; // For multi-path updates

    // Iterate rows to build updates
    for (const row of rows) {
        const radioChecked = row.querySelector('input[type="radio"]:checked');
        if (radioChecked) {
            const uid = radioChecked.name.replace('attend-', '');
            const status = radioChecked.value;
            // Handle flexible note input (text or hidden)
            const noteInput = row.querySelector(`input[name="note-${uid}"]`);
            const note = noteInput ? noteInput.value : "";

            attendanceData[uid] = {
                status: status,
                note: note,
                timestamp: new Date().toISOString()
            };

            // RPG Effects Logic
            // H: +10 XP, +5 Coin (Positive Reinforcement)
            // A: -10 HP (Negative Consequence)
            // S/I: No effect

            const studentRef = ref(db, `students/${uid}`);

            try {
                const sSnap = await get(studentRef);
                if (sSnap.exists()) {
                    let sData = sSnap.val();
                    let sUpdates = {};

                    if (status === 'H') {
                        sUpdates.xp = (sData.xp || 0) + 10;
                        sUpdates.coin = (sData.coin || 0) + 5;
                    } else if (status === 'A') {
                        sUpdates.hp = Math.max(0, (sData.hp || 100) - 10);
                    }

                    if (Object.keys(sUpdates).length > 0) {
                        updates[`students/${uid}`] = { ...sData, ...sUpdates };
                    }
                }
            } catch (e) { console.error("Error reading student for stats:", uid, e); }

            count++;
        }
    }

    if (count === 0) {
        showToast("⚠️ Tidak ada data siswa.", true);
        return;
    }

    try {
        // Double check: save attendance record
        updates[`attendance/${selectedDate}/${selectedClass}`] = attendanceData;

        await update(ref(db), updates);
        showToast(`✅ Absensi disimpan! Reward & Punishment diterapkan.`);

        // Also award teacher XP
        await window.submitGrind('presence');

    } catch (err) {
        console.error("Save attendance error:", err);
        showToast("❌ Gagal menyimpan absensi.", true);
    }
};

// Populate Class Dropdown on Load
async function populateClassDropdown() {
    const classSelect = document.getElementById('attendance-class-select');
    if (!classSelect) return;

    const studentsRef = ref(db, 'students');
    const snapshot = await get(studentsRef);
    if (snapshot.exists()) {
        const students = snapshot.val();
        const classes = new Set();
        Object.values(students).forEach(s => {
            if (s.kelas) classes.add(s.kelas);
            if (s.class) classes.add(s.class);
        });

        // Clear options except first
        classSelect.innerHTML = '<option value="">Pilih Kelas...</option>';
        Array.from(classes).sort().forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls;
            opt.textContent = cls;
            classSelect.appendChild(opt);
        });
    }
}

function updateBar(id, current, max, textId) {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const bar = document.getElementById(id);
    const text = document.getElementById(textId);

    bar.style.width = `${percentage}%`;
    bar.textContent = `${Math.floor(percentage)}%`;
    text.textContent = `${current}/${max}`;
}

function toggleSpellLock(id, isUnlocked) {
    const el = document.getElementById(id);
    if (isUnlocked) {
        el.classList.add('hidden');
    } else {
        el.classList.remove('hidden');
    }
}

// --- The Grind Mechanics ---
// --- The Grind Mechanics ---
window.submitGrind = async (type) => {
    if (!teacherData) return;

    let xpGain = 0;
    let coinGain = 0;

    // Validation
    const journalInput = document.getElementById('journal-input');
    if (type === 'journal') {
        if (!journalInput || journalInput.value.length < 5) {
            alert("⚠️ Jurnal terlalu pendek! Harap isi kegiatan mengajar dengan lengkap.");
            if (window.sounds) window.sounds.error();
            return;
        }
    }

    // Set Rewards
    if (type === 'journal') { xpGain = 10; coinGain = 5; }
    if (type === 'grades') { xpGain = 15; coinGain = 8; }
    if (type === 'presence') { xpGain = 5; coinGain = 2; }

    // Logic Calculation
    let newXp = (teacherData.xp || 0) + xpGain;
    let newCoin = (teacherData.coin || 0) + coinGain;
    let newLevel = teacherData.level || 1;
    let maxXp = teacherData.max_xp || 1000;

    // Level Up Logic
    if (newXp >= maxXp) {
        newXp = newXp - maxXp;
        newLevel++;
        maxXp = Math.floor(maxXp * 1.2);
        alert(`🎉 LEVELED UP! Selamat, Anda naik ke Level ${newLevel}!`);
        if (window.sounds) window.sounds.spell();
    }

    try {
        // Update DB
        const updates = {};
        updates[`teachers/${currentUser.uid}/xp`] = newXp;
        updates[`teachers/${currentUser.uid}/coin`] = newCoin;
        updates[`teachers/${currentUser.uid}/level`] = newLevel;
        updates[`teachers/${currentUser.uid}/max_xp`] = maxXp;

        await update(ref(db), updates);

        // Feedback
        // alert(`✅ Berhasil! +${xpGain} XP | +${coinGain} Koin`);
        showToast(`Misi Selesai: +${xpGain} XP | +${coinGain} Koin`);

        if (window.sounds) window.sounds.xp();

        // Clear inputs
        if (type === 'journal' && journalInput) journalInput.value = '';

    } catch (error) {
        console.error("Grind Error:", error);
        alert("Gagal menyimpan progress: " + error.message);
    }
};

// Expose sounds globally (mock, or link to audio player)
window.sounds = {
    coin: () => console.log("Sound: Coin"),
    xp: () => console.log("Sound: XP"),
    error: () => console.log("Sound: Error"),
    spell: () => console.log("Sound: Spell")
};


// --- Magic Spells ---
window.castSpell = async (spellName) => {
    if (!teacherData) return;

    let mpCost = 0;
    let minLevel = 1;

    if (spellName === 'noise') { mpCost = 20; minLevel = 5; }
    if (spellName === 'chat') { mpCost = 5; minLevel = 3; }

    // Checks
    if (teacherData.level < minLevel) {
        showToast(`Level ${minLevel} required!`, true);
        sounds.error();
        return;
    }
    if (teacherData.mp < mpCost) {
        showToast("Not enough Mana! Do some work/rest.", true);
        sounds.error();
        return;
    }

    // Deduct MP
    await update(ref(db, `teachers/${currentUser.uid}`), { mp: teacherData.mp - mpCost });

    // Activate Effect
    if (spellName === 'noise') activateNoiseDetector();
    if (spellName === 'chat') activateChat();

    sounds.spell();
};

window.toggleBuff = async () => {
    const isChecked = document.getElementById('schedule-toggle').checked;
    await update(ref(db, `teachers/${currentUser.uid}`), { schedule_buff_active: isChecked });
    document.getElementById('buff-status').classList.toggle('hidden', !isChecked);
    if (isChecked) showToast("Curriculum Buff Activated!");
};

// --- Spell Effects ---
function activateNoiseDetector() {
    const container = document.getElementById('noise-visualizer');
    container.classList.remove('hidden');
    showToast("Microphone Arcane Activated...");

    // Mock Visualizer Logic
    const bars = document.getElementById('visualizer-bars').children;
    const interval = setInterval(() => {
        for (let bar of bars) {
            bar.style.height = `${Math.random() * 2 + 0.5}rem`;
        }
    }, 100);

    // Auto turn off after 10s to save "magic" (mock)
    setTimeout(() => {
        clearInterval(interval);
        container.classList.add('hidden');
        showToast("Spell duration ended.");
    }, 10000);
}

function activateChat() {
    // Mock
    const msg = prompt("Send telepathic message to students:");
    if (msg) {
        showToast("Message sent via Pigeon Post!");
        // Ideally write to 'messages' node
    }
}

// --- Dashboard Stats Logic ---
async function fetchDashboardStats() {
    try {
        // Try to fetch from 'students' node first for detailed stats
        const studentsRef = ref(db, 'students');
        const studentSnap = await get(studentsRef);

        let studentCount = 0;
        let troubleCount = 0;
        let classSet = new Set();

        if (studentSnap.exists()) {
            const students = studentSnap.val();
            Object.values(students).forEach(student => {
                studentCount++;
                if (student.kelas) classSet.add(student.kelas);
                if (student.class) classSet.add(student.class);
                if (student.hp && student.hp < 50) troubleCount++;
            });
        } else {
            // Fallback to 'users' if 'students' node is empty (for count only)
            const usersRef = ref(db, 'users');
            const usersSnap = await get(usersRef);
            if (usersSnap.exists()) {
                Object.values(usersSnap.val()).forEach(user => {
                    if (user.role === 'student' || user.role === 'siswa') {
                        studentCount++;
                    }
                });
            }
        }

        // Update UI IDs matching teacher.html
        const elStudent = document.getElementById('stat-student-count');
        const elClass = document.getElementById('stat-class-count');
        const elTrouble = document.getElementById('stat-trouble-count');

        if (elStudent) elStudent.innerText = studentCount;
        if (elClass) elClass.innerText = classSet.size > 0 ? `${classSet.size} Kelas` : "0 Kelas";
        if (elTrouble) elTrouble.innerText = troubleCount;

    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// --- Utils ---
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-message');

    if (!toast || !msgElement) return;

    msgElement.textContent = msg;

    // Reset classes
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-opacity duration-300 z-50 ${isError ? 'bg-red-800 text-white' : 'bg-gray-800 text-white'}`;

    toast.classList.remove('hidden');
    // Small timeout to allow removing 'hidden' to take effect before opacity transition
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}
