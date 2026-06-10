import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const developmentData = {
  infant: {
    label: '0 - 12 Months',
    milestones: [
      'Responds to sounds and voices',
      'Recognizes familiar faces',
      'Starts sitting or crawling',
    ],
    activities: [
      'Tummy time exercises',
      'Soft music and singing',
      'Object tracking games',
    ],
  },
  toddler1: {
    label: '13 - 24 Months',
    milestones: [
      'Starts walking independently',
      'Says simple words like mama, dada, or no',
      'Follows basic instructions',
    ],
    activities: [
      'Building blocks play',
      'Reading colorful picture books',
      'Naming everyday objects together',
    ],
  },
  toddler2: {
    label: '25 - 36 Months',
    milestones: [
      'Speaks short sentences',
      'Plays alongside other children',
      'Shows increasing independence',
    ],
    activities: [
      'Drawing and simple coloring',
      'Storytelling and pretend play',
      'Sorting colors and shapes',
    ],
  },
};

const parentingTips = {
  nutrition: [
    'Offer a colorful variety of fruits and vegetables at meals.',
    'Keep your child hydrated with water throughout the day.',
    'Limit sugary drinks, salty snacks, and ultra-processed foods.',
    'Maintain regular meal and snack times to build healthy routines.',
  ],
  behavior: [
    'Use calm and consistent responses when your child is upset.',
    'Praise good behavior instead of only correcting mistakes.',
    'Set simple limits that match your child’s age and understanding.',
    'Model the behavior you want your child to learn.',
  ],
  learning: [
    'Read aloud daily to build vocabulary and imagination.',
    'Use songs, rhymes, and simple games to introduce letters and numbers.',
    'Encourage puzzles, sorting toys, drawing, and pretend play.',
    'Prioritize hands-on activities over screen time.',
  ],
  islamic: [
    'Teach simple duas and Islamic manners from an early age.',
    'Say Bismillah before meals and Alhamdulillah after eating.',
    'Let your child observe prayer time as part of the daily routine.',
    'Share simple stories of the Prophets to build character and faith.',
  ],
};

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGender, setChildGender] = useState('');
  const [children, setChildren] = useState([]);
  const [childMessage, setChildMessage] = useState('');

  const [selectedChild, setSelectedChild] = useState(null);

  const [age, setAge] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checkMessage, setCheckMessage] = useState('');
  const [developmentChecks, setDevelopmentChecks] = useState([]);
  const [selectedCheck, setSelectedCheck] = useState(null);

  const [activeTip, setActiveTip] = useState('nutrition');

  const userName = profile?.fullName || currentUser?.displayName || 'Parent';
  const userEmail = profile?.email || currentUser?.email || '';
  const userRole = profile?.role || 'parent';
  const avatarLetter = userName.charAt(0).toUpperCase();

  useEffect(() => {
    async function fetchUserProfile() {
      if (!currentUser) {
        setProfileLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }
      } catch (error) {
        console.log('Error loading user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    async function fetchChildren() {
      if (!currentUser) return;

      try {
        const childrenRef = collection(db, 'users', currentUser.uid, 'children');
        const childrenQuery = query(childrenRef, orderBy('createdAt', 'desc'));
        const childrenSnap = await getDocs(childrenQuery);

        const childrenList = childrenSnap.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setChildren(childrenList);
      } catch (error) {
        console.log('Error loading child profiles:', error);
      }
    }

    fetchChildren();
  }, [currentUser]);

  useEffect(() => {
    async function fetchDevelopmentChecks() {
      if (!currentUser) return;

      try {
        const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');
        const checksQuery = query(checksRef, orderBy('checkedAt', 'desc'), limit(5));
        const checksSnap = await getDocs(checksQuery);

        const checksList = checksSnap.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setDevelopmentChecks(checksList);
      } catch (error) {
        console.log('Error loading development check history:', error);
      }
    }

    fetchDevelopmentChecks();
  }, [currentUser]);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.log('Logout error:', error);
    }
  }

  function getDevelopmentResult(months) {
    if (months <= 12) {
      return developmentData.infant;
    }

    if (months <= 24) {
      return developmentData.toddler1;
    }

    return developmentData.toddler2;
  }

  function handleDevelopmentCheck() {
    const enteredAge = parseInt(age, 10);

    setError('');
    setCheckMessage('');
    setResult(null);

    if (Number.isNaN(enteredAge) || enteredAge < 0 || enteredAge > 36) {
      setError('Please enter a valid age between 0 and 36 months.');
      return;
    }

    setResult(getDevelopmentResult(enteredAge));
  }

  async function handleSaveChild(e) {
    e.preventDefault();

    setChildMessage('');

    if (!currentUser) {
      setChildMessage('You must be logged in to save a child profile.');
      return;
    }

    const parsedAge = parseInt(childAge, 10);

    if (!childName || !childAge || !childGender) {
      setChildMessage('Please fill in child name, age, and gender.');
      return;
    }

    if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 36) {
      setChildMessage('Child age must be between 0 and 36 months.');
      return;
    }

    try {
      const childrenRef = collection(db, 'users', currentUser.uid, 'children');

      const docRef = await addDoc(childrenRef, {
        childName,
        ageMonths: parsedAge,
        gender: childGender,
        createdAt: serverTimestamp(),
      });

      const newChild = {
        id: docRef.id,
        childName,
        ageMonths: parsedAge,
        gender: childGender,
      };

      setChildren((prevChildren) => [newChild, ...prevChildren]);

      setChildName('');
      setChildAge('');
      setChildGender('');
      setChildMessage('Child profile saved successfully.');
    } catch (error) {
      console.log('Error saving child profile:', error);
      setChildMessage('Unable to save child profile. Please try again.');
    }
  }

  function handleUseChildAge(child) {
    setSelectedChild(child);
    setAge(String(child.ageMonths));
    setError('');
    setCheckMessage('');
    setResult(getDevelopmentResult(child.ageMonths));
  }

  async function handleSaveDevelopmentCheck() {
    if (!currentUser) {
      setCheckMessage('You must be logged in to save this check.');
      return;
    }

    if (!result) {
      setCheckMessage('Please run a development check before saving.');
      return;
    }

    const enteredAge = parseInt(age, 10);

    if (Number.isNaN(enteredAge) || enteredAge < 0 || enteredAge > 36) {
      setCheckMessage('Please enter a valid age before saving.');
      return;
    }

    try {
      const checksRef = collection(db, 'users', currentUser.uid, 'developmentChecks');

      const checkData = {
        childId: selectedChild?.id || null,
        childName: selectedChild?.childName || 'Manual age entry',
        ageMonths: enteredAge,
        developmentRange: result.label,
        milestones: result.milestones,
        activities: result.activities,
        checkedAt: serverTimestamp(),
      };

      const docRef = await addDoc(checksRef, checkData);
      setSelectedCheck({
  id: docRef.id,
  ...checkData,
  checkedAt: new Date(),
});

      setDevelopmentChecks((prevChecks) => [
        {
          id: docRef.id,
          ...checkData,
          checkedAt: new Date(),
        },
        ...prevChecks.slice(0, 4),
      ]);

      setCheckMessage('Development check saved successfully.');
    } catch (error) {
      console.log('Error saving development check:', error);
      setCheckMessage('Unable to save development check. Please try again.');
    }
  }

  function formatCheckDate(check) {
    if (!check.checkedAt) {
      return 'Just now';
    }

    if (check.checkedAt.toDate) {
      return check.checkedAt.toDate().toLocaleDateString();
    }

    if (check.checkedAt instanceof Date) {
      return check.checkedAt.toLocaleDateString();
    }

    return 'Recently';
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="container">
          <div className="topbar-brand">
            <span className="tb-icon">🌱</span>
            ECD Parenting System
          </div>

          <div className="topbar-user">
            <div className="user-avatar">{avatarLetter}</div>

            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-meta">
                {userRole === 'admin' ? 'Admin' : 'Parent'} • {userEmail}
              </span>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="welcome-banner">
            <span className="dashboard-status">Authenticated Parent Portal</span>

            <h2>
              {profileLoading ? 'Loading profile...' : `Welcome back, ${userName}!`}
            </h2>

            <p>
              Track your child&apos;s development, review age-based activities, and explore
              parenting guidance in one secure dashboard.
            </p>
          </div>

          <div className="dashboard-grid">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-green">👶</div>
                <h3>Child Profile</h3>
              </div>

              <p className="dash-card-desc">
                Save your child&apos;s basic details so the dashboard can support personalized development tracking.
              </p>

              <form onSubmit={handleSaveChild} className="child-profile-form">
                <div className="form-group">
                  <label htmlFor="child-name">Child Name</label>
                  <input
                    type="text"
                    id="child-name"
                    placeholder="e.g. Ayaan"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                </div>

                <div className="child-form-row">
                  <div className="form-group">
                    <label htmlFor="child-profile-age">Age (months)</label>
                    <input
                      type="number"
                      id="child-profile-age"
                      placeholder="e.g. 18"
                      min="0"
                      max="36"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="child-gender">Gender</label>
                    <select
                      id="child-gender"
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

                <button type="submit" className="btn btn-primary form-btn">
                  Save Child Profile
                </button>
              </form>

              {childMessage && <p className="child-message">{childMessage}</p>}

              {children.length > 0 && (
                <div className="saved-children">
                  <h4>Saved Child Profile</h4>

                  {children.map((child) => (
                    <div className="saved-child-card" key={child.id}>
                      <div>
                        <strong>{child.childName}</strong>
                        <p>
                          {child.ageMonths} months • {child.gender}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="use-age-btn"
                        onClick={() => handleUseChildAge(child)}
                      >
                        Use Age
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-green">📊</div>
                <h3>Development Checker</h3>
              </div>

              <p className="dash-card-desc">
                Enter your child&apos;s age in months to see expected milestones and activities.
              </p>

              {selectedChild && (
                <div className="selected-child-note">
                  Using saved profile: <strong>{selectedChild.childName}</strong>
                </div>
              )}

              <div className="age-input-row">
                <div className="form-group">
                  <label htmlFor="child-age">Child&apos;s Age (months)</label>
                  <input
                    type="number"
                    id="child-age"
                    placeholder="e.g. 18"
                    min="0"
                    max="36"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setSelectedChild(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDevelopmentCheck();
                      }
                    }}
                  />
                </div>

                <button onClick={handleDevelopmentCheck} className="btn btn-primary check-btn">
                  Check Now
                </button>
              </div>

              {error && <p className="dev-error">{error}</p>}

              {result && (
                <div className="dev-result">
                  <div className="result-block">
                    <h4>Development Milestones - {result.label}</h4>
                    <ul>
                      {result.milestones.map((milestone, index) => (
                        <li key={index}>{milestone}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-block activity-block">
                    <h4>Recommended Activities</h4>
                    <ul>
                      {result.activities.map((activity, index) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="save-check-btn"
                    onClick={handleSaveDevelopmentCheck}
                  >
                    Save Check Result
                  </button>
                </div>
              )}

              {checkMessage && <p className="check-message">{checkMessage}</p>}

             {developmentChecks.length > 0 && (
  <div className="recent-checks">
    <h4>Recent Development Checks</h4>

    {developmentChecks.map((check) => (
      <div className="recent-check-card" key={check.id}>
        <div>
          <strong>{check.childName}</strong>
          <p>
            {check.ageMonths} months • {check.developmentRange}
          </p>
        </div>

        <div className="check-actions">
          <span>{formatCheckDate(check)}</span>
          <button
            type="button"
            className="view-details-btn"
            onClick={() => setSelectedCheck(check)}
          >
            View Details
          </button>
        </div>
      </div>
    ))}

    {selectedCheck && (
      <div className="check-detail-panel">
        <div className="check-detail-header">
          <div>
            <h4>Development Check Details</h4>
            <p>
              {selectedCheck.childName} • {selectedCheck.ageMonths} months •{' '}
              {selectedCheck.developmentRange}
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

        <div className="detail-section">
          <h5>Milestones Shown</h5>
          <ul>
            {selectedCheck.milestones?.map((milestone, index) => (
              <li key={index}>{milestone}</li>
            ))}
          </ul>
        </div>

        <div className="detail-section activity-detail">
          <h5>Recommended Activities</h5>
          <ul>
            {selectedCheck.activities?.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        </div>
      </div>
    )}
  </div>
)}
            </div>

            <div className="dash-card coming-soon-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-purple">🤖</div>
                <h3>AI Parenting Assistant</h3>
              </div>

              <p className="dash-card-desc">
                Planned for the next development phase with real AI-powered parenting support.
              </p>

              <div className="future-badge">Future AI Feature</div>
            </div>

            <div className="dash-card dash-card-full">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-blush">📖</div>
                <h3>Parenting Tips</h3>
              </div>

              <div className="tips-tabs">
                <button
                  className={`tip-tab ${activeTip === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setActiveTip('nutrition')}
                >
                  🥗 Nutrition
                </button>

                <button
                  className={`tip-tab ${activeTip === 'behavior' ? 'active' : ''}`}
                  onClick={() => setActiveTip('behavior')}
                >
                  💛 Behavior
                </button>

                <button
                  className={`tip-tab ${activeTip === 'learning' ? 'active' : ''}`}
                  onClick={() => setActiveTip('learning')}
                >
                  🧠 Learning
                </button>

                <button
                  className={`tip-tab ${activeTip === 'islamic' ? 'active' : ''}`}
                  onClick={() => setActiveTip('islamic')}
                >
                  🕌 Islamic Practices
                </button>
              </div>

              <div className="tip-content active">
                {parentingTips[activeTip].map((tip, index) => (
                  <div className="tip-item" key={index}>
                    <span className="tip-emoji">✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;