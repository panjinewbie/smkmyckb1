// Firebase Presence Logic for Student Online/Offline Status
// This script should be imported in student.html or wherever students are logged in
import { getDatabase, ref, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userStatusDatabaseRef = ref(db, `/students/${user.uid}/presence`);
    const connectedRef = ref(db, ".info/connected");
    import("https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js").then(({ onValue }) => {
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Set online
          set(userStatusDatabaseRef, true);
          // Remove on disconnect
          onDisconnect(userStatusDatabaseRef).set(false);
        }
      });
    });
  }
});
