import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getT } from '../i18n/index';
import toast from 'react-hot-toast';

// ── Multilingual knowledge base ──────────────────────────────
function buildKB(lang) {
  const t = getT(lang);
  return [
    {
      keys: ['register','sign up','create account','பதிவு','नमोदु','నమోదు','രജിസ്','ನೋಂದ'],
      answer: lang === 'ta' ? 'CharityOrg-ல் பதிவு செய்ய:\n1. "பதிவு செய்" என்பதை கிளிக் செய்யுங்கள்\n2. உங்கள் பெயர், மின்னஞ்சல் மற்றும் கடவுச்சொல்லை நிரப்புங்கள்\n3. 6-இலக்க OTP ஐ உங்கள் மின்னஞ்சலில் பெறுவீர்கள்\n4. OTP ஐ உள்ளிட்டு கணக்கை செயல்படுத்துங்கள் 🎉'
        : lang === 'hi' ? 'CharityOrg में रजिस्टर करने के लिए:\n1. "पंजीकरण" पर क्लिक करें\n2. अपना नाम, ईमेल और पासवर्ड भरें\n3. 6-अंकीय OTP आपके ईमेल पर आएगा\n4. OTP दर्ज करें और खाता सक्रिय करें 🎉'
        : 'To register on CharityOrg:\n1. Click "Register"\n2. Fill in your Name, Email and Password\n3. You\'ll receive a 6-digit OTP on your email\n4. Enter OTP to verify and activate your account 🎉\n\nPassword must be 8+ chars with upper, lower, digit & special character.',
      action: { label: lang === 'ta' ? 'பதிவு பக்கத்திற்கு →' : lang === 'hi' ? 'पंजीकरण पर जाएं →' : 'Go to Register →', path: '/register' }
    },
    {
      keys: ['login','sign in','உள்நுழைவு','लॉगिन','లాగిన్','ലോഗിൻ','ಲಾಗಿನ್'],
      answer: lang === 'ta' ? 'உள்நுழைய:\n1. உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடுங்கள்\n2. "உள்நுழைக" என்பதை கிளிக் செய்யுங்கள்\n\nகடவுச்சொல் மறந்தீர்களா? "கடவுச்சொல் மறந்தீர்களா?" என்பதை கிளிக் செய்யுங்கள்.'
        : lang === 'hi' ? 'लॉगिन करने के लिए:\n1. अपना ईमेल और पासवर्ड दर्ज करें\n2. "साइन इन" पर क्लिक करें\n\nपासवर्ड भूल गए? "पासवर्ड भूल गए?" पर क्लिक करें।'
        : 'To log in:\n1. Enter your Email and Password\n2. Click "Sign In"\n\nForgot password? Click "Forgot password?" on the login page.',
      action: { label: lang === 'ta' ? 'உள்நுழைவுக்கு →' : lang === 'hi' ? 'लॉगिन पर जाएं →' : 'Go to Login →', path: '/login' }
    },
    {
      keys: ['donate','donation','நன்கொடை','दान','విరాళం','സംഭാവന','ದೇಣಿಗೆ'],
      answer: lang === 'ta' ? 'நன்கொடை செய்வது எப்படி:\n1. டாஷ்போர்டில் உள்நுழைந்து செயல்பாட்டு பிரச்சாரங்களை உலாவுங்கள்\n2. "நன்கொடை 💜" என்பதை கிளிக் செய்யுங்கள்\n3. தொகையை தேர்ந்தெடுங்கள் (குறைந்தது ₹10)\n4. கட்டண முறையை தேர்ந்தெடுங்கள்\n5. ரசீதை உடனடியாக பெறுங்கள்!\n\nஅனைத்து நன்கொடைகளும் 80G வரி விலக்கிற்கு தகுதியானவை.'
        : lang === 'hi' ? 'दान कैसे करें:\n1. डैशबोर्ड में लॉगिन करें और सक्रिय अभियान देखें\n2. "दान करें 💜" पर क्लिक करें\n3. राशि चुनें (न्यूनतम ₹10)\n4. भुगतान विधि चुनें\n5. तुरंत रसीद पाएं!\n\nसभी दान 80G कर छूट के लिए पात्र हैं।'
        : 'How to donate:\n1. Login to Dashboard and browse active campaigns\n2. Click "Donate 💜" on any campaign\n3. Choose amount (minimum ₹10)\n4. Select payment method (UPI, Card, Net Banking)\n5. Get receipt instantly!\n\nAll donations qualify for 80G tax exemption.',
      action: { label: lang === 'ta' ? 'பிரச்சாரங்களை காண →' : lang === 'hi' ? 'अभियान देखें →' : 'Browse Campaigns →', path: '/campaigns' }
    },
    {
      keys: ['campaign','பிரச்சார','अभियान','ప్రచారం','കാമ്പെ','ಅಭಿಯಾನ'],
      answer: lang === 'ta' ? 'நாங்கள் பல வகை பிரச்சாரங்களை நடத்துகிறோம்:\n💧 தண்ணீர் & சுகாதாரம்\n📚 கல்வி\n🏥 சுகாதார சேவை\n🍱 உணவு & ஊட்டச்சத்து\n🌱 சுற்றுச்சூழல்\n\nஒவ்வொரு பிரச்சாரமும் இலக்கு, திரட்டப்பட்ட தொகை மற்றும் தாக்கத்தை காட்டுகிறது.'
        : lang === 'hi' ? 'हम कई प्रकार के अभियान चलाते हैं:\n💧 पानी और स्वच्छता\n📚 शिक्षा\n🏥 स्वास्थ्य सेवा\n🍱 भोजन और पोषण\n🌱 पर्यावरण\n\nप्रत्येक अभियान लक्ष्य, जुटाई गई राशि और प्रभाव दिखाता है।'
        : 'We run campaigns across categories:\n💧 Water & Sanitation\n📚 Education\n🏥 Healthcare\n🍱 Food & Nutrition\n🌱 Environment\n\nEach campaign shows its goal, amount raised, urgency level, and impact.',
      action: { label: lang === 'ta' ? 'பிரச்சாரங்களை காண →' : lang === 'hi' ? 'अभियान देखें →' : 'View Campaigns →', path: '/campaigns' }
    },
    {
      keys: ['receipt','tax','80g','ரசீது','रसीद','రసీదు','രസീതി','ರಶೀದಿ'],
      answer: lang === 'ta' ? 'வெற்றிகரமான நன்கொடைக்கு பிறகு:\n• உடனடியாக ரசீது உருவாகிறது\n• உங்கள் மின்னஞ்சலுக்கு உறுதிப்படுத்தல் அனுப்பப்படும்\n• அனைத்து நன்கொடைகளும் 80G வரி விலக்கிற்கு தகுதியானவை\n• "என் நன்கொடைகள்" பகுதியில் அனைத்து ரசீதுகளையும் காணலாம்'
        : lang === 'hi' ? 'सफल दान के बाद:\n• तुरंत रसीद उत्पन्न होती है\n• आपके ईमेल पर पुष्टि भेजी जाती है\n• सभी दान 80G कर छूट के पात्र हैं\n• "मेरे दान" में सभी रसीदें देखें'
        : 'After a successful donation:\n• Receipt is generated instantly\n• Confirmation sent to your email\n• All donations qualify for 80G tax deduction\n• View all receipts under My Donations'
    },
    {
      keys: ['monthly','subscription','மாதாந்திர','मासिक','నెలవారీ','മാസ','ಮಾಸಿಕ'],
      answer: lang === 'ta' ? 'மாதாந்திர நன்கொடை:\n🔄 தானியங்கி மாதாந்திர கட்டணங்கள்\n⏰ நன்கொடைக்கு முன் நினைவூட்டல் மின்னஞ்சல்கள்\n📋 தானியங்கி ரசீதுகள்\n⏸ எப்போதும் நிறுத்தலாம் அல்லது ரத்து செய்யலாம்\n\nடாஷ்போர்டிலிருந்து "மாதாந்திர நன்கொடை" என்பதை கிளிக் செய்யுங்கள்.'
        : lang === 'hi' ? 'मासिक दान के लाभ:\n🔄 स्वचालित मासिक भुगतान\n⏰ दान से पहले रिमाइंडर ईमेल\n📋 स्वचालित रसीदें\n⏸ कभी भी रोकें या रद्द करें\n\nडैशबोर्ड से "मासिक दान" पर जाएं।'
        : 'Monthly Giving benefits:\n🔄 Automatic monthly payments\n⏰ Reminder emails before donation\n📋 Automatic receipts\n⏸ Pause or cancel anytime\n\nGo to Dashboard → Monthly Giving to set up.'
    },
    {
      keys: ['secure','safe','password','பாதுகாப்பு','सुरक्षा','భద్రత','സുരക്ഷ','ಭದ್ರತೆ'],
      answer: lang === 'ta' ? 'CharityOrg பாதுகாப்பு:\n🔒 BCrypt கடவுச்சொல் குறியாக்கம்\n🛡️ JWT அங்கீகாரம்\n📧 மின்னஞ்சல் OTP சரிபார்ப்பு\n🔐 5 தவறான முயற்சிகளுக்கு பிறகு கணக்கு பூட்டல்\n🌐 அனைத்து தகவல்தொடர்புகளுக்கும் HTTPS'
        : lang === 'hi' ? 'CharityOrg सुरक्षा:\n🔒 BCrypt पासवर्ड एन्क्रिप्शन\n🛡️ JWT प्रमाणीकरण\n📧 ईमेल OTP सत्यापन\n🔐 5 विफल प्रयासों के बाद खाता लॉक\n🌐 सभी संचार के लिए HTTPS'
        : 'CharityOrg Security:\n🔒 BCrypt password encryption\n🛡️ JWT authentication\n📧 Email OTP verification\n🔐 Account lockout after 5 failed attempts\n🌐 HTTPS for all communications'
    },
    {
      keys: ['hello','hi','hey','வணக்கம்','नमस्ते','నమస్కారం','നമസ്കാരം','ನಮಸ್ಕಾರ','hii','hai'],
      answer: lang === 'ta' ? 'வணக்கம்! 👋 நான் CharityBot.\n\nநான் உங்களுக்கு இவற்றில் உதவலாம்:\n📝 பதிவு & உள்நுழைவு\n💜 நன்கொடை செய்வது\n🎯 பிரச்சார தகவல்\n📋 நன்கொடை வரலாறு\n🔐 கணக்கு பாதுகாப்பு\n\nஎன்ன அறிய விரும்புகிறீர்கள்?'
        : lang === 'hi' ? 'नमस्ते! 👋 मैं CharityBot हूं।\n\nमैं आपकी इन विषयों में मदद कर सकता हूं:\n📝 पंजीकरण और लॉगिन\n💜 दान करना\n🎯 अभियान जानकारी\n📋 दान इतिहास\n🔐 खाता सुरक्षा\n\nआप क्या जानना चाहते हैं?'
        : 'Hello! 👋 I\'m CharityBot.\n\nI can help you with:\n📝 Registration & Login\n💜 Making donations\n🎯 Campaign information\n📋 Donation history & receipts\n🔐 Account security\n\nWhat would you like to know?'
    },
    {
      keys: ['thank','thanks','நன்றி','धन्यवाद','ధన్యవాదాలు','നന്ദി','ಧನ್ಯವಾದ'],
      answer: lang === 'ta' ? 'நன்றி! 💜 உங்கள் ஆதரவிற்கு மிக்க நன்றி!\n\nவேறு ஏதாவது உதவி தேவையா?'
        : lang === 'hi' ? 'धन्यवाद! 💜 आपके समर्थन के लिए बहुत आभार!\n\nक्या और कोई सहायता चाहिए?'
        : "You're welcome! 💜 Thank you for your support!\n\nIs there anything else I can help you with?"
    },
    {
      keys: ['contact','support','help','தொடர்பு','संपर्क','సంప్రదించండి','ബന്ധ','ಸಂಪರ್ಕ'],
      answer: lang === 'ta' ? 'ஆதரவு தகவல்:\n📧 மின்னஞ்சல்: newdawnfoundationtrust@gmail.com\n📞 தொலைபேசி: +91 98765 43210\n🕐 நேரம்: திங்கள்-வெள்ளி, காலை 9 - மாலை 6\n\nதொடர்பு பக்கத்திலும் நுழையலாம்.'
        : lang === 'hi' ? 'सहायता जानकारी:\n📧 ईमेल: newdawnfoundationtrust@gmail.com\n📞 फोन: +91 98765 43210\n🕐 समय: सोमवार-शुक्रवार, सुबह 9 - शाम 6\n\nसंपर्क पृष्ठ पर भी जा सकते हैं।'
        : 'Support information:\n📧 Email: newdawnfoundationtrust@gmail.com\n📞 Phone: +91 98765 43210\n🕐 Hours: Mon-Fri, 9am-6pm IST\n\nOr visit our Contact page.',
      action: { label: lang === 'ta' ? 'தொடர்பு பக்கம் →' : lang === 'hi' ? 'संपर्क पृष्ठ →' : 'Contact Page →', path: '/contact' }
    },
  ];
}

