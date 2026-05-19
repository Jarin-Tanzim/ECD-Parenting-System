import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

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

  const [age, setAge] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTip, setActiveTip] = useState('nutrition');

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.log('Logout error:', error);
    }
  }

  function handleDevelopmentCheck() {
    const childAge = parseInt(age, 10);

    setError('');
    setResult(null);

    if (Number.isNaN(childAge) || childAge < 0 || childAge > 36) {
      setError('Please enter a valid age between 0 and 36 months.');
      return;
    }

    if (childAge <= 12) {
      setResult(developmentData.infant);
    } else if (childAge <= 24) {
      setResult(developmentData.toddler1);
    } else {
      setResult(developmentData.toddler2);
    }
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
            <div className="user-avatar">P</div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="welcome-banner">
            <h2>Welcome back, Parent!</h2>
            <p>
              Track your child&apos;s milestones, explore activities, and get support in one place.
            </p>
          </div>

          <div className="dashboard-grid">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-icon icon-green">📊</div>
                <h3>Development Checker</h3>
              </div>

              <p className="dash-card-desc">
                Enter your child&apos;s age in months to see expected milestones and activities.
              </p>

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
                    onChange={(e) => setAge(e.target.value)}
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

              <div className="future-badge">
                Future AI Feature
              </div>
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