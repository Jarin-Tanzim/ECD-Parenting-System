import { useState } from 'react';
import { Link } from 'react-router-dom';

const parentingTips = [
  {
    id: 'language',
    icon: '🗣️',
    title: 'Language & Communication',
    subtitle: 'Help your child understand and use words.',
    tips: [
      'Talk to your child during daily routines like feeding, bathing, and dressing.',
      'Read picture books every day, even for a few minutes.',
      'Sing simple songs, rhymes, nasheeds, and repeat familiar words.',
      'Respond when your baby makes sounds, smiles, or gestures.',
      'Name objects around the house, such as cup, ball, book, light, and water.',
    ],
  },
  {
    id: 'nutrition',
    icon: '🍎',
    title: 'Eating & Nutrition',
    subtitle: 'Build calm and healthy feeding habits.',
    tips: [
      'Keep mealtimes calm and avoid forcing your child to eat.',
      'Offer age-appropriate foods and small portions.',
      'Introduce fruits, vegetables, grains, and proteins gradually based on age.',
      'Let toddlers try feeding themselves with supervision.',
      'Talk to a pediatrician if your child often refuses food, loses weight, or you are worried.',
    ],
  },
  {
    id: 'behavior',
    icon: '❤️',
    title: 'Behavior & Emotions',
    subtitle: 'Support calm behavior and emotional growth.',
    tips: [
      'Use gentle words and simple explanations.',
      'Praise good behavior immediately when you see it.',
      'Keep routines predictable for sleep, meals, and play.',
      'Help your child name feelings like happy, sad, angry, tired, or scared.',
      'When behavior is difficult, check if your child is hungry, tired, overstimulated, or uncomfortable.',
    ],
  },
  {
    id: 'play',
    icon: '🧸',
    title: 'Play & Learning',
    subtitle: 'Use simple play to support development.',
    tips: [
      'Play peekaboo, stacking, sorting, pretend play, and naming games.',
      'Use safe household items like cups, spoons, boxes, and soft cloths for supervised play.',
      'Let your child explore safely instead of always directing the play.',
      'Use toys that match your child’s age and avoid small choking hazards.',
      'Spend short, regular playtimes together instead of relying only on screens.',
    ],
  },
  {
    id: 'motor',
    icon: '🏃',
    title: 'Motor Skills',
    subtitle: 'Support movement, balance, and hand control.',
    tips: [
      'Give babies supervised tummy time while awake.',
      'Create a safe floor space for rolling, crawling, sitting, and walking practice.',
      'Use balls, soft blocks, stacking cups, and simple movement games.',
      'Encourage toddlers to climb safely, kick a ball, dance, and walk with support.',
      'Use drawing, page turning, and stacking activities to support hand skills.',
    ],
  },
  {
    id: 'safety',
    icon: '🛡️',
    title: 'Safety & Hygiene',
    subtitle: 'Keep your child safe during daily routines.',
    tips: [
      'Keep small objects, medicines, sharp items, and cleaning products out of reach.',
      'Always supervise babies and toddlers during eating, bathing, and play.',
      'Wash hands before meals and after diaper changes or bathroom use.',
      'Clean toys regularly, especially if your child puts them in their mouth.',
      'Use safe sleep and safe feeding practices based on your child’s age.',
    ],
  },
  {
    id: 'islamic',
    icon: '🕌',
    title: 'Islamic Parenting',
    subtitle: 'Build love, mercy, manners, and faith-based routines.',
    tips: [
      'Use gentle speech and mercy, especially when correcting behavior.',
      'Say simple duas with your child during daily routines.',
      'Teach gratitude by saying Alhamdulillah for food, family, and blessings.',
      'Model good manners such as saying salam, sharing, patience, and kindness.',
      'Create a loving home environment where Islamic values are practiced calmly.',
    ],
  },
  {
    id: 'screen',
    icon: '📱',
    title: 'Screen Balance',
    subtitle: 'Prioritize real interaction over screens.',
    tips: [
      'Choose talking, reading, singing, and playing together whenever possible.',
      'Avoid using screens as the main way to calm or entertain your child.',
      'For toddlers, watch together and talk about what they see.',
      'Keep screens away during meals and bedtime routines.',
      'Use screens carefully and focus on real-world play and connection.',
    ],
  },
];

function ParentingTips() {
  const [activeTip, setActiveTip] = useState(parentingTips[0]);

  return (
    <div className="tips-page">
      <header className="dashboard-topbar">
        <div className="container">
          <div className="topbar-brand">🌱 Parenting Tips</div>

          <div className="topbar-user">
            <Link to="/dashboard" className="logout-btn">
              Back to Dashboard
            </Link>

            <Link to="/chatbot" className="logout-btn">
              Ask AI
            </Link>
          </div>
        </div>
      </header>

      <main className="tips-main">
        <div className="container">
          <section className="tips-hero">
            <span className="dashboard-status">Parent Support Guide</span>
            <h2>Helpful Parenting Tips for Early Childhood</h2>
            <p>
              Simple, safe, and practical tips for communication, eating,
              behavior, play, safety, and Islamic parenting.
            </p>
          </section>

          <section className="tips-layout">
            <div className="tips-category-list">
              {parentingTips.map((tip) => (
                <button
                  key={tip.id}
                  type="button"
                  className={
                    activeTip.id === tip.id
                      ? 'tips-category active-tip-category'
                      : 'tips-category'
                  }
                  onClick={() => setActiveTip(tip)}
                >
                  <span>{tip.icon}</span>
                  <div>
                    <strong>{tip.title}</strong>
                    <p>{tip.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="tips-detail-card">
              <div className="tips-detail-header">
                <div className="tips-big-icon">{activeTip.icon}</div>
                <div>
                  <h3>{activeTip.title}</h3>
                  <p>{activeTip.subtitle}</p>
                </div>
              </div>

              <div className="tips-list">
                {activeTip.tips.map((tip, index) => (
                  <div className="tip-item" key={index}>
                    <span>{index + 1}</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>

              <div className="tips-safe-note">
                <strong>Safe Reminder</strong>
                <p>
                  These tips are for general parenting support. They do not
                  replace advice from a pediatrician or child development
                  specialist.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ParentingTips;