function getResponse(input, lang) {
  const text = input.toLowerCase().trim();
  const kb = buildKB(lang);
  for (const item of kb) {
    if (item.keys.some(k => text.includes(k.toLowerCase()))) {
      return { answer: item.answer, action: item.action };
    }
  }
  const fallback = lang === 'ta'
    ? 'மன்னிக்கவும், அந்த கேள்விக்கு பதில் இல்லை. நாங்கள் இவற்றில் உதவலாம்:\n\n• பதிவு & உள்நுழைவு\n• நன்கொடை செய்வது\n• பிரச்சார தகவல்\n• கணக்கு பாதுகாப்பு\n\nஆதரவிற்கு: newdawnfoundationtrust@gmail.com 💜'
    : lang === 'hi'
    ? 'माफ़ करें, मुझे इस प्रश्न का उत्तर नहीं पता। मैं इनमें मदद कर सकता हूं:\n\n• पंजीकरण और लॉगिन\n• दान करना\n• अभियान जानकारी\n• खाता सुरक्षा\n\nसहायता के लिए: newdawnfoundationtrust@gmail.com 💜'
    : lang === 'te'
    ? 'క్షమించండి, నాకు ఆ ప్రశ్నకు సమాధానం తెలియదు. నేను సహాయం చేయగలిగేవి:\n\n• నమోదు & లాగిన్\n• విరాళం ఇవ్వడం\n• ప్రచార సమాచారం\n• ఖాతా భద్రత\n\nనమ్మకమైన: newdawnfoundationtrust@gmail.com 💜'
    : lang === 'ml'
    ? 'ക്ഷമിക്കൂ, ആ ചോദ്യത്തിന് ഉത്തരം ഇല്ല. ഞാൻ ഇവ സഹായിക്കാം:\n\n• രജിസ്ട്രേഷൻ & ലോഗിൻ\n• സംഭാവന ചെയ്യൽ\n• കാമ്പെയ്ൻ വിവരം\n• അക്കൗണ്ട് സുരക്ഷ\n\nബന്ധം: newdawnfoundationtrust@gmail.com 💜'
    : lang === 'kn'
    ? 'ಕ್ಷಮಿಸಿ, ಆ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಇಲ್ಲ. ನಾನು ಸಹಾಯ ಮಾಡಬಹುದಾದದ್ದು:\n\n• ನೋಂದಣಿ & ಲಾಗಿನ್\n• ದೇಣಿಗೆ ನೀಡುವುದು\n• ಅಭಿಯಾನ ಮಾಹಿತಿ\n• ಖಾತೆ ಭದ್ರತೆ\n\nಸಂಪರ್ಕ: newdawnfoundationtrust@gmail.com 💜'
    : "I'm not sure about that. Here are things I can help with:\n\n• Registration & Login\n• Making donations\n• Campaign information\n• Account security\n\nContact: newdawnfoundationtrust@gmail.com 💜";
  return { answer: fallback, action: null };
}

