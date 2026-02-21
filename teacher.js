import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref as dbRef, get, set, update, onValue, push, remove, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
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

const { createApp, ref, reactive, onMounted, computed, watch } = Vue;

const appVue = createApp({
    setup() {
        // --- State ---
        const user = ref(null);
        const currentTab = ref('dashboard');
        const isMobile = ref(false);
        const isSidebarOpen = ref(false);
        const isDreamyOpen = ref(false);
        const loading = ref(true);

        const teacherData = reactive({
            name: '',
            level: 1,
            xp: 0, max_xp: 1000,
            hp: 100, max_hp: 100,
            mp: 50, max_mp: 50,
            coin: 0,
            role_detail: 'Guru Mapel',
            avatar_seed: 'Teacher',
            photoBase64: null
        });

        const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
            { id: 'grind', label: 'The Daily Grind', icon: 'fas fa-fire' },
            { id: 'jadwal', label: 'Bonty Board', icon: 'fas fa-calendar-alt' },
            { id: 'absensi', label: 'Absensi', icon: 'fas fa-user-check' },
            { id: 'nilai', label: 'Input Nilai', icon: 'fas fa-pen-fancy' },
            { id: 'materi', label: 'Materi', icon: 'fas fa-book-open' },
        ];

        // Attendance State
        const classList = ref([]);
        const students = ref([]);
        const selectedClass = ref('');
        const selectedDate = ref(new Date().toISOString().split('T')[0]);
        const attendanceUpdates = reactive({});
        const loadingStudents = ref(false);


        // Notifs
        const quickStats = ref([
            { label: 'Total Siswa', value: '...', icon: 'fas fa-users', color: 'blue' },
            { label: 'Kelas Hari Ini', value: '...', icon: 'fas fa-chalkboard-teacher', color: 'green' },
            { label: 'Tugas Masuk', value: '0', icon: 'fas fa-file-alt', color: 'yellow' },
            { label: 'Masalah', value: '0', icon: 'fas fa-exclamation-triangle', color: 'red' }
        ]);

        // --- Computed ---
        const firstName = computed(() => teacherData.name ? teacherData.name.split(' ')[0] : 'Guru');
        const currentDate = computed(() => {
            return new Date().toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        });

        // --- Auth & Init ---
        onMounted(() => {
            checkMobile();
            window.addEventListener('resize', checkMobile);

            onAuthStateChanged(auth, async (u) => {
                if (u) {
                    user.value = u;
                    const roleSnap = await get(dbRef(db, `roles/${u.uid}`));
                    if (roleSnap.exists() && roleSnap.val().role === 'teacher') {
                        initTeacherData(u.uid);
                    } else {
                        // Redirect Logic can be enabled later
                        // window.location.replace(roleSnap.val().isAdmin ? 'admin.html' : 'student.html');
                    }
                } else {
                    // window.location.replace('index.html');
                }
            });
        });

        const checkMobile = () => { isMobile.value = window.innerWidth < 768; };

        const initTeacherData = (uid) => {
            const teacherRef = dbRef(db, `teachers/${uid}`);
            onValue(teacherRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Map Firebase data to local state
                    teacherData.name = data.nama || data.name || 'Guru';
                    teacherData.photoBase64 = data.fotoProfilBase64 || data.photoBase64 || null;
                    teacherData.level = data.level || 1;
                    teacherData.xp = data.xp || 0;
                    teacherData.max_xp = data.max_xp || 1000;
                    teacherData.hp = data.hp || 100;
                    teacherData.max_hp = data.max_hp || 100;
                    teacherData.mp = data.mp || 50;
                    teacherData.max_mp = data.max_mp || 50;
                    teacherData.coin = data.coin || 0;

                    // Format Role Detail from Subjects
                    if (data.subjects && Array.isArray(data.subjects)) {
                        teacherData.role_detail = data.subjects.map(s => `${s.subject} (${s.class})`).join(', ');
                    } else {
                        teacherData.role_detail = data.role_detail || 'Guru Mapel';
                    }

                    loading.value = false;
                }
            });
            loadClassList();
            fetchDashboardStats();
            fetchJournals(uid);
            fetchInventoryAndEffects(uid);
            fetchShopItems();
            fetchChatRecipients();
            fetchBounties();
            fetchSubmissions();
        };

        const loadClassList = async () => {
            const studentsRef = dbRef(db, 'students');
            onValue(studentsRef, (snap) => {
                if (snap.exists()) {
                    const classes = new Set();
                    let studentCount = 0;
                    Object.values(snap.val()).forEach(s => {
                        if (s.kelas) classes.add(s.kelas);
                        if (s.class) classes.add(s.class);
                        studentCount++;
                    });
                    classList.value = Array.from(classes).sort();
                    quickStats.value[0].value = studentCount;
                    quickStats.value[1].value = classes.size + ' Kelas';
                }
            }, { onlyOnce: true });
        };

        const fetchDashboardStats = () => {
            // Placeholder for simpler logic than original
        };

        // --- Methods ---

        // Attendance Logic
        const fetchStudents = async () => {
            if (!selectedClass.value) return;
            loadingStudents.value = true;
            students.value = [];

            // Clear existing keys in reactive object
            Object.keys(attendanceUpdates).forEach(key => delete attendanceUpdates[key]);

            const snap = await get(dbRef(db, 'students'));
            if (snap.exists()) {
                const list = [];
                Object.entries(snap.val()).forEach(([uid, s]) => {
                    // Check both 'kelas' and 'class'
                    const sClass = s.kelas || s.class;
                    if (sClass === selectedClass.value) {
                        const studentObj = { uid, name: s.name || s.nama || 'Tanpa Nama', ...s };
                        list.push(studentObj);

                        // Init reactive update object
                        attendanceUpdates[uid] = { status: 'H', note: 'Hadir' };
                    }
                });
                students.value = list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            }
            loadingStudents.value = false;
        };

        const updateStatus = (uid, status) => {
            const noteMap = { 'H': 'Hadir', 'A': 'Alpha', 'S': '', 'I': '' };
            if (attendanceUpdates[uid]) {
                attendanceUpdates[uid].status = status;
                attendanceUpdates[uid].note = noteMap[status];
            }
        };

        const saveAttendance = async () => {
            if (!selectedClass.value || !selectedDate.value) {
                alert("Pilih kelas dan tanggal!"); return;
            }

            const updates = {};
            const attendRecord = {};
            let count = 0;

            students.value.forEach(student => {
                const uid = student.uid;
                const record = attendanceUpdates[uid];
                if (record) {
                    attendRecord[uid] = {
                        status: record.status,
                        note: record.note,
                        timestamp: new Date().toISOString()
                    };
                    count++;
                }
            });

            if (count === 0) return;

            updates[`attendance/${selectedDate.value}/${selectedClass.value}`] = attendRecord;

            // RPG Effects: In a real implementation, we would update student stats here.
            // For now, we focus on saving the attendance record correctly.

            try {
                await update(dbRef(db), updates);
                await submitGrind('presence');
                alert("✅ Absensi Disimpan!");
            } catch (e) {
                console.error(e);
                alert("❌ Gagal simpan");
            }
        };

        // Grind Logic
        const journalForm = reactive({
            class: '',
            date: new Date().toISOString().split('T')[0],
            subject: '',
            day: '',
            weather: '',
            feeling: '',
            tasks: '',
            achievements: '',
            notes: '',
            tomorrowPlan: ''
        });

        watch(() => journalForm.date, (newDate) => {
            if (newDate) {
                const date = new Date(newDate);
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                journalForm.day = days[date.getDay()];
            }
        }, { immediate: true });

        // --- Journal History Logic ---
        const journalList = ref([]);
        const journalFilter = reactive({
            startDate: '',
            endDate: '',
            search: ''
        });

        const fetchJournals = (uid) => {
            // Query journals where 'author' == uid
            const q = query(dbRef(db, 'reflectionJournals'), orderByChild('author'), equalTo(uid));
            onValue(q, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Convert object to array and reverse sort by date (descending)
                    const arr = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
                    journalList.value = arr;
                } else {
                    journalList.value = [];
                }
            });
        };

        const filteredJournals = computed(() => {
            return journalList.value.filter(j => {
                const matchesDate = (!journalFilter.startDate || j.date >= journalFilter.startDate) &&
                    (!journalFilter.endDate || j.date <= journalFilter.endDate);
                const searchLower = journalFilter.search.toLowerCase();
                const matchesSearch = !journalFilter.search ||
                    (j.subject && j.subject.toLowerCase().includes(searchLower)) ||
                    (j.tasks && j.tasks.toLowerCase().includes(searchLower)) ||
                    (j.class && j.class.toLowerCase().includes(searchLower));
                return matchesDate && matchesSearch;
            });
        });

        const deleteJournal = async (id) => {
            if (!confirm("Yakin ingin menghapus jurnal ini?")) return;
            try {
                await remove(dbRef(db, `reflectionJournals/${id}`));
                alert("Jurnal dihapus.");
            } catch (e) {
                console.error(e);
                alert("Gagal menghapus jurnal.");
            }
        };

        const printJournals = () => {
            if (filteredJournals.value.length === 0) {
                alert("Tidak ada jurnal untuk dicetak. Sesuaikan filter Anda.");
                return;
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert("Popup blocked. Please allow popups for this site.");
                return;
            }

            const journals = filteredJournals.value;
            const startDate = journalFilter.startDate || 'Awal';
            const endDate = journalFilter.endDate || 'Akhir';

            let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Jurnal Refleksi Guru</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #2c3e50; }
                    .header p { margin: 5px 0; color: #7f8c8d; }
                    .journal-entry { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; background: #fff; }
                    .meta { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; font-weight: bold; color: #2c3e50; }
                    .content p { margin: 5px 0; }
                    .label { font-weight: bold; color: #7f8c8d; font-size: 0.9em; }
                    .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #aaa; }
                    @media print {
                        body { padding: 0; }
                        .journal-entry { border: 1px solid #ccc; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Jurnal Refleksi Guru</h1>
                    <p>Nama: ${teacherData.name || 'Guru'}</p>
                    <p>Periode: ${startDate} s/d ${endDate}</p>
                    <p>Total Jurnal: ${journals.length}</p>
                </div>
            `;

            journals.forEach(j => {
                html += `
                <div class="journal-entry">
                    <div class="meta">
                        <span>${j.day}, ${j.date}</span>
                        <span>${j.class} | ${j.subject}</span>
                    </div>
                    <div class="content">
                         <p><span class="label">Perasaan / Cuaca:</span> ${j.feeling || '-'} / ${j.weather || '-'}</p>
                         <p><span class="label">Kegiatan:</span><br>${(j.tasks || '').replace(/\n/g, '<br>')}</p>
                         ${j.achievements ? `<p><span class="label">Pencapaian:</span><br>${j.achievements.replace(/\n/g, '<br>')}</p>` : ''}
                         ${j.notes ? `<p><span class="label">Catatan/Kendala:</span><br>${j.notes.replace(/\n/g, '<br>')}</p>` : ''}
                         ${j.tomorrowPlan ? `<p><span class="label">Rencana Besok:</span><br>${j.tomorrowPlan.replace(/\n/g, '<br>')}</p>` : ''}
                    </div>
                </div>
                `;
            });

            html += `
                <div class="footer">
                    Dicetak pada: ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();

            // Wait for resources to load then print
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                // printWindow.close(); // Optional: close after print
            }, 500);
        };

        const inventory = ref([]);
        const activeEffects = ref([]);
        const skills = computed(() => {
            const lvl = teacherData.level || 1;
            return [
                { id: 'xp_boost', name: 'Inspirasi', minLevel: 3, desc: 'Berikan 50 XP ke siswa', icon: 'lightbulb', type: 'xp', value: 50, color: 'yellow' },
                { id: 'hp_heal', name: 'Penyembuhan', minLevel: 5, desc: 'Pulihkan 20 HP siswa', icon: 'heart', type: 'hp', value: 20, color: 'green' },
                { id: 'hp_dmg', name: 'Hukuman', minLevel: 5, desc: 'Kurangi 20 HP siswa', icon: 'gavel', type: 'hp', value: -20, color: 'red' }
            ].map(s => ({ ...s, locked: lvl < s.minLevel }));
        });

        // --- Active Skill Logic ---
        const isSkillModalOpen = ref(false);
        const selectedSkill = ref(null);

        const openSkillModal = (skill) => {
            if (skill.locked) return;
            selectedSkill.value = skill;
            isSkillModalOpen.value = true;

            // If no class selected, prompt.
            if (!selectedClass.value) {
                // If we have classList, auto select first? No, let user choose.
                // We rely on the user having loaded students.
                // We can check if students are empty.
            }
        };

        const castSkillOnStudent = async (studentUid) => {
            if (!selectedSkill.value) return;
            const skill = selectedSkill.value;
            const studentRef = dbRef(db, `students/${studentUid}`); // FIXED: Use students node

            try {
                const snapshot = await get(studentRef);
                const student = snapshot.val();
                if (!student) return;

                let updates = {};
                let msg = "";

                if (skill.type === 'xp') {
                    const newXp = (student.xp || 0) + skill.value;
                    // Note: Full level up logic is complex to duplicate, simplified here.
                    updates = { xp: newXp };
                    msg = `Skill ${skill.name} berhasil! Siswa dapat ${skill.value} XP.`;
                } else if (skill.type === 'hp') {
                    let newHp = (student.hp || 0) + skill.value;
                    if (student.max_hp && newHp > student.max_hp) newHp = student.max_hp;
                    if (newHp < 0) newHp = 0;
                    updates = { hp: newHp };
                    msg = `Skill ${skill.name} berhasil! HP siswa ${skill.value > 0 ? '+' : ''}${skill.value}.`;
                }

                await update(studentRef, updates);
                alert(msg);
                isSkillModalOpen.value = false;
            } catch (error) {
                console.error("Skill cast failed", error);
                alert("Gagal menggunakan skill.");
            }
        };

        // --- Inventory & Effects Fetcher ---
        const fetchInventoryAndEffects = (uid) => {
            onValue(dbRef(db, `teachers/${uid}/inventory`), (snap) => {
                inventory.value = snap.val() ? Object.values(snap.val()) : [];
            });
            onValue(dbRef(db, `teachers/${uid}/active_effects`), (snap) => {
                activeEffects.value = snap.val() ? Object.values(snap.val()) : [];
            });
        };

        // --- Shop Logic ---
        const shopItems = ref([]);

        const fetchShopItems = () => {
            onValue(dbRef(db, 'shopItems'), (snap) => {
                if (snap.exists()) {
                    shopItems.value = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
                } else {
                    shopItems.value = [];
                }
            });
        };

        const buyItem = async (item) => {
            if ((teacherData.coin || 0) < item.price) {
                alert("Koin tidak cukup!"); return;
            }
            if ((item.stock || 0) <= 0) {
                alert("Stok Habis!"); return;
            }
            if (!confirm(`Beli ${item.name} seharga ${item.price} Coin?`)) return;

            try {
                // Deduct Coin
                const newCoin = (teacherData.coin || 0) - item.price;
                await update(dbRef(db, `teachers/${user.value.uid}`), { coin: newCoin });

                // Add to Inventory
                // Check if item exists to stack?
                // For simplicity, just add new entry with unique ID for now.
                // Teacher inventory structure: /inventory/ITEM_ID
                const newItemKey = Date.now().toString();

                await update(dbRef(db, `teachers/${user.value.uid}/inventory/${newItemKey}`), {
                    name: item.name,
                    description: item.description || '',
                    icon: item.imageBase64 || item.icon || '',
                    hp_bonus: item.hp_bonus || 0,
                    mp_bonus: item.mp_bonus || 0,
                    quantity: 1,
                    type: 'item'
                });

                // Decrease Stock in Shop
                const newStock = (item.stock || 0) - 1;
                await update(dbRef(db, `shopItems/${item.id}`), { stock: newStock });

                alert(`Berhasil membeli ${item.name}!`);
            } catch (e) {
                console.error(e);
                alert("Gagal membeli item.");
            }
        };

        const submitJournal = async () => {
            if (!journalForm.class || !journalForm.subject || !journalForm.tasks) {
                alert("Mohon lengkapi Kelas, Mapel, dan Uraian Tugas.");
                return;
            }

            try {
                const newJournal = {
                    author: user.value.uid,
                    createdAt: new Date().toISOString(),
                    ...journalForm
                };
                await push(dbRef(db, 'reflectionJournals'), newJournal);
                await submitGrind('journal'); // Award XP

                // Reset minimal fields
                journalForm.tasks = '';
                journalForm.achievements = '';
                journalForm.notes = '';
                journalForm.tomorrowPlan = '';
                journalForm.weather = '';
                journalForm.feeling = '';

                alert("✅ Jurnal Refleksi Berhasil Disimpan!");
            } catch (e) {
                console.error(e);
                alert("Gagal menyimpan jurnal");
            }
        };

        const submitGrind = async (type) => {
            if (!user.value) return;
            let xp = 0, coin = 0;
            if (type === 'journal') {
                // xp/coin handled by logic below
                xp = 10; coin = 5;
            }
            if (type === 'presence') { xp = 5; coin = 2; }

            const newXp = (teacherData.xp || 0) + xp;
            const newCoin = (teacherData.coin || 0) + coin;

            let level = teacherData.level;
            let max_xp = teacherData.max_xp;

            if (newXp >= max_xp) {
                level++;
                const adjustedXp = newXp - max_xp;
                max_xp = Math.floor(max_xp * 1.2);

                await update(dbRef(db, `teachers/${user.value.uid}`), {
                    xp: adjustedXp, coin: newCoin, level, max_xp
                });
                alert("🎉 Level Up!");
            } else {
                await update(dbRef(db, `teachers/${user.value.uid}`), {
                    xp: newXp, coin: newCoin
                });
            }
        };

        const castSpell = async (spell) => {
            if (teacherData.mp < 10) { alert("Not enough MP!"); return; }
            await update(dbRef(db, `teachers/${user.value.uid}`), {
                mp: teacherData.mp - 10
            });
            alert(`${spell} casted!`);
        };

        // --- Chat Logic ---
        const isTeacherChatOpen = ref(false);
        const chatRecipients = ref([]);
        const chatSearchQuery = ref('');
        const currentChatRecipient = ref(null);
        const currentChatMessages = ref([]);
        const chatInput = ref('');

        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            // If valid date
            if (isNaN(date.getTime())) return '';

            if (date.toDateString() === now.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        };

        const getCanonicalChatId = (uid1, uid2) => {
            return [uid1, uid2].sort().join('_');
        };

        const fetchChatRecipients = () => {
            // Fetch all students (Realtime)
            onValue(dbRef(db, 'students'), (snap) => {
                if (!snap.exists()) { chatRecipients.value = []; return; }
                const studentsData = snap.val();

                // Fetch My Notifications (Realtime)
                onValue(dbRef(db, `chatNotifications/${user.value.uid}`), (notifSnap) => {
                    const notifications = notifSnap.exists() ? notifSnap.val() : {};

                    // Transform to array
                    const list = Object.entries(studentsData).map(([uid, data]) => {
                        // Count unreads for this student
                        const unreadCount = Object.values(notifications).filter(n => n.senderId === uid && !n.read).length;
                        // Get last message info
                        const lastNotif = Object.values(notifications).filter(n => n.senderId === uid).sort((a, b) => b.timestamp - a.timestamp)[0];

                        return {
                            uid,
                            name: data.nama,
                            photoURL: data.photoURL,
                            role: `Lv.${data.level || 1} ${data.kelas || ''}`,
                            unreadCount: unreadCount,
                            lastMessage: lastNotif ? lastNotif.text : 'Klik untuk chat',
                            lastMessageTime: lastNotif ? lastNotif.timestamp : 0
                        };
                    });

                    // Sort by unread, then time
                    chatRecipients.value = list.sort((a, b) => {
                        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
                        return b.lastMessageTime - a.lastMessageTime;
                    });
                });
            });
        };

        const toggleTeacherChat = () => {
            isTeacherChatOpen.value = !isTeacherChatOpen.value;
        };

        const filteredChatRecipients = computed(() => {
            if (!chatSearchQuery.value) return chatRecipients.value;
            return chatRecipients.value.filter(r => r.name.toLowerCase().includes(chatSearchQuery.value.toLowerCase()));
        });

        const totalUnreadChats = computed(() => {
            return chatRecipients.value.reduce((sum, r) => sum + r.unreadCount, 0);
        });

        const selectChatRecipient = (recipient) => {
            currentChatRecipient.value = recipient;
            const chatId = getCanonicalChatId(user.value.uid, recipient.uid);

            // Listen to messages
            onValue(dbRef(db, `chats/${chatId}`), (snap) => {
                if (snap.exists()) {
                    const msgs = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
                    currentChatMessages.value = msgs.sort((a, b) => a.timestamp - b.timestamp);

                    // Mark as Read
                    msgs.forEach(msg => {
                        if (msg.recipientId === user.value.uid && !msg.read) {
                            update(dbRef(db, `chats/${chatId}/${msg.id}`), { read: true });
                            remove(dbRef(db, `chatNotifications/${user.value.uid}/${msg.id}`));
                        }
                    });
                } else {
                    currentChatMessages.value = [];
                }
                setTimeout(() => {
                    const container = document.getElementById('teacher-chat-messages');
                    if (container) container.scrollTop = container.scrollHeight;
                }, 100);
            });
        };

        const sendChatMessage = async () => {
            if (!chatInput.value.trim() || !currentChatRecipient.value) return;
            const text = chatInput.value.trim();
            chatInput.value = '';

            const recipientId = currentChatRecipient.value.uid;
            const chatId = getCanonicalChatId(user.value.uid, recipientId);

            const msgData = {
                senderId: user.value.uid,
                senderName: teacherData.name || 'Guru',
                recipientId: recipientId,
                text: text,
                timestamp: Date.now(),
                read: false,
                isFromTeacher: true
            };

            const msgKey = push(dbRef(db, `chats/${chatId}`)).key;
            await update(dbRef(db, `chats/${chatId}/${msgKey}`), msgData);
            await update(dbRef(db, `chatNotifications/${recipientId}/${msgKey}`), msgData);
        };

        const logout = async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Logout Error:", error);
                alert("Gagal logout: " + error.message);
            }
        };
        // --- Profile & Camera Logic ---
        const isProfileModalOpen = ref(false);
        const isCameraModalOpen = ref(false);
        const editForm = reactive({});
        const cameraStream = ref(null);
        const videoRef = ref(null);
        const canvasRef = ref(null);
        const photoPreview = ref(null);

        const openProfileModal = () => {
            Object.assign(editForm, JSON.parse(JSON.stringify(teacherData)));
            isProfileModalOpen.value = true;
        };

        const closeProfileModal = () => {
            isProfileModalOpen.value = false;
        };

        const saveProfile = async () => {
            try {
                // Map local state back to Firebase schema
                const updates = {
                    nama: editForm.name,
                    fotoProfilBase64: editForm.photoBase64,
                    niy: editForm.niy || '',
                    gender: editForm.gender || '',
                    dob: editForm.dob || '',
                    role_detail: editForm.role_detail || '',
                    phone: editForm.phone || '',
                    address: editForm.address || '',
                    avatar_seed: editForm.avatar_seed || null
                };

                await update(dbRef(db, `teachers/${user.value.uid}`), updates);
                // Object.assign(teacherData, editForm); // Listener will auto-update
                isProfileModalOpen.value = false;
                alert("Profil berhasil diperbarui!");
            } catch (e) {
                console.error(e);
                alert("Gagal menyimpan profil.");
            }
        };

        const regenerateAvatar = () => {
            editForm.avatar_seed = Math.random().toString(36).substring(7);
            editForm.photoBase64 = null;
        };

        const startCamera = async () => {
            isCameraModalOpen.value = true;
            photoPreview.value = null;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                cameraStream.value = stream;
                // Wait for next tick/render
                setTimeout(() => {
                    if (videoRef.value) {
                        videoRef.value.srcObject = stream;
                        videoRef.value.play();
                    }
                }, 100);
            } catch (err) {
                console.error(err);
                alert("Gagal akses kamera: " + err.message);
                isCameraModalOpen.value = false;
            }
        };

        const stopCamera = () => {
            if (cameraStream.value) {
                cameraStream.value.getTracks().forEach(track => track.stop());
                cameraStream.value = null;
            }
            isCameraModalOpen.value = false;
        };

        const takePhoto = () => {
            if (videoRef.value && canvasRef.value) {
                const context = canvasRef.value.getContext('2d');
                canvasRef.value.width = videoRef.value.videoWidth;
                canvasRef.value.height = videoRef.value.videoHeight;
                context.drawImage(videoRef.value, 0, 0);
                photoPreview.value = canvasRef.value.toDataURL('image/jpeg', 0.8);
            }
        };

        const retakePhoto = () => {
            photoPreview.value = null;
        };

        const savePhoto = () => {
            if (photoPreview.value) {
                editForm.photoBase64 = photoPreview.value;
                editForm.avatar_seed = null; // Clear seed
                stopCamera();
            }
        };

        // --- Bounty Board Logic ---
        const bounties = ref([]);
        const submissions = ref([]);
        const submissionFilter = reactive({
            search: '',
            status: 'all'
        });
        const printSettings = reactive({
            showPhoto: true,
            showName: true,
            showClass: true,
            showTitle: true,
            showDate: true,
            showLocation: true,
            showDescription: true
        });
        const bountyTab = ref('active');
        const isCreateBountyModalOpen = ref(false);
        const isSubmissionModalOpen = ref(false);
        const selectedSubmission = ref(null);

        const newBounty = reactive({
            title: '',
            type: 'general',
            category: '',
            description: '',
            rewardXP: 100,
            rewardCoin: 50,
            maxTakers: 30,
            deadline: '',
            imageUrl: null // New field for image
        });

        const handleBountyImageUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const max = 600; // Max dimension
                    let w = img.width;
                    let h = img.height;

                    if (w > h) {
                        if (w > max) { h *= max / w; w = max; }
                    } else {
                        if (h > max) { w *= max / h; h = max; }
                    }

                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    newBounty.imageUrl = canvas.toDataURL('image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        const fetchBounties = () => {
            onValue(dbRef(db, 'bounties'), (snap) => {
                if (snap.exists()) {
                    // Filter bounties created by this teacher or all?
                    // Let's show all active bounties for now, or maybe only ones created by THIS teacher if that's the requirement.
                    // The requirement implies "Guru bisa menambahkan", so likely they manage their own. 
                    // But shared bounty board is cool too. Let's show all but maybe highlight own.
                    // For simplicity, showing all.
                    const arr = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
                    bounties.value = arr.sort((a, b) => b.createdAt - a.createdAt);
                } else {
                    bounties.value = [];
                }
            });
        };

        const createBounty = async () => {
            if (!newBounty.title || !newBounty.description) {
                alert("Judul dan Deskripsi wajib diisi!"); return;
            }

            try {
                const bountyData = {
                    ...newBounty,
                    authorId: user.value.uid,
                    authorName: teacherData.name || 'Guru',
                    createdAt: Date.now(),
                    status: 'active',
                    imageUrl: newBounty.imageUrl || null, // Include image
                    takers: [] // List of student UIDs who took it (not used yet in this simple version, but good for future)
                };

                await push(dbRef(db, 'bounties'), bountyData);

                // Reset Form
                newBounty.title = '';
                newBounty.description = '';
                newBounty.category = '';
                newBounty.imageUrl = null; // Reset image
                isCreateBountyModalOpen.value = false;
                alert("Misi berhasil dibuat!");
            } catch (e) {
                console.error(e);
                alert("Gagal membuat misi.");
            }
        };

        const deleteBounty = async (bountyId) => {
            if (!confirm("Hapus misi ini?")) return;
            try {
                // Also optionally delete associated submissions? For now just the bounty.
                await remove(dbRef(db, `bounties/${bountyId}`));
            } catch (e) {
                console.error(e);
                alert("Gagal menghapus misi.");
            }
        };

        const fetchSubmissions = () => {
            onValue(dbRef(db, 'bountySubmissions'), (snap) => {
                if (snap.exists()) {
                    const arr = Object.entries(snap.val()).map(([id, val]) => {
                        const normalizedSubmission = {
                            id,
                            ...val,
                            studentUid: val.studentUid || val.studentId, // Ensure studentUid exists
                            // Normalize photo URL
                            photoURL: val.photoURL || val.photo || val.photoBase64 || val.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=Bukti+Tidak+Ada'
                        };

                        // Fallback for bountyTitle if missing
                        if (!normalizedSubmission.bountyTitle && normalizedSubmission.bountyId) {
                            const bounty = bounties.value.find(b => b.id === normalizedSubmission.bountyId);
                            if (bounty) normalizedSubmission.bountyTitle = bounty.title;
                        }

                        // Ensure locationURL and locationText exist if coordinates are available
                        const rawLat = val.lat || (val.location && val.location.lat);
                        const rawLng = val.long || val.lng || (val.location && (val.location.long || val.location.lng));

                        if (rawLat && rawLng && (!normalizedSubmission.locationURL || !normalizedSubmission.locationText)) {
                            const lat = parseFloat(rawLat);
                            const lng = parseFloat(rawLng);

                            if (!isNaN(lat) && !isNaN(lng)) {
                                if (!normalizedSubmission.locationText) {
                                    normalizedSubmission.locationText = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
                                }
                                if (!normalizedSubmission.locationURL) {
                                    normalizedSubmission.locationURL = `https://www.google.com/maps?q=${lat},${lng}`;
                                }
                            }
                        }

                        // Try to join student class if missing
                        if (!normalizedSubmission.studentClass) {
                            // We can use the 'students' state if it has the student, 
                            // but 'students' state only contains students for ONE selected class.
                            // Better to fetch all students once or rely on submission data.
                            // Let's assume for now submissions SHOULD have studentClass.
                            // However, let's add a check against the local 'students' ref just in case.
                            const student = students.value.find(st => st.uid === normalizedSubmission.studentUid);
                            if (student) normalizedSubmission.studentClass = student.kelas || student.class;
                        }

                        return normalizedSubmission;
                    });
                    submissions.value = arr.sort((a, b) => b.timestamp - a.timestamp);
                } else {
                    submissions.value = [];
                }
            });
        };

        const pendingSubmissionsCount = computed(() => {
            return submissions.value.filter(s => s.status === 'pending').length;
        });

        const filteredSubmissions = computed(() => {
            return submissions.value.filter(s => {
                const searchLower = submissionFilter.search.toLowerCase();
                const matchesSearch = !submissionFilter.search ||
                    (s.studentName && s.studentName.toLowerCase().includes(searchLower)) ||
                    (s.bountyTitle && s.bountyTitle.toLowerCase().includes(searchLower)) ||
                    (s.studentClass && s.studentClass.toLowerCase().includes(searchLower));

                const matchesStatus = submissionFilter.status === 'all' || s.status === submissionFilter.status;

                return matchesSearch && matchesStatus;
            });
        });

        const viewSubmissionImage = (submission) => {
            selectedSubmission.value = submission;
            isSubmissionModalOpen.value = true;
        };

        const approveSubmission = async (submission) => {
            if (!confirm("Setujui Submission ini? Siswa akan dapat hadiah.")) return;
            try {
                // 1. Update status
                await update(dbRef(db, `bountySubmissions/${submission.id}`), { status: 'approved' });

                // 2. Award Rewards to Student
                // Need to fetch bounty details first to know rewards, OR rely on what's in submission if we stored it there.
                // Better to fetch bounty to be safe/secure, or just trust the bounty snapshot if we have it in memory.
                // Let's look up the bounty from our local state `bounties`.
                const bounty = bounties.value.find(b => b.id === submission.bountyId);

                if (bounty) {
                    const sUid = submission.studentUid || submission.studentId;
                    const studentRef = dbRef(db, `students/${sUid}`);

                    const studentSnap = await get(studentRef);
                    if (studentSnap.exists()) {
                        const sData = studentSnap.val();
                        const currentXP = sData.xp || 0;
                        const currentCoin = sData.coin || 0;
                        const currentLevel = sData.level || 1;
                        const maxXP = sData.max_xp || 1000;

                        let newXP = currentXP + (bounty.rewardXP || 0);
                        let newCoin = currentCoin + (bounty.rewardCoin || 0);
                        let newLevel = currentLevel;
                        let newMaxXP = maxXP;

                        // Level Up Logic (Simple version)
                        if (newXP >= maxXP) {
                            newLevel++;
                            newXP = newXP - maxXP;
                            newMaxXP = Math.floor(maxXP * 1.2);
                        }

                        await update(studentRef, {
                            xp: newXP,
                            coin: newCoin,
                            level: newLevel,
                            max_xp: newMaxXP
                        });

                        // Notification for student
                        const notifRef = push(dbRef(db, `studentNotifications/${sUid}`));
                        await set(notifRef, {
                            title: "Misi Disetujui!",
                            message: `Selamat! Misi "${bounty.title}" telah disetujui. Kamu mendapatkan ${bounty.rewardXP} XP dan ${bounty.rewardCoin} Koin.`,
                            timestamp: Date.now(),
                            read: false,
                            type: 'bounty_approval'
                        });
                    }
                }

                isSubmissionModalOpen.value = false;
                alert("Submission disetujui!");

            } catch (e) {
                console.error(e);
                alert("Gagal menyetujui submission.");
            }
        };

        const rejectSubmission = async (submission) => {
            const reason = prompt("Masukkan alasan penolakan (opsional):");
            if (reason === null) return; // Cancelled

            try {
                const sUid = submission.studentUid || submission.studentId;

                // 1. Update submission status
                await update(dbRef(db, `bountySubmissions/${submission.id}`), {
                    status: 'rejected',
                    feedback: reason || 'Tidak ada alasan.'
                });

                // 2. Update Bounty Taker status
                if (submission.bountyId && sUid) {
                    await update(dbRef(db, `bounties/${submission.bountyId}/takers/${sUid}`), {
                        status: 'rejected'
                    });
                }

                // 3. Notify Student (Direct Firebase push)
                if (sUid) {
                    const notifRef = push(dbRef(db, `studentNotifications/${sUid}`));
                    await set(notifRef, {
                        title: "Misi Ditolak",
                        message: `Laporan misimu "${submission.bountyTitle || 'Misi'}" ditolak. Alasan: ${reason || 'Tidak memenuhi kriteria.'}`,
                        timestamp: Date.now(),
                        read: false,
                        type: 'bounty_rejected'
                    });
                }

                isSubmissionModalOpen.value = false;
                alert("Submission ditolak.");
            } catch (e) {
                console.error(e);
                alert("Gagal menolak submission: " + e.message);
            }
        };

        const toBase64 = url => fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));

        // Ganti fungsi exportToPDF di teacher.js

        const exportToPDF = (submission) => {
            if (!submission) return;

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert("Popup terblokir! Harap izinkan popup untuk mencetak laporan.");
                return;
            }

            const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; border: 2px solid #f1f5f9; padding: 40px; border-radius: 24px; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 30px; }
        .badge { display: flex; align-items: center; gap: 8px; color: #2563eb; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; }
        .student-photo { width: 100px; height: 100px; border-radius: 24px; object-fit: cover; border: 4px solid #f1f5f9; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9; }
        .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .value { font-weight: 700; font-size: 14px; }
        .mission-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 20px; border: 1px solid #bfdbfe; margin-bottom: 20px; }
        .proof-img { width: 80%; border-radius: 15px; margin-top: 10px; border: 1px solid #e2e8f0; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
        .signature { text-align: center; width: 200px; }
        @media print {
            body { padding: 0; }
            .container { border: none; }
            .no-print { display: none; }
        }
    `;

            const html = `
    <html>
        <head>
            <title>Laporan_Misi_${submission.studentName}</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <div class="badge">Verified Submission</div>
                        <h1 style="margin:0; font-size: 20px; font-weight: 900;">LAPORAN BUKTI MISI</h1>
                        <p style="margin:5px 0; color: #64748b;">Bounty Board • SMKMYCKB Gamification</p>
                    </div>
                    ${printSettings.showPhoto ? `<img src="${submission.studentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${submission.studentName}`}" class="student-photo">` : ''}
                </div>

                <div class="grid">
                    ${printSettings.showName ? `<div class="info-box"><div class="label">Nama Siswa</div><div class="value">${submission.studentName}</div></div>` : ''}
                    ${printSettings.showClass ? `<div class="info-box"><div class="label">Kelas</div><div class="value">${submission.studentClass}</div></div>` : ''}
                </div>

                ${printSettings.showTitle ? `<div class="mission-box"><div class="label" style="color:#3b82f6">Misi Yang Diselesaikan</div><div class="value" style="color:#1e40af; font-size: 14px;">${submission.bountyTitle}</div></div>` : ''}

                <div class="grid">
                    ${printSettings.showDate ? `<div><div class="label">Waktu Pengumpulan</div><div class="value">${submission.submitDate || ''} ${submission.submitTime || ''}</div></div>` : ''}
                    ${printSettings.showLocation ? `<div><div class="label">Lokasi</div><div class="value" style="color: #2563eb;">${submission.locationText || 'Kordinat Terlampir'}</div></div>` : ''}
                </div>

                
<div class="grid">
                <div style="margin-top: 20px;">
                    <div class="label">Foto Dokumentasi</div>
                    <img src="${submission.photoURL}" class="proof-img">
                </div>
${printSettings.showDescription ? `
                <div style="margin-top: 20px;">
                    <div class="label">Deskripsi Siswa</div>
                    <div style="padding: 15px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-style: italic;">"${submission.description || '-'}"</div>
                </div>` : ''}
                </div>
                <div class="footer">
                    <div>
                        <p>ID: ${submission.id.toUpperCase()}</p>
                        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                    </div>
                    <div class="signature">
                        <p style="margin-bottom: 60px;">Guru Pembimbing</p>
                        <p style="font-weight: 800; border-bottom: 1px solid #1e293b; display: inline-block; min-width: 150px;">${teacherData.name}</p>
                    </div>
                </div>
            </div>
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                        // window.close(); // Aktifkan jika ingin tab otomatis tertutup setelah print
                    }, 800);
                };
            <\/script>
        </body>
    </html>
    `;

            printWindow.document.write(html);
            printWindow.document.close();
        };

        const openCreateBountyModal = () => {
            isCreateBountyModalOpen.value = true;
        };

        const isPrintSettingsModalOpen = ref(false);
        const openPrintSettings = (submission) => {
            selectedSubmission.value = submission;
            isPrintSettingsModalOpen.value = true;
        };

        const printFilteredSubmissions = () => {
            if (filteredSubmissions.value.length === 0) {
                alert("Tidak ada data untuk dicetak.");
                return;
            }

            const element = document.createElement('div');
            element.style.padding = '40px';
            element.style.backgroundColor = 'white';
            element.style.fontFamily = "'Inter', sans-serif";

            let tableRows = filteredSubmissions.value.map((s, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px; font-size: 13px; color: #64748b;">${idx + 1}</td>
                    <td style="padding: 12px; font-size: 13px; font-weight: 700; color: #1e293b;">${s.studentName}</td>
                    <td style="padding: 12px; font-size: 13px; color: #64748b;">${s.studentClass || '-'}</td>
                    <td style="padding: 12px; font-size: 13px; font-weight: 600; color: #2563eb;">${s.bountyTitle}</td>
                    <td style="padding: 12px; font-size: 13px; color: #64748b;">${s.submitDate || ''}</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${s.status === 'approved' ? 'background: #dcfce7; color: #166534;' :
                    s.status === 'rejected' ? 'background: #fee2e2; color: #991b1b;' :
                        'background: #fef9c3; color: #854d0e;'
                }">
                            ${s.status === 'approved' ? 'Disetujui' : s.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                    </td>
                </tr>
            `).join('');

            element.innerHTML = `
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
                        <div>
                            <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0;">REKAPITULASI BUKTI MISI</h1>
                            <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">Filter: ${submissionFilter.search || 'Semua'} | Status: ${submissionFilter.status}</p>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #94a3b8;">
                            <p style="margin: 0; font-weight: 700;">${teacherData.name}</p>
                            <p style="margin: 0;">${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">#</th>
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Nama Siswa</th>
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Kelas</th>
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Judul Misi</th>
                                <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Tanggal</th>
                                <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>

                    <div style="margin-top: 50px; text-align: right; color: #94a3b8; font-size: 11px;">
                        <p>Total Submission: ${filteredSubmissions.value.length}</p>
                        <p>Dicetak secara otomatis melalui Sistem Gamifikasi SMKMYCKB</p>
                    </div>
                </div>
            `;

            const opt = {
                margin: 10,
                filename: `Rekap_Bounty_${new Date().getTime()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(element).set(opt).save();
        };

        return {
            user, teacherData, currentTab, navItems,
            isMobile, isSidebarOpen, isDreamyOpen,
            firstName, currentDate,
            logout,
            // Attendance
            classList, students, selectedClass, selectedDate,
            fetchStudents, attendanceUpdates, updateStatus, saveAttendance, loadingStudents,
            // Grind
            journalForm, submitJournal, submitGrind,
            journalFilter, filteredJournals, deleteJournal, printJournals,
            castSpell, quickStats,
            // Inventory, Effects, Skills
            inventory, activeEffects, skills, shopItems, buyItem,
            isSkillModalOpen, selectedSkill, openSkillModal, castSkillOnStudent,
            // Profile & Camera
            isProfileModalOpen, isCameraModalOpen, editForm,
            openProfileModal, closeProfileModal, saveProfile, regenerateAvatar,
            startCamera, stopCamera, takePhoto, retakePhoto, savePhoto,
            videoRef, canvasRef, photoPreview,
            // Chat
            isTeacherChatOpen, toggleTeacherChat, chatRecipients, chatSearchQuery,
            filteredChatRecipients, totalUnreadChats, selectChatRecipient,
            currentChatRecipient, currentChatMessages, chatInput, sendChatMessage, formatTime,
            // Bounty
            bounties, submissions, bountyTab, isCreateBountyModalOpen, newBounty,
            createBounty, deleteBounty, pendingSubmissionsCount,
            viewSubmissionImage, isSubmissionModalOpen, selectedSubmission,
            approveSubmission, rejectSubmission, openCreateBountyModal,
            handleBountyImageUpload, exportToPDF,
            submissionFilter, filteredSubmissions, printSettings,
            isPrintSettingsModalOpen, openPrintSettings, printFilteredSubmissions
        };
    }
});

// --- Components ---

appVue.component('stat-card', {
    props: ['label', 'icon', 'color', 'value', 'max', 'unit'],
    template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md">
        <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ label }}</span>
            <div :class="\`w-8 h-8 rounded-full bg-\${color}-50 text-\${color}-500 flex items-center justify-center\`">
                <i :class="\`fas fa-\${icon}\`"></i>
            </div>
        </div>
        <div>
            <div class="text-xl font-bold text-slate-800">{{ value }} <span class="text-xs text-slate-400 font-normal">/ {{ max }} {{ unit }}</span></div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div :class="\`bg-\${color}-500 h-full rounded-full transition-all duration-1000\`" :style="\`width: \${(value/max)*100}%\`"></div>
            </div>
        </div>
    </div>
    `
});

