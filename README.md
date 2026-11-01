# Kuri (ചിട്ടി) Management Web Application - MERN Stack

ഒരു സമ്പൂർണ്ണ കുറി (Chit Fund) മാനേജ്മെന്റ് സിസ്റ്റം.

## 🚀 പ്രധാന സവിശേഷതകൾ (Features)

1. **Authentication & Group Creation**:
   - യൂസർ രജിസ്ട്രേഷൻ & ലോഗിൻ (JWT & bcryptjs).
   - ആർക്കും ഒരു പുതിയ കുറി ഗ്രൂപ്പ് നിർമ്മിക്കാം (ക്രിയേറ്റ് ചെയ്യുന്നയാൾ അഡ്മിൻ ആകുന്നു).

2. **Member Addition & Unique 3-Digit Number & Auto-Email (Nodemailer)**:
   - അഡ്മിന് പുതിയ മെമ്പർമാരെ ചേർക്കാം.
   - ഓരോരുത്തർക്കും ഒരു **യൂണീക് 3-അക്ക കുറി നമ്പർ** (ഉദാ: 101, 102...) സിസ്റ്റം ഓട്ടോമാറ്റിക് ആയി ജനറേറ്റ് ചെയ്യുന്നു.
   - മെമ്പറെ ചേർക്കുന്ന ഉടനെ Nodemailer വഴി അവരുടെ ഇമെയിലിലേക്ക് സ്വാഗത സന്ദേശവും കുറി നമ്പറും അയക്കുന്നു.

3. **Payment Request & Admin Approval**:
   - മെമ്പർമാർക്ക് **Cash** അല്ലെങ്കിൽ **UPI** വഴി തുക അടച്ചശേഷം ട്രാൻസാക്ഷൻ ഐഡി സഹിതം ആപ്പിൽ പെയ്മെന്റ് റിക്വസ്റ്റ് സമർപ്പിക്കാം.
   - അഡ്മിൻ്റെ ഡാഷ്ബോർഡിൽ ഈ റിക്വസ്റ്റുകൾ കാണാനും പരിശോധിച്ച് **'Approve'** അല്ലെങ്കിൽ **'Reject'** ചെയ്യാനും സാധിക്കും.

4. **Draw (നറുക്കെടുപ്പ്) & Animated Spinning Wheel UI**:
   - Framer Motion ഉപയോഗിച്ച് നിർമ്മിച്ച അതിമനോഹരമായ **Spinning Wheel**.
   - **ഇതുവരെ കുറി ലഭിക്കാത്ത മെമ്പർമാരുടെ 3-അക്ക നമ്പറുകൾ മാത്രമേ വീലിൽ ഉൾപ്പെടൂ.**
   - സ്പിൻ ചെയ്യുമ്പോൾ ബാക്കെൻഡിൽ റാൻഡം ആയി വിജയിയെ തെരഞ്ഞെടുക്കുകയും, വീൽ കൃത്യമായി ആ നമ്പറിലേക്ക് ലാൻഡ് ചെയ്യുകയും ചെയ്യും.

5. **Winner Notification Email**:
   - വിജയിയെ കണ്ടെത്തിയ ഉടനെ Nodemailer വഴി വിജയിയുടെ ഇമെയിലിലേക്ക് അഭിനന്ദന സന്ദേശവും സമ്മാനത്തുക വിവരങ്ങളും അടങ്ങിയ ഇമെയിൽ തത്സമയം പോകുന്നു.

---

## 🛠️ ഇൻസ്റ്റാളേഷൻ & റൺ ചെയ്യേണ്ട വിധം

### 1. ബാക്കെൻഡ് സെറ്റപ്പ് (Backend)
```bash
cd backend
npm install
```

`backend/.env` ഫയൽ ക്രമീകരിക്കുക:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kuri_management
JWT_SECRET=your_jwt_secret_key

# Nodemailer ക്രമീകരണം (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

റൺ ചെയ്യുക:
```bash
npm run dev
# അല്ലെങ്കിൽ: npm start
```

### 2. ഫ്രണ്ട്എൻഡ് സെറ്റപ്പ് (Frontend)
```bash
cd ../frontend
npm install
npm run dev
```
ബ്രൗസറിൽ `http://localhost:3000` സന്ദർശിക്കുക.