/* ── Page context-aware responses ─────────────────────────── */
const PAGE_CONTEXT = {
  '/':           { key: 'home' },
  '/campaigns':  { key: 'campaigns' },
  '/about':      { key: 'about' },
  '/contact':    { key: 'contact' },
  '/login':      { key: 'login' },
  '/register':   { key: 'register' },
  '/user':       { key: 'dashboard' },
  '/user/donations': { key: 'donations' },
  '/user/profile':   { key: 'profile' },
  '/user/subscription': { key: 'subscription' },
};

function getPageGreeting(page, lang) {
  const ctx = Object.entries(PAGE_CONTEXT).find(([path]) => page.startsWith(path))?.[1]?.key || 'general';
  const greetings = {
    home:         { en:'👋 Welcome to New Dawn Foundation! How can I help you today?', ta:'👋 நியூ டான் ஃபவுண்டேஷனுக்கு வரவேற்கிறோம்! இன்று எவ்வாறு உதவலாம்?', hi:'👋 न्यू डॉन फाउंडेशन में स्वागत है! आज कैसे मदद करूं?', te:'👋 న్యూ డాన్ ఫౌండేషన్‌కు స్వాగతం! ఈరోజు ఎలా సహాయం చేయగలను?', ml:'👋 ന്യൂ ഡോൺ ഫൗണ്ടേഷനിലേക്ക് സ്വാഗതം! ഇന്ന് എങ്ങനെ സഹായിക്കാം?', kn:'👋 ನ್ಯೂ ಡಾನ್ ಫೌಂಡೇಶನ್‌ಗೆ ಸ್ವಾಗತ! ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' },
    campaigns:    { en:'🎯 You\'re on the Campaigns page! I can help you find the right cause to support.', ta:'🎯 நீங்கள் பிரச்சாரங்கள் பக்கத்தில் இருக்கிறீர்கள்! சரியான காரணத்தை கண்டுபிடிக்க உதவலாம்.', hi:'🎯 आप अभियान पृष्ठ पर हैं! सही कारण खोजने में मदद कर सकता हूं।', te:'🎯 మీరు ప్రచారాల పేజీలో ఉన్నారు! సరైన కారణం కనుగొనడంలో సహాయం చేయగలను.', ml:'🎯 നിങ്ങൾ കാമ്പെയ്‌ൻ പേജിലാണ്! ശരിയായ കാരണം കണ്ടെത്താൻ സഹായിക്കാം.', kn:'🎯 ನೀವು ಅಭಿಯಾನ ಪುಟದಲ್ಲಿದ್ದೀರಿ! ಸರಿಯಾದ ಕಾರಣ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.' },
    dashboard:    { en:'📊 You\'re in your Dashboard! I can help you track donations, manage your plan, or find campaigns.', ta:'📊 நீங்கள் டாஷ்போர்டில் இருக்கிறீர்கள்! நன்கொடைகளை கண்காணிக்க உதவலாம்.', hi:'📊 आप डैशबोर्ड में हैं! दान ट्रैक करने में मदद कर सकता हूं।', te:'📊 మీరు డాష్‌బోర్డ్‌లో ఉన్నారు! విరాళాలు ట్రాక్ చేయడంలో సహాయం చేయగలను.', ml:'📊 നിങ്ങൾ ഡാഷ്‌ബോർഡിലാണ്! സംഭാവനകൾ ട്രാക്ക് ചെയ്യാൻ സഹായിക്കാം.', kn:'📊 ನೀವು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿದ್ದೀರಿ! ದೇಣಿಗೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.' },
    login:        { en:'🔐 On the Login page. Need help signing in or reset your password?', ta:'🔐 உள்நுழைவு பக்கத்தில் இருக்கிறீர்கள். உள்நுழைவதில் உதவி வேண்டுமா?', hi:'🔐 लॉगिन पृष्ठ पर हैं। साइन इन करने में मदद चाहिए?', te:'🔐 లాగిన్ పేజీలో ఉన్నారు. సైన్ ఇన్ చేయడంలో సహాయం కావాలా?', ml:'🔐 ലോഗിൻ പേജിലാണ്. സൈൻ ഇൻ ചെയ്യുന്നതിൽ സഹായം വേണോ?', kn:'🔐 ಲಾಗಿನ್ ಪುಟದಲ್ಲಿದ್ದೀರಿ. ಸೈನ್ ಇನ್ ಮಾಡಲು ಸಹಾಯ ಬೇಕೇ?' },
    register:     { en:'📝 Ready to join us! I can guide you through the registration process.', ta:'📝 எங்களுடன் சேர தயார்! பதிவு செயல்முறை வழியாக வழிநடத்துகிறேன்.', hi:'📝 हमारे साथ जुड़ने के लिए तैयार! पंजीकरण में मार्गदर्शन करूंगा।', te:'📝 మాతో చేరడానికి సిద్ధంగా ఉన్నారు! నమోదు ప్రక్రియలో మార్గనిర్దేశం చేస్తాను.', ml:'📝 ഞങ്ങളോടൊപ്പം ചേരാൻ തയ്യാർ! രജിസ്ട്രേഷൻ ഗൈഡ് ചെയ്യാം.', kn:'📝 ನಮ್ಮೊಂದಿಗೆ ಸೇರಲು ಸಿದ್ಧರಾಗಿದ್ದೀರಿ! ನೋಂದಣಿ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ.' },
    profile:      { en:'👤 You\'re on your Profile page. Need help updating your info or changing password?', ta:'👤 சுயவிவர பக்கத்தில் இருக்கிறீர்கள். தகவல் புதுப்பிக்க உதவி வேண்டுமா?', hi:'👤 प्रोफ़ाइल पृष्ठ पर हैं। जानकारी अपडेट करने में मदद चाहिए?', te:'👤 ప్రొఫైల్ పేజీలో ఉన్నారు. సమాచారం నవీకరించడంలో సహాయం కావాలా?', ml:'👤 പ്രൊഫൈൽ പേജിലാണ്. വിവരം അപ്‌ഡേറ്റ് ചെയ്യാൻ സഹായം വേണോ?', kn:'👤 ಪ್ರೊಫೈಲ್ ಪುಟದಲ್ಲಿದ್ದೀರಿ. ಮಾಹಿತಿ ನವೀಕರಿಸಲು ಸಹಾಯ ಬೇಕೇ?' },
    subscription: { en:'📅 On your Subscription page! I can explain Monthly Giving or help you manage your plan.', ta:'📅 சந்தா பக்கத்தில் இருக்கிறீர்கள்! மாதாந்திர நன்கொடை பற்றி விளக்கலாம்.', hi:'📅 सदस्यता पृष्ठ पर हैं! मासिक दान के बारे में बता सकता हूं।', te:'📅 సబ్‌స్క్రిప్షన్ పేజీలో ఉన్నారు! నెలవారీ విరాళం గురించి వివరించగలను.', ml:'📅 സബ്‌സ്ക്രിപ്ഷൻ പേജിലാണ്! മാസ സംഭാവനയെക്കുറിച്ച് വിശദീകരിക്കാം.', kn:'📅 ಸಬ್‌ಸ್ಕ್ರಿಪ್ಶನ್ ಪುಟದಲ್ಲಿದ್ದೀರಿ! ಮಾಸಿಕ ದೇಣಿಗೆ ವಿವರಿಸಬಲ್ಲೆ.' },
    general:      { en:'👋 Hi! I\'m CharityBot. How can I help you today?', ta:'👋 வணக்கம்! நான் CharityBot. இன்று எவ்வாறு உதவலாம்?', hi:'👋 नमस्ते! मैं CharityBot हूं। आज कैसे मदद करूं?', te:'👋 నమస్కారం! నేను CharityBot. ఈరోజు ఎలా సహాయం చేయగలను?', ml:'👋 നമസ്കാരം! ഞാൻ CharityBot. ഇന്ന് എങ്ങനെ സഹായിക്കാം?', kn:'👋 ನಮಸ್ಕಾರ! ನಾನು CharityBot. ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' },
  };
  const pool = greetings[ctx] || greetings.general;
  return pool[lang] || pool.en;
}

