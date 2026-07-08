import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import {
  getActivitySuggestions,
  getQuestionsForAge,
  getSafeFeedback,
} from '../data/developmentMilestones';

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [developmentChecks, setDevelopmentChecks] = useState([]);

  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGender, setChildGender] = useState('');
  const [editingChildId, setEditingChildId] = useState(null);
  const [childMessage, setChildMessage] = useState('');

  const [selectedChild, setSelectedChild] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [checkMessage, setCheckMessage] = useState('');
  const [selectedCheck, setSelectedCheck] = useState(null);

  const userName = profile?.fullName || currentUser?.displayName || 'Parent';
  const userEmail = profile?.email || currentUser?.email || '';
  const avatarLetter = userName.charAt(0).toUpperCase();

  const latestCheck = developmentChecks[0] || null;

  const questions = useMemo(() => {
    if (!selectedChild) return [];
    return getQuestionsForAge(Number(selectedChild.ageMonths));
  }, [selectedChild]);

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setProfile(userSnap.data());
      }
    }

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    loadChildren();
    loadDevelopmentChecks();
  }, [currentUser]);

  async function loadChildren() {
    if (!currentUser) return;

    const childrenRef = collection(db, 'users', currentUser.uid, 'children');
    const childrenQuery = query(childrenRef, orderBy('createdAt', 'desc'));
    const childrenSnap = await getDocs(childrenQuery);

    const list = childrenSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setChildren(list);

    if (!selectedChild && list.length > 0) {
      setSelectedChild(list[0]);
      localStorage.setItem('selectedChildId', list[0].id);
    }
  }

  async function loadDevelopmentChecks() {
    if (!currentUser) return;

    const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');
    const checksQuery = query(checksRef, orderBy('checkedAt', 'desc'), limit(10));
    const checksSnap = await getDocs(checksQuery);

    const list = checksSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setDevelopmentChecks(list);
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/');
  }

  async function handleSaveChild(e) {
    e.preventDefault();
    setChildMessage('');

    if (!currentUser) {
      setChildMessage('Please log in first.');
      return;
    }

    const parsedAge = Number(childAge);

    if (!childName || childAge === '' || !childGender) {
      setChildMessage('Please fill in all child profile fields.');
      return;
    }

    if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 36) {
      setChildMessage('Age must be between 0 and 36 months.');
      return;
    }

    try {
      if (editingChildId) {
        const childRef = doc(db, 'users', currentUser.uid, 'children', editingChildId);

        await updateDoc(childRef, {
          childName,
          ageMonths: parsedAge,
          gender: childGender,
          updatedAt: serverTimestamp(),
        });

        setChildMessage('Child profile updated successfully.');
      } else {
        const childrenRef = collection(db, 'users', currentUser.uid, 'children');

        await addDoc(childrenRef, {
          childName,
          ageMonths: parsedAge,
          gender: childGender,
          createdAt: serverTimestamp(),
        });

        setChildMessage('Child profile saved successfully.');
      }

      setChildName('');
      setChildAge('');
      setChildGender('');
      setEditingChildId(null);
      await loadChildren();
    } catch (error) {
      console.log(error);
      setChildMessage('Unable to save child profile. Check Firebase rules.');
    }
  }

  function handleEditChild(child) {
    setEditingChildId(child.id);
    setChildName(child.childName);
    setChildAge(String(child.ageMonths));
    setChildGender(child.gender);
  }

  async function handleDeleteChild(childId) {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'children', childId));

      if (selectedChild?.id === childId) {
        setSelectedChild(null);
        setAnswers({});
        setResult(null);
        localStorage.removeItem('selectedChildId');
      }

      await loadChildren();
      setChildMessage('Child profile deleted.');
    } catch (error) {
      console.log(error);
      setChildMessage('Unable to delete child profile.');
    }
  }

  function handleSelectChild(child) {
    setSelectedChild(child);
    localStorage.setItem('selectedChildId', child.id);
    setAnswers({});
    setResult(null);
    setCheckMessage('');
  }

  function handleAnswer(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function calculateResult() {
    setCheckMessage('');

    if (!selectedChild) {
      setCheckMessage('Please select or add a child profile first.');
      return;
    }

    if (questions.length === 0) {
      setCheckMessage('No questions found for this age.');
      return;
    }

    const unanswered = questions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      setCheckMessage('Please answer all questions before checking result.');
      return;
    }

    const categories = {};

    questions.forEach((q) => {
      if (!categories[q.category]) {
        categories[q.category] = {
          total: 0,
          yes: 0,
        };
      }

      categories[q.category].total += 1;

      if (answers[q.id] === 'yes') {
        categories[q.category].yes += 1;
      }
    });

    const categorySummary = Object.keys(categories).map((category) => {
      const item = categories[category];
      const score = Math.round((item.yes / item.total) * 100);

      return {
        category,
        score,
        total: item.total,
        yes: item.yes,
      };
    });

    const totalYes = categorySummary.reduce((sum, item) => sum + item.yes, 0);
    const totalQuestions = categorySummary.reduce((sum, item) => sum + item.total, 0);
    const score = Math.round((totalYes / totalQuestions) * 100);

    const weakestCategory =
      [...categorySummary].sort((a, b) => a.score - b.score)[0]?.category || 'General';

    const feedback = getSafeFeedback(score);
    const suggestedActivities = getActivitySuggestions(
      Number(selectedChild.ageMonths),
      weakestCategory
    );

    setResult({
      childId: selectedChild.id,
      childName: selectedChild.childName,
      ageMonths: selectedChild.ageMonths,
      score,
      categorySummary,
      weakestCategory,
      feedback,
      suggestedActivities,
      answers,
      questions,
    });
  }

  async function handleSaveCheckResult() {
    if (!currentUser) {
      setCheckMessage('Please log in first.');
      return;
    }

    if (!result) {
      setCheckMessage('Run the checker before saving.');
      return;
    }

    try {
      const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');

      await addDoc(checksRef, {
        ...result,
        checkedAt: serverTimestamp(),
      });

      setCheckMessage('Development check saved successfully.');
      await loadDevelopmentChecks();
    } catch (error) {
      console.log(error);
      setCheckMessage('Unable to save development check. Check Firebase rules.');
    }
  }

  function formatDate(item) {
    if (!item?.checkedAt) return 'Recently';
    if (item.checkedAt.toDate) return item.checkedAt.toDate().toLocaleDateString();
    return 'Recently';
  }

  function getScoreClass(score) {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  function getLatestCategorySummary() {
    if (!latestCheck?.categorySummary) return [];
    return latestCheck.categorySummary;
  }

  function getAnsweredCount() {
    return Object.keys(answers).length;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="container">
          <div className="topbar-brand">🌱 ECD Parenting System</div>

          <div className="topbar-user">
            <div className="user-avatar">{avatarLetter}</div>

            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-meta">{userEmail}</span>
            </div>

            <Link to="/chatbot" className="logout-btn">
              Chatbot
            </Link>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="welcome-banner">
            <span className="dashboard-status">Parent Portal</span>
            <h2>Welcome back, {userName}!</h2>
            <p>
              Manage child profiles, complete development checks, review progress,
              and see safe activity suggestions.
            </p>
          </div>

          <div className="premium-stats-grid">
            <div className="premium-stat-card">
              <span>👶</span>
              <div>
                <p>Children</p>
                <h3>{children.length}</h3>
              </div>
            </div>

            <div className="premium-stat-card">
              <span>📊</span>
              <div>
                <p>Assessments</p>
                <h3>{developmentChecks.length}</h3>
              </div>
            </div>

            <div className="premium-stat-card">
              <span>🎯</span>
              <div>
                <p>Latest Score</p>
                <h3>{latestCheck ? `${latestCheck.score}%` : '--'}</h3>
              </div>
            </div>

            <div className="premium-stat-card">
              <span>🤖</span>
              <div>
                <p>AI Assistant</p>
                <h3>Ready</h3>
              </div>
            </div>
          </div>

          {latestCheck && (
            <div className="premium-progress-card">
              <div className="premium-section-header">
                <div>
                  <h3>Development Overview</h3>
                  <p>Latest saved assessment summary</p>
                </div>

                <div className={`score-pill ${getScoreClass(latestCheck.score)}`}>
                  {latestCheck.score}%
                </div>
              </div>

              <div className="progress-bars-list">
                {getLatestCategorySummary().map((item) => (
                  <div className="progress-row" key={item.category}>
                    <div className="progress-label">
                      <span>{item.category}</span>
                      <strong>{item.score}%</strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-fill ${getScoreClass(item.score)}`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dashboard-grid">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-green">👶</div>
                <h3>Child Profile</h3>
              </div>

              <form onSubmit={handleSaveChild} className="child-profile-form">
                <div className="form-group">
                  <label>Child Name</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Ayaan"
                  />
                </div>

                <div className="child-form-row">
                  <div className="form-group">
                    <label>Age Months</label>
                    <input
                      type="number"
                      min="0"
                      max="36"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      placeholder="18"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={childGender}
                      onChange={(e) => setChildGender(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary form-btn" type="submit">
                  {editingChildId ? 'Update Child Profile' : 'Save Child Profile'}
                </button>

                {editingChildId && (
                  <button
                    type="button"
                    className="btn btn-outline form-btn"
                    onClick={() => {
                      setEditingChildId(null);
                      setChildName('');
                      setChildAge('');
                      setChildGender('');
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>

              {childMessage && <p className="child-message">{childMessage}</p>}

              <div className="saved-children">
                <h4>Saved Children</h4>

                {children.length === 0 && <p>No child profile added yet.</p>}

                {children.map((child) => (
                  <div
                    className={
                      selectedChild?.id === child.id
                        ? 'saved-child-card selected-child-card'
                        : 'saved-child-card'
                    }
                    key={child.id}
                  >
                    <div className="child-card-left">
                      <div className="child-mini-avatar">👶</div>
                      <div>
                        <strong>{child.childName}</strong>
                        <p>
                          {child.ageMonths} months • {child.gender}
                        </p>
                      </div>
                    </div>

                    <div className="check-actions">
                      <button
                        type="button"
                        className="use-age-btn"
                        onClick={() => handleSelectChild(child)}
                      >
                        Select
                      </button>

                      <button
                        type="button"
                        className="use-age-btn"
                        onClick={() => handleEditChild(child)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="use-age-btn"
                        onClick={() => handleDeleteChild(child.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-green">📊</div>
                <h3>Development Checker</h3>
              </div>

              {!selectedChild && (
                <p className="dash-card-desc">
                  Select a saved child profile to start the checker.
                </p>
              )}

              {selectedChild && (
                <>
                  <div className="selected-child-note">
                    Selected child: <strong>{selectedChild.childName}</strong> •{' '}
                    {selectedChild.ageMonths} months
                  </div>

                  <div className="checker-progress-box">
                    <div>
                      <strong>
                        Question Progress: {getAnsweredCount()} of {questions.length}
                      </strong>
                      <p>Answer all questions to calculate the result.</p>
                    </div>

                    <div className="checker-progress-track">
                      <div
                        className="checker-progress-fill"
                        style={{
                          width:
                            questions.length > 0
                              ? `${Math.round((getAnsweredCount() / questions.length) * 100)}%`
                              : '0%',
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="question-list">
                    {questions.map((q) => (
                      <div className="question-card" key={q.id}>
                        <strong>{q.category}</strong>
                        <p>{q.question}</p>

                        <div className="answer-row">
                          <label>
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === 'yes'}
                              onChange={() => handleAnswer(q.id, 'yes')}
                            />
                            Yes
                          </label>

                          <label>
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === 'not_yet'}
                              onChange={() => handleAnswer(q.id, 'not_yet')}
                            />
                            Not Yet
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary form-btn"
                    onClick={calculateResult}
                  >
                    Check Result
                  </button>
                </>
              )}

              {checkMessage && <p className="check-message">{checkMessage}</p>}

              {result && (
                <div className="dev-result">
                  <div className="premium-section-header">
                    <div>
                      <h4>Result Summary</h4>
                      <p>{result.feedback}</p>
                    </div>

                    <div className={`score-pill ${getScoreClass(result.score)}`}>
                      {result.score}%
                    </div>
                  </div>

                  <p>
                    <strong>Area needing most support:</strong>{' '}
                    {result.weakestCategory}
                  </p>

                  <h4>Category Summary</h4>

                  <div className="progress-bars-list">
                    {result.categorySummary.map((item) => (
                      <div className="progress-row" key={item.category}>
                        <div className="progress-label">
                          <span>{item.category}</span>
                          <strong>{item.score}%</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className={`progress-fill ${getScoreClass(item.score)}`}
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4>Suggested Activities</h4>
                  <ul>
                    {result.suggestedActivities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="save-check-btn"
                    onClick={handleSaveCheckResult}
                  >
                    Save Check Result
                  </button>
                </div>
              )}
            </div>

            <div className="dash-card dash-card-full">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-amber">📌</div>
                <h3>Parent Dashboard Summary</h3>
              </div>

              <div className="summary-grid">
                <div className="summary-box">
                  <strong>Selected Child</strong>
                  <p>
                    {selectedChild
                      ? `${selectedChild.childName}, ${selectedChild.ageMonths} months`
                      : 'No child selected'}
                  </p>
                </div>

                <div className="summary-box">
                  <strong>Latest Score</strong>
                  <p>{latestCheck ? `${latestCheck.score}%` : 'No checks saved yet'}</p>
                </div>

                <div className="summary-box">
                  <strong>Weakest Category</strong>
                  <p>{latestCheck?.weakestCategory || 'Not available yet'}</p>
                </div>
              </div>

              {latestCheck?.suggestedActivities?.length > 0 && (
                <>
                  <h4>Recommended Activities</h4>
                  <ul>
                    {latestCheck.suggestedActivities.slice(0, 5).map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </>
              )}

              <h4>Recent Check History</h4>

              {developmentChecks.length === 0 && (
                <div className="premium-empty-state">
                  <span>📋</span>
                  <strong>No assessments yet</strong>
                  <p>Start your child’s first development check to see progress here.</p>
                </div>
              )}

              {developmentChecks.map((check) => (
                <div className="recent-check-card" key={check.id}>
                  <div>
                    <strong>{check.childName}</strong>
                    <p>
                      {check.ageMonths} months • Score {check.score}% •{' '}
                      {check.weakestCategory}
                    </p>
                  </div>

                  <div className="check-actions">
                    <span>{formatDate(check)}</span>
                    <button
                      type="button"
                      className="view-details-btn"
                      onClick={() => setSelectedCheck(check)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}

              {selectedCheck && (
                <div className="check-detail-panel">
                  <div className="check-detail-header">
                    <div>
                      <h4>Saved Check Details</h4>
                      <p>
                        {selectedCheck.childName} • {selectedCheck.ageMonths} months
                      </p>
                    </div>

                    <button
                      type="button"
                      className="close-detail-btn"
                      onClick={() => setSelectedCheck(null)}
                    >
                      ×
                    </button>
                  </div>

                  <p>
                    <strong>Score:</strong> {selectedCheck.score}%
                  </p>
                  <p>
                    <strong>Support Area:</strong> {selectedCheck.weakestCategory}
                  </p>
                  <p>{selectedCheck.feedback}</p>

                  <h5>Activities Saved</h5>
                  <ul>
                    {selectedCheck.suggestedActivities?.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
