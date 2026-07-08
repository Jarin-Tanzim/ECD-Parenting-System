import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Check your .env file.');
  }

  return new GoogleGenAI({ apiKey });
}

function extractAgeInfo(message) {
  const text = message.toLowerCase();

  const monthMatch = text.match(/(\d+)\s*(month|months|mo)/);
  if (monthMatch) return `${monthMatch[1]} months old`;

  const yearMatch = text.match(/(\d+)\s*(year|years|yr|yrs)/);
  if (yearMatch) return `${Number(yearMatch[1]) * 12} months old`;

  return null;
}

function createSessionTitle(text) {
  if (!text) return 'New Parenting Chat';
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

function buildChildContext(selectedChild, latestCheck) {
  if (!selectedChild) {
    return 'No child profile is currently selected.';
  }

  let context = `
Selected child profile:
- Name: ${selectedChild.childName}
- Age: ${selectedChild.ageMonths} months
- Gender: ${selectedChild.gender || 'Not specified'}
`;

  if (latestCheck) {
    context += `
Latest development check:
- Score: ${latestCheck.score}%
- Weakest category: ${latestCheck.weakestCategory}
- Feedback: ${latestCheck.feedback}
- Suggested activities: ${
      latestCheck.suggestedActivities?.join('; ') || 'No activities saved'
    }
`;
  } else {
    context += `
Latest development check:
- No saved development check found yet.
`;
  }

  return context;
}

async function getAIResponse(userQuestion, selectedChild, latestCheck, messages) {
  const ai = getGeminiClient();
  const typedAge = extractAgeInfo(userQuestion);
  const childContext = buildChildContext(selectedChild, latestCheck);

  const recentConversation = messages
    .slice(-8)
    .map((message) => `${message.sender}: ${message.text}`)
    .join('\n');

  const prompt = `
You are a safe Early Childhood Development parenting assistant for an app called ECD Parenting System.

User question:
"${userQuestion}"

Age mentioned in the current question:
${typedAge || 'No age mentioned in current question'}

App child context:
${childContext}

Recent conversation:
${recentConversation || 'No previous conversation'}

Rules:
- Use the selected child profile age when the user does not mention a different age.
- If the user mentions a different child or different age, answer using that mentioned age.
- Do not diagnose autism, ADHD, speech delay, cerebral palsy, or any medical condition.
- Do not say the child is delayed.
- Do not say the child definitely has a disorder.
- Do not give emergency medical advice.
- If the parent is concerned, recommend consulting a pediatrician or child development specialist.
- Answer based on the child's age when age is available.
- Use simple parent-friendly language.
- Keep the answer under 180 words.
- Include 2 to 3 practical home activities when helpful.
- If latest development check data is available, use it to personalize the answer.
- If the question is outside parenting, early learning, child development, hygiene, nutrition, safety, or Islamic parenting, politely say you can only help with parenting and child development topics.

Milestone reminders:
- 0 to 3 months: real words and walking are not expected. Early skills include cooing, reacting to voices, looking at faces, moving arms and legs, and brief head lifting during tummy time.
- 4 to 6 months: head control, rolling, reaching, laughing, and sound play may appear.
- 7 to 12 months: sitting, crawling/scooting, babbling, peekaboo, and object exploration may appear.
- 13 to 18 months: standing with support, early walking, simple words, clapping, waving, and placing objects in containers may appear.
- 19 to 24 months: walking, simple instructions, more words, pretend play, and stacking may appear.
- 25 to 36 months: running, climbing, short sentences, sorting, scribbling, and social play may appear.

Now answer safely.
`;

  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.log(`Gemini model failed: ${model}`, error);
      lastError = error;
    }
  }

  throw lastError;
}

