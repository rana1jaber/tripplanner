/* =========================================================
   TripPlanner — settings
   =========================================================
   FIREBASE_URL: the link of your Firebase Realtime Database.
   With it, everyone who opens the invite link is added for all members
   and votes, comments and expenses update live.
   Left empty (''), the site still works, but each person only sees
   what is saved on their own device.

   How to get it (about 5 minutes):
   1. https://console.firebase.google.com → Create a project.
   2. Build → Realtime Database → Create Database.
   3. Copy the link shown at the top and paste it below between the quotes.
   4. Rules tab → paste the contents of firebase-rules.json → Publish.
   ========================================================= */
const FIREBASE_URL = 'https://tripplanner-cb08f-default-rtdb.asia-southeast1.firebasedatabase.app/';
