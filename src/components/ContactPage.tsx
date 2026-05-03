import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { getSupabaseClient } from '../supabaseClient';

export const ContactPage: React.FC = () => {
  const { getToken, userId } = useAuth();
  const { user, isSignedIn } = useUser(); 

  // --- STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [botField, setBotField] = useState(''); // The Honeypot
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Auto-fill name and email ONLY if the user is securely logged in
  useEffect(() => {
    if (isSignedIn && user) {
      setName(user.fullName || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
    }
  }, [isSignedIn, user]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // HONEYPOT TRAP: If a bot fills this, fake a success message
    if (botField) {
      showToast('Message sent to Dr. Chouit successfully!', 'success');
      return;
    }

    if (!message.trim() || !name.trim() || !email.trim()) return;
    
    setIsSubmitting(true);

    try {
      // Secure token if logged in, empty string for public guests
      let token = '';
      if (userId) {
        token = (await getToken({ template: 'supabase' })) || '';
      }
      
      const supabase = getSupabaseClient(token);

      const { error } = await supabase.from('contact_messages').insert([
        {
          name: name,
          email: email,
          message: message,
          user_id: userId || null, // Links to profile if logged in, otherwise null
        }
      ]);

      if (error) throw error;

      showToast('Message sent to Dr. Chouit successfully!', 'success');
      setMessage(''); 
      
      // Only clear the name/email if they are a guest
      if (!isSignedIn) {
        setName('');
        setEmail('');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeInDown 0.3s ease-out', maxWidth: '800px', margin: '40px auto', padding: '0 20px', position: 'relative' }}>
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444', color: '#ffffff', padding: '16px 32px', borderRadius: '9999px', fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9998, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.text}
        </div>
      )}

      <div className="soft-card" style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '48px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '2.4rem', color: '#0F172A', fontWeight: '800', letterSpacing: '-0.5px' }}>Contact Instructor</h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0, lineHeight: '1.6' }}>Have a question about a recent lesson or your grades?<br/>Send a direct message to Dr. Chouit.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* THE HONEYPOT - Hidden from humans using CSS */}
          <div style={{ position: 'absolute', opacity: 0, top: '-9999px', left: '-9999px' }} aria-hidden="true">
            <label>Website URL</label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={botField} onChange={(e) => setBotField(e.target.value)} />
          </div>

          {/* DYNAMIC USER INFO (Locks if logged in, Editable if guest) */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!!isSignedIn} 
                placeholder="Jane Doe"
                required
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F1F5F9', backgroundColor: isSignedIn ? '#F8FAFC' : '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => { if (!isSignedIn) e.target.style.borderColor = '#4F46E5'; }}
                onBlur={(e) => e.target.style.borderColor = '#F1F5F9'}
              />
            </div>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!isSignedIn} 
                placeholder="jane@example.com"
                required
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F1F5F9', backgroundColor: isSignedIn ? '#F8FAFC' : '#0F172A', color: isSignedIn ? '#475569' : '#0F172A', backgroundColor: isSignedIn ? '#F8FAFC' : '#ffffff', fontSize: '1.05rem', outline: 'none', transition: 'border-color 0.2s' }} 
                onFocus={(e) => { if (!isSignedIn) e.target.style.borderColor = '#4F46E5'; }}
                onBlur={(e) => e.target.style.borderColor = '#F1F5F9'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Your Message</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="How can I help you today?" 
              rows={6}
              required
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #E2E8F0', backgroundColor: '#ffffff', color: '#0F172A', fontSize: '1.05rem', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !message.trim() || !name.trim() || !email.trim()}
            style={{ marginTop: '10px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '1.15rem', cursor: (isSubmitting || !message.trim() || !name.trim() || !email.trim()) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: (isSubmitting || !message.trim() || !name.trim() || !email.trim()) ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
            {!isSubmitting && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
          </button>
        </form>

      </div>
    </div>
  );
};