function Chatbot() {
  const currentUser = auth.currentUser;

  const welcomeMessage = {
    sender: 'bot',
    text:
      'Assalamu alaikum! I am your AI parenting assistant. I can use your selected child profile and latest development check to give safer, age-aware support. This is not medical advice.',
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [latestCheck, setLatestCheck] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([welcomeMessage]);

  useEffect(() => {
    loadChatbotContext();
    loadSessions();
  }, [currentUser]);

  async function loadChatbotContext() {
    if (!currentUser) return;

    const savedChildId = localStorage.getItem('selectedChildId');

    const childrenRef = collection(db, 'users', currentUser.uid, 'children');
    const childrenSnap = await getDocs(childrenRef);

    const childList = childrenSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setChildren(childList);

    let activeChild = null;

    if (savedChildId) {
      activeChild = childList.find((child) => child.id === savedChildId);
    }

    if (!activeChild && childList.length > 0) {
      activeChild = childList[0];
      localStorage.setItem('selectedChildId', activeChild.id);
    }

    setSelectedChild(activeChild || null);

    const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');
    const checksQuery = query(checksRef, orderBy('checkedAt', 'desc'), limit(20));
    const checksSnap = await getDocs(checksQuery);

    const checkList = checksSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    if (activeChild) {
      const childLatestCheck = checkList.find(
        (check) => check.childId === activeChild.id
      );

      setLatestCheck(childLatestCheck || null);
    } else {
      setLatestCheck(null);
    }
  }

  async function loadSessions() {
    if (!currentUser) return;

    const sessionsRef = collection(db, 'users', currentUser.uid, 'chatSessions');
    const sessionsQuery = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(20));
    const sessionsSnap = await getDocs(sessionsQuery);

    const list = sessionsSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setSessions(list);
  }

  async function loadSessionMessages(sessionId) {
    if (!currentUser || !sessionId) return;

    const messagesRef = collection(
      db,
      'users',
      currentUser.uid,
      'chatSessions',
      sessionId,
      'messages'
    );

    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const messagesSnap = await getDocs(messagesQuery);

    const list = messagesSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setActiveSessionId(sessionId);
    setMessages(list.length > 0 ? list : [welcomeMessage]);
  }

  async function createNewSession(firstMessageText) {
    const sessionsRef = collection(db, 'users', currentUser.uid, 'chatSessions');

    const sessionDoc = await addDoc(sessionsRef, {
      title: createSessionTitle(firstMessageText),
      childId: selectedChild?.id || null,
      childName: selectedChild?.childName || null,
      childAgeMonths: selectedChild?.ageMonths || null,
      latestCheckId: latestCheck?.id || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setActiveSessionId(sessionDoc.id);
    await loadSessions();

    return sessionDoc.id;
  }

  async function saveMessageToSession(sessionId, sender, text) {
    if (!currentUser || !sessionId) return;

    const messagesRef = collection(
      db,
      'users',
      currentUser.uid,
      'chatSessions',
      sessionId,
      'messages'
    );

    await addDoc(messagesRef, {
      sender,
      text,
      childId: selectedChild?.id || null,
      childName: selectedChild?.childName || null,
      childAgeMonths: selectedChild?.ageMonths || null,
      latestCheckId: latestCheck?.id || null,
      latestCheckScore: latestCheck?.score || null,
      latestCheckWeakestCategory: latestCheck?.weakestCategory || null,
      createdAt: serverTimestamp(),
    });

    const sessionRef = doc(
      db,
      'users',
      currentUser.uid,
      'chatSessions',
      sessionId
    );

    await updateDoc(sessionRef, {
      lastMessage: text.length > 120 ? `${text.slice(0, 120)}...` : text,
      updatedAt: serverTimestamp(),
    });
  }

  function getFriendlyErrorMessage(error) {
    const message = error?.message || '';

    if (
      message.includes('503') ||
      message.includes('high demand') ||
      message.includes('UNAVAILABLE')
    ) {
      return 'The AI model is busy right now because of high demand. Please wait a moment and try again.';
    }

    if (message.includes('API key') || message.includes('403') || message.includes('401')) {
      return 'The AI key is not working. Please check your Gemini API key in the .env file.';
    }

    return 'Sorry, I could not connect to the AI right now. Please check your internet connection and try again.';
  }

  async function handleSend(e) {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      let sessionId = activeSessionId;

      if (!sessionId) {
        sessionId = await createNewSession(userMessage);
      }

      const updatedMessages = [
        ...messages,
        {
          sender: 'user',
          text: userMessage,
        },
      ];

      setMessages(updatedMessages);

      await saveMessageToSession(sessionId, 'user', userMessage);

      const aiReply = await getAIResponse(
        userMessage,
        selectedChild,
        latestCheck,
        updatedMessages
      );

      await saveMessageToSession(sessionId, 'bot', aiReply);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: aiReply,
        },
      ]);

      await loadSessions();
    } catch (error) {
      console.log(error);

      const errorMessage = getFriendlyErrorMessage(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: errorMessage,
        },
      ]);
    }

    setLoading(false);
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([welcomeMessage]);
    setInput('');
  }

  function handleChildChange(e) {
    const childId = e.target.value;
    const child = children.find((item) => item.id === childId);

    setSelectedChild(child || null);
    localStorage.setItem('selectedChildId', childId);

    setLatestCheck(null);
    loadLatestCheckForChild(childId);
    handleNewChat();
  }

  async function loadLatestCheckForChild(childId) {
    if (!currentUser || !childId) return;

    const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');
    const checksQuery = query(checksRef, orderBy('checkedAt', 'desc'), limit(20));
    const checksSnap = await getDocs(checksQuery);

    const checkList = checksSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    const childLatestCheck = checkList.find((check) => check.childId === childId);

    setLatestCheck(childLatestCheck || null);
  }

  function formatSessionDate(item) {
    if (!item?.updatedAt) return '';
    if (item.updatedAt.toDate) return item.updatedAt.toDate().toLocaleDateString();
    return '';
  }

  return (
    <div className="chatbot-page">
      <header className="dashboard-topbar">
        <div className="container">
          <div className="topbar-brand">🌱 ECD AI Parenting Assistant</div>

          <Link to="/dashboard" className="logout-btn">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="chatbot-main">
        <div className="container">
          <div className="chatgpt-layout">
            <aside className="chat-session-sidebar">
              <button type="button" className="new-chat-btn" onClick={handleNewChat}>
                + New Chat
              </button>

              <h3>Chat History</h3>

              {sessions.length === 0 && (
                <p className="empty-sessions">No previous chats yet.</p>
              )}

              <div className="session-list">
                {sessions.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    className={
                      activeSessionId === session.id
                        ? 'session-item active-session'
                        : 'session-item'
                    }
                    onClick={() => loadSessionMessages(session.id)}
                  >
                    <span>{session.title}</span>
                    <small>
                      {session.childName
                        ? `${session.childName} • ${formatSessionDate(session)}`
                        : formatSessionDate(session)}
                    </small>
                  </button>
                ))}
              </div>
            </aside>

            <section className="chatbot-card">
              <div className="chatbot-header">
                <h2>AI Parent Support Chatbot</h2>
                <p>
                  This chatbot uses the selected child profile and latest saved
                  development check when available. It does not provide medical
                  diagnosis.
                </p>
              </div>

              <div className="chat-context-box">
                <div>
                  <strong>Selected Child</strong>
                  <p>
                    {selectedChild
                      ? `${selectedChild.childName}, ${selectedChild.ageMonths} months`
                      : 'No child selected'}
                  </p>
                </div>

                <div>
                  <strong>Latest Check</strong>
                  <p>
                    {latestCheck
                      ? `${latestCheck.score}% • ${latestCheck.weakestCategory}`
                      : 'No saved check found'}
                  </p>
                </div>
              </div>

              {children.length > 0 && (
                <div className="form-group chatbot-child-select">
                  <label>Change Selected Child</label>
                  <select
                    value={selectedChild?.id || ''}
                    onChange={handleChildChange}
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.childName} - {child.ageMonths} months
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="quick-topics">
                <button
                  type="button"
                  onClick={() => setInput('Should my child be walking now?')}
                >
                  Walking
                </button>

                <button
                  type="button"
                  onClick={() => setInput('Should my child be saying words now?')}
                >
                  Language
                </button>

                <button
                  type="button"
                  onClick={() => setInput('Suggest activities for my child')}
                >
                  Activities
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput('How can I support the weakest category?')
                  }
                >
                  Weakest Area
                </button>

                <button
                  type="button"
                  onClick={() => setInput('Islamic parenting tips for my child')}
                >
                  Islamic Tips
                </button>
              </div>

              <div className="chat-window">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={
                      message.sender === 'user'
                        ? 'chat-message user-message'
                        : 'chat-message bot-message'
                    }
                  >
                    <p>{message.text}</p>
                  </div>
                ))}

                {loading && (
                  <div className="chat-message bot-message">
                    <p>Thinking...</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="chat-input-row">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a parenting question..."
                />

                <button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chatbot;