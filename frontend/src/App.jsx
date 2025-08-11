import React, { useState, useEffect, useRef } from 'react';
import './App.css';


const API_BASE = 'http://localhost:5001';

// Adding some basic error handling and logging to ensure 
// API calls are working correctly
// This will help in debugging if the backend is not reachable
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }

    console.log(`Making ${method} request to ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

//Basic style built using chatgpt 
//SCOPE: can be moved to app.css and can be imported to this file
const styles = {
  app: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '10px',
    borderBottom: '2px solid #ddd'
  },
  button: {
    padding: '8px 16px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '400px',
    margin: '0 auto'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minHeight: '100px'
  },
  sessionCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px 0',
    backgroundColor: '#f9f9f9'
  },
  error: {
    color: 'red',
    margin: '10px 0'
  },
  success: {
    color: 'green',
    margin: '10px 0'
  }
};

function App() {
  /* To keep track of user after auth: */
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  /*To persist sessions : */
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [currentSession, setCurrentSession] = useState({ title: '', tags: '', json_file_url: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    // Testing th API connection
    const testConnection = async () => {
      try {
        await fetch(`${API_BASE}/`);
        console.log('✅ Backend connection successful');
      } catch (err) {
        console.error('❌ Backend connection failed:', err);
        setError('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
      }
    };
    
    testConnection();
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchSessions();
    }
  }, []);


  const handleAuth = async (isLogin) => {
    try {
      setError('');
      const endpoint = isLogin ? '/login' : '/register';
      const data = await apiCall(endpoint, 'POST', authForm);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm({ email: '', password: '' });
      fetchSessions();
      setCurrentPage('dashboard');
      setSuccess(`Successfully ${isLogin ? 'logged in' : 'registered'}!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('auth');
    setSessions([]);
    setMySessions([]);
  };

  const fetchSessions = async () => {
    try {
      const data = await apiCall('/sessions');
      setSessions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMySessions = async () => {
    try {
      const data = await apiCall('/my-sessions');
      setMySessions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentSession(prev => ({ ...prev, [field]: value }));
    
    // Auto-save after 5 seconds of inactivity
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      if (currentSession.title.trim()) {
        saveDraft();
      }
    }, 5000);
  };

  const saveDraft = async () => {
    try {
      setError('');
      const data = await apiCall('/my-sessions/save-draft', 'POST', {
        id: editingId,
        ...currentSession
      });
      setEditingId(data._id);
      setSuccess('Draft saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const publishSession = async () => {
    try {
      setError('');
      await apiCall('/my-sessions/publish', 'POST', {
        id: editingId,
        ...currentSession
      });
      setSuccess('Session published!');
      setCurrentSession({ title: '', tags: '', json_file_url: '' });
      setEditingId(null);
      fetchSessions();
      setCurrentPage('dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const editSession = (session) => {
    setCurrentSession({
      title: session.title,
      tags: session.tags.join(', '),
      json_file_url: session.json_file_url || ''
    });
    setEditingId(session._id);
    setCurrentPage('editor');
  };

  const newSession = () => {
    setCurrentSession({ title: '', tags: '', json_file_url: '' });
    setEditingId(null);
    setCurrentPage('editor');
  };

  if (!user) {
    return (
      <div style={styles.app}>
        <h1>Wellness Session Platform</h1>
        <div style={styles.form}>
          <h2>Login / Register</h2>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
          />
          
          <div>
            <button style={styles.button} onClick={() => handleAuth(true)}>
              Login
            </button>
            <button style={styles.button} onClick={() => handleAuth(false)}>
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <h1>Wellness Sessions</h1>
        <div>
          <span>Welcome, {user.email}</span>
          <button 
            style={styles.button} 
            onClick={() => { setCurrentPage('dashboard'); fetchSessions(); }}
          >
            Dashboard
          </button>
          <button 
            style={styles.button} 
            onClick={() => { setCurrentPage('my-sessions'); fetchMySessions(); }}
          >
            My Sessions
          </button>
          <button style={styles.button} onClick={newSession}>
            New Session
          </button>
          <button style={styles.button} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {currentPage === 'dashboard' && (
        <div>
          <h2>Published Sessions</h2>
          {sessions.length === 0 ? (
            <p>No published sessions yet.</p>
          ) : (
            sessions.map(session => (
              <div key={session._id} style={styles.sessionCard}>
                <h3>{session.title}</h3>
                <p><strong>Tags:</strong> {session.tags.join(', ')}</p>
                {session.json_file_url && (
                  <p><strong>JSON URL:</strong> <a href={session.json_file_url} target="_blank" rel="noopener noreferrer">{session.json_file_url}</a></p>
                )}
                <p><small>By: {session.user_id?.email} | Created: {new Date(session.created_at).toLocaleDateString()}</small></p>
              </div>
            ))
          )}
        </div>
      )}

      {currentPage === 'my-sessions' && (
        <div>
          <h2>My Sessions</h2>
          {mySessions.length === 0 ? (
            <p>You haven't created any sessions yet.</p>
          ) : (
            mySessions.map(session => (
              <div key={session._id} style={styles.sessionCard}>
                <h3>{session.title}</h3>
                <p><strong>Status:</strong> {session.status}</p>
                <p><strong>Tags:</strong> {session.tags.join(', ')}</p>
                {session.json_file_url && (
                  <p><strong>JSON URL:</strong> <a href={session.json_file_url} target="_blank" rel="noopener noreferrer">{session.json_file_url}</a></p>
                )}
                <p><small>Updated: {new Date(session.updated_at).toLocaleDateString()}</small></p>
                <button style={styles.button} onClick={() => editSession(session)}>
                  Edit
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {currentPage === 'editor' && (
        <div>
          <h2>Session Editor</h2>
          <div style={styles.form}>
            <input
              style={styles.input}
              type="text"
              placeholder="Session Title"
              value={currentSession.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
            
            <input
              style={styles.input}
              type="text"
              placeholder="Tags (comma separated)"
              value={currentSession.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
            
            <input
              style={styles.input}
              type="url"
              placeholder="JSON File URL (optional)"
              value={currentSession.json_file_url}
              onChange={(e) => handleInputChange('json_file_url', e.target.value)}
            />
            
            <div>
              <button style={styles.button} onClick={saveDraft}>
                Save Draft
              </button>
              <button style={styles.button} onClick={publishSession}>
                Publish
              </button>
              <button 
                style={styles.button} 
                onClick={() => setCurrentPage('my-sessions')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;