function getContextualResponse(input, lang, page) {
  const text = input.toLowerCase().trim();
  // Check if user is asking about the current page
  const pageCtxKey = Object.entries(PAGE_CONTEXT).find(([path]) => page.startsWith(path))?.[1]?.key || 'general';
  const pageKeywords = {
    home:         ['this page','home page','home','what is this','முகப்பு','होम','హోమ్','ഹോം','ಹೋಮ್'],
    campaigns:    ['campaign','this page','what are these','பிரச்சாரம்','अभियान','ప్రచారం','കാമ്പെ','ಅಭಿಯಾನ'],
    dashboard:    ['dashboard','my page','what is this','டாஷ்','डैशबोर्ड','డాష్','ഡാഷ്','ಡ್ಯಾಶ್'],
    profile:      ['profile','my profile','சுயவிவரம்','प्रोफ़ाइल','ప్రొఫైల్','പ്രൊഫൈൽ','ಪ್ರೊಫೈಲ್'],
    subscription: ['subscription','monthly','plan','சந்தா','सदस्यता','సబ్స్క్రిప్షన్','സബ്‌സ്ക്രിപ്ഷൻ','ಸಬ್‌ಸ್ಕ್ರಿಪ್ಶನ್'],
  };
  const isAskingAboutPage = (pageKeywords[pageCtxKey]||[]).some(k => text.includes(k));
  if (isAskingAboutPage) {
    return { answer: getPageGreeting(page, lang), action: null };
  }
  return getResponse(input, lang);
}