appVue.component('quest-card', {
    props: ['title', 'reward', 'color', 'icon'],
    template: `
    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <div :class="\`p-2 rounded-lg bg-\${color}-50 text-\${color}-600\`">
                    <i :class="\`fas fa-\${icon}\`"></i>
                </div>
                <h3 class="font-bold text-slate-800">{{ title }}</h3>
            </div>
            <span :class="\`text-xs font-bold px-2 py-1 rounded-full bg-\${color}-100 text-\${color}-700\`">{{ reward }}</span>
        </div>
        <div class="mt-4">
            <slot name="action"></slot>
        </div>
    </div>
    `
});

appVue.component('spell-card', {
    props: ['name', 'desc', 'color', 'locked'],
    template: `
    <div class="relative overflow-hidden p-5 rounded-xl border border-slate-100 transition-all bg-white hover:shadow-md">
        <div class="flex justify-between items-center relative z-10">
            <div>
                <h4 class="font-bold text-slate-800">{{ name }}</h4>
                <p class="text-xs text-slate-500">{{ desc }}</p>
            </div>
            <button @click="$emit('cast')" :disabled="locked" 
                    :class="locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : \`bg-\${color}-600 hover:bg-\${color}-700 text-white shadow-lg shadow-\${color}-500/30\`"
                    class="px-4 py-2 rounded-lg text-xs font-bold transition-all">
                {{ locked ? 'Locked' : 'Cast Spell' }}
            </button>
        </div>
    </div>
    `
});

appVue.mount('#app');
