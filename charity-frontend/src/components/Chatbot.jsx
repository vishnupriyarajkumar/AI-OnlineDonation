import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Knowledge base ────────────────────────────────────────────
const KB = [
  {
    keys: ['register','sign up','create account','new account'],
    answer: `To register on CharityOrg:\n1. Click "Register" in the top right\n2. Fill in your Full Name, Email, and Password\n3. You'll receive a 6-digit OTP on your email\n4. Enter the OTP to verify your account\n5. You're in! 🎉\n\nPassword must be 8+ chars with uppercase, lowercase, digit and special character.`
  },
  {
    keys: ['login','sign in','log in','cannot login','cant login'],
    answer: `To log in:\n1. Click "Login" or go to /login\n2. Enter your registered email and password\n3. Click Sign In\n\nAfter account verification, no OTP is needed for future logins.\n\nForgot password? Click "Forgot password?" on the login page.`
  },
  {
    keys: ['otp','verification','verify','code','6 digit'],
    answer: `OTP (One-Time Password) is required only once — when you first create your account.\n\n• Check your inbox (and spam folder)\n• OTP expires in 5 minutes\n• You can resend after 30 seconds\n• Maximum 3 attempts allowed\n\nAfter successful verification, you never need OTP again for login.`
  },
  {
    keys: ['donate','donation','how to donate','make donation','contribute'],
    answer: `How to donate:\n1. Login to your account\n2. Go to your Dashboard\n3. Browse active campaigns\n4. Click "Donate 💜" on any campaign\n5. Choose an amount (minimum ₹10)\n6. Select payment method (UPI, Card, Net Banking)\n7. Complete payment\n8. Get your receipt instantly!\n\nAll donations are 80G tax-exempt.`
  },
  {
    keys: ['campaign','campaigns','cause','project'],
    answer: `We run multiple campaigns across categories:\n• 💧 Water & Sanitation\n• 📚 Education\n• 🏥 Healthcare\n• 🍱 Food & Nutrition\n• 🌱 Environment\n\nEach campaign shows its goal, amount raised, urgency level, and days remaining. You can filter by category on the dashboard.`
  },
  {
    keys: ['receipt','tax','80g','certificate','proof'],
    answer: `After a successful donation:\n• A receipt is generated immediately\n• Receipt number is shown on screen\n• You'll receive a confirmation email\n• All donations qualify for 80G tax deduction\n• View all receipts under My Donations → History tab`
  },
  {
    keys: ['profile','account','update','change','personal'],
    answer: `To manage your profile:\n1. Click "Profile" in your dashboard\n2. Update your name, phone, or address\n3. Click Save\n\nFor password changes, use the "Forgot password?" link on the login page.`
  },
  {
    keys: ['history','my donations','past donation','previous'],
    answer: `To view your donation history:\n1. Login to your account\n2. Go to Dashboard\n3. Click the "📋 My Donations" tab\n4. See all donations with status and receipt numbers`
  },
  {
    keys: ['password','forgot','reset','change password'],
    answer: `To reset your password:\n1. Go to the Login page\n2. Click "Forgot password?"\n3. Enter your registered email\n4. Check your inbox for the reset link\n5. Set a new password\n\nPassword requirements: 8+ chars, uppercase, lowercase, digit & special character.`
  },
  {
    keys: ['safe','secure','security','trust','privacy'],
    answer: `CharityOrg uses industry-standard security:\n🔒 BCrypt password encryption\n🛡️ JWT token authentication\n📧 Email OTP verification\n🔐 Account lockout after 5 failed attempts\n🌐 HTTPS for all communications\n\nYour personal and payment data is never stored without encryption.`
  },
  {
    keys: ['payment','razorpay','upi','card','net banking','fail'],
    answer: `We support multiple payment methods:\n📱 UPI (PhonePe, GPay, etc.)\n💳 Credit/Debit Card\n🏧 Debit Card\n🏦 Net Banking\n\nPayments are processed securely through Razorpay.\nIf payment fails, no amount is deducted. Try again or use a different method.`
  },
  {
    keys: ['admin','manage','dashboard','control'],
    answer: `The Admin panel (/admin) is for administrators only.\n\nAdmin can:\n• Manage all users\n• Create, edit, approve, delete campaigns\n• View all donations\n• Monitor all user activities\n• Allocate funds\n• View audit logs and reports\n\nAdmin credentials: admin@charityorg.com / Admin@1234`
  },
  {
    keys: ['contact','help','support','problem','issue','question'],
    answer: `Need more help?\n\n📧 Email: support@charityorg.com\n📞 Phone: +91 98765 43210\n🌐 Visit: /contact\n\nOr keep chatting — I'm here to help with any questions about our platform! 💜`
  },
  {
    keys: ['hello','hi','hey','namaste','good morning','good evening','hii'],
    answer: `Hello! 👋 Welcome to CharityOrg! \n\nI'm your assistant. I can help you with:\n• 📝 Registration & Login\n• 💜 Making donations\n• 🎯 Campaign information\n• 📋 Donation history & receipts\n• 🔐 Account security\n\nWhat would you like to know?`
  },
  {
    keys: ['thank','thanks','thank you','awesome','great','perfect'],
    answer: `You're welcome! 💜 \n\nIs there anything else I can help you with? Together we can make a difference!`
  },
  {
    keys: ['anonymous','hide name','private donation'],
    answer: `Yes! You can donate anonymously:\n1. On the donation page, check "Donate anonymously"\n2. Your name won't appear on public donor lists\n3. You'll still receive the tax receipt to your email\n4. The donation will show as "Anonymous" to others`
  },
  {
    keys: ['minimum','maximum','amount','how much','limit'],
    answer: `Donation amounts:\n• Minimum: ₹10\n• No maximum limit\n• Quick amounts: ₹100, ₹500, ₹1000, ₹5000, ₹10000\n• Or enter any custom amount\n\nEvery rupee makes a difference! 💜`
  },
];