export default function Chatbot() {
  const { user }  = useAuth();
  const { lang, t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const prevLang  = useRef(lang);
  const recognitionRef = useRef(null);

  // Web Speech API language codes
  const SPEECH_LANG_MAP = {
    en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN',
    te: 'te-IN', ml: 'ml-IN', kn: 'kn-IN',
  };

  // Check voice support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Start / stop voice listening
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser. Try Chrome.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = SPEECH_LANG_MAP[lang] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      // Auto-send after a short delay so user can see what was recognised
      setTimeout(() => {
        setInput('');
        setMsgs(p => [...p, { from: 'user', text: transcript }]);
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          const { answer, action } = getContextualResponse(transcript, lang, currentPage);
          setMsgs(p => [...p, { from: 'bot', text: answer, action }]);
        }, 500 + Math.random() * 400);
      }, 800);
    };

    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else if (e.error === 'no-speech') {
        toast('No speech detected. Try again.', { icon: '🎤' });
      }
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // Current page context for context-aware responses
  const currentPage = location.pathname;

  // Reset greeting when language changes — use page context
  useEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang;
      const greeting = getPageGreeting(currentPage, lang);
      setMsgs([{ from: 'bot', text: greeting }]);
    }
  }, [lang, currentPage]);

  // Initial greeting with page context
  useEffect(() => {
    const greeting = getPageGreeting(currentPage, lang);
    setMsgs([{ from: 'bot', text: greeting }]);
  }, []); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback((text = input) => {
    const msg = text.trim();
    if (!msg) return;
    setInput('');
    setMsgs(p => [...p, { from: 'user', text: msg }]);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      // Pass current page for context-aware response
      const { answer, action } = getContextualResponse(msg, lang, currentPage);
      setMsgs(p => [...p, { from: 'bot', text: answer, action }]);
    }, 500 + Math.random() * 400);
  }, [input, lang, currentPage]);

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = t('chatbot.suggestions') || ['How to register?', 'How to donate?', 'Payment methods', 'Is it secure?'];

  return (
    <>
      {/* FAB */}
      <button className="chatbot-fab" onClick={() => setOpen(p => !p)} aria-label="Open chatbot"
        style={{ transform: open ? 'scale(1.1) rotate(15deg)' : 'scale(1)' }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t('chatbot.title') || 'CharityBot'}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{t('chatbot.online') || '● Online'}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: 0.8 }}>
              ✕
            </button>
          </div>

          {/* Language + Page indicator */}
          <div style={{ padding: '6px 14px', background: 'rgba(108,60,232,0.15)', borderBottom: '1px solid rgba(108,60,232,0.2)', fontSize: 11, color: 'var(--primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🌐 {
              lang === 'ta' ? 'தமிழ்' :
              lang === 'hi' ? 'हिन्दी' :
              lang === 'te' ? 'తెలుగు' :
              lang === 'ml' ? 'മലയാളം' :
              lang === 'kn' ? 'ಕನ್ನಡ' : 'English'
            }</span>
            <span style={{ opacity:0.7, fontSize:10 }}>📍 {
              currentPage === '/' ? (lang==='ta'?'முகப்பு':lang==='hi'?'होम':lang==='te'?'హోమ్':lang==='ml'?'ഹോം':lang==='kn'?'ಹೋಮ್':'Home') :
              currentPage.startsWith('/campaigns') ? (lang==='ta'?'பிரச்சாரங்கள்':lang==='hi'?'अभियान':lang==='te'?'ప్రచారాలు':lang==='ml'?'കാമ്പെയ്‌നുകൾ':lang==='kn'?'ಅಭಿಯಾನಗಳು':'Campaigns') :
              currentPage.startsWith('/user/donations') ? (lang==='ta'?'நன்கொடைகள்':lang==='hi'?'दान':'Donations') :
              currentPage.startsWith('/user/subscription') ? (lang==='ta'?'சந்தா':lang==='hi'?'सदस्यता':'Subscription') :
              currentPage.startsWith('/user/profile') ? (lang==='ta'?'சுயவிவரம்':lang==='hi'?'प्रोफ़ाइल':'Profile') :
              currentPage.startsWith('/user') ? (lang==='ta'?'டாஷ்போர்டு':lang==='hi'?'डैशबोर्ड':'Dashboard') :
              currentPage.startsWith('/about') ? (lang==='ta'?'பற்றி':lang==='hi'?'हमारे बारे में':'About') :
              currentPage.startsWith('/contact') ? (lang==='ta'?'தொடர்பு':lang==='hi'?'संपर्क':'Contact') :
              'Page'
            }</span>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {msgs.map((m, i) => (
              <div key={i}>
                <div className={`chat-msg ${m.from}`} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                {m.action && (
                  <button onClick={() => { navigate(m.action.path); setOpen(false); }}
                    style={{ alignSelf: 'flex-start', marginTop: 6, background: 'rgba(108,60,232,0.15)', border: '1px solid rgba(108,60,232,0.4)', color: 'var(--primary-light)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {m.action.label}
                  </button>
                )}
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary-light)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 2 && Array.isArray(suggestions) && (
            <div style={{ padding: '0 10px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ background: 'rgba(108,60,232,0.12)', border: '1px solid rgba(108,60,232,0.3)', color: 'var(--primary-light)', borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening
                ? (lang==='ta'?'கேட்கிறேன்…':lang==='hi'?'सुन रहा हूं…':lang==='te'?'వింటున్నాను…':lang==='ml'?'കേൾക്കുന്നു…':lang==='kn'?'ಕೇಳುತ್ತಿದ್ದೇನೆ…':'Listening…')
                : (t('chatbot.placeholder') || 'Ask me anything…')}
              maxLength={200}
              style={{ background: listening ? 'rgba(239,68,68,0.08)' : undefined,
                       borderColor: listening ? 'rgba(239,68,68,0.4)' : undefined }}
            />
            {/* Voice input button */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={listening ? 'Stop listening' : `Voice input (${SPEECH_LANG_MAP[lang] || 'en-IN'})`}
                style={{
                  background: listening
                    ? 'linear-gradient(135deg,#ef4444,#f87171)'
                    : 'rgba(255,255,255,0.08)',
                  border: listening ? 'none' : '1px solid rgba(167,139,250,0.25)',
                  color: listening ? '#fff' : 'var(--text-muted)',
                  borderRadius: 8, padding: '0 10px', cursor: 'pointer',
                  fontSize: 16, flexShrink: 0,
                  animation: listening ? 'voicePulse 1s ease infinite' : 'none',
                  transition: 'all 0.2s',
                }}
                aria-label="Voice input"
              >
                {listening ? '⏹' : '🎤'}
              </button>
            )}
            <button onClick={() => send()} disabled={!input.trim() || listening}>➤</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:1} }
        @keyframes voicePulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
      `}</style>
    </>
  );
}