function getResponse(input) {
  const text = input.toLowerCase().trim();
  for (const item of KB) {
    if (item.keys.some(k => text.includes(k))) return item.answer;
  }
  return `I'm not sure about that specific question. Here are things I can help with:\n\n• Registration & Login\n• Making donations\n• Campaign information\n• Donation history & receipts\n• Account security & password reset\n• Payment methods\n\nOr contact us at support@charityorg.com 💜`;
}

const SUGGESTIONS = ['How to register?', 'How to donate?', 'View my donations', 'Payment methods', 'Is it secure?'];

export default function Chatbot() {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([
    { from:'bot', text:'Hi! 👋 I\'m CharityBot. How can I help you today?\n\nTry asking about registration, donations, campaigns, or security.' }
  ]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = (text = input) => {
    const msg = text.trim();
    if (!msg) return;
    setInput('');
    setMsgs(p => [...p, { from:'user', text:msg }]);
    setTyping(true);

    // Check for navigation intent
    const lower = msg.toLowerCase();
    setTimeout(() => {
      setTyping(false);
      let reply = getResponse(msg);

      // Add quick action buttons for navigation
      let action = null;
      if (lower.includes('register') || lower.includes('sign up')) action = { label:'Go to Register →', path:'/register' };
      else if (lower.includes('login') || lower.includes('sign in')) action = { label:'Go to Login →', path:'/login' };
      else if (lower.includes('campaign')) action = { label:'Browse Campaigns →', path:'/campaigns' };
      else if (lower.includes('donate')) action = user ? { label:'Go to Dashboard →', path:'/user' } : { label:'Login to Donate →', path:'/login' };
      else if (lower.includes('contact')) action = { label:'Contact Page →', path:'/contact' };

      setMsgs(p => [...p, { from:'bot', text:reply, action }]);
    }, 600 + Math.random() * 400);
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {/* FAB button */}
      <button className="chatbot-fab" onClick={() => setOpen(p => !p)} aria-label="Open chatbot"
        style={{ transform: open ? 'scale(1.1) rotate(15deg)' : 'scale(1)' }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window" style={{ animation:'fadeUp 0.25s ease' }}>
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>CharityBot</div>
                <div style={{ fontSize:11, opacity:0.8 }}>● Online — here to help</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:18, opacity:0.8, padding:4 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {msgs.map((m, i) => (
              <div key={i}>
                <div className={`chat-msg ${m.from}`}>{m.text}</div>
                {m.action && (
                  <button onClick={() => { navigate(m.action.path); setOpen(false); }}
                    style={{
                      alignSelf: 'flex-start', marginTop:4,
                      background:'rgba(108,60,232,0.15)', border:'1px solid rgba(108,60,232,0.4)',
                      color:'var(--primary-light)', borderRadius:99, padding:'5px 14px',
                      fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(108,60,232,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(108,60,232,0.15)'}>
                    {m.action.label}
                  </button>
                )}
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot" style={{ display:'flex', gap:5, alignItems:'center', padding:'10px 14px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--primary-light)', animation:`pulse 1.2s ease ${i*0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {msgs.length <= 2 && (
            <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ background:'rgba(108,60,232,0.12)', border:'1px solid rgba(108,60,232,0.3)', color:'var(--primary-light)', borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              maxLength={200}
            />
            <button onClick={() => send()} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:1} }
      `}</style>
    </>
  );
}
