import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const spaces = [
  { value: 'park', name: 'A park', hint: 'Trees, paths & open space', icon: '♧' },
  { value: 'neighborhood', name: 'My neighborhood', hint: 'The familiar, seen differently', icon: '⌂' },
  { value: 'balcony', name: 'A balcony or yard', hint: 'A little outside is enough', icon: '☼' },
];

function Landscape() {
  return <svg className="landscape" viewBox="0 0 500 240" aria-hidden="true">
    <circle cx="385" cy="64" r="31" fill="#d9e89c" />
    <path d="M0 192Q105 60 234 164T500 146V240H0Z" fill="#a9c4b4" />
    <path d="M0 210Q125 174 269 205T500 162V240H0Z" fill="#638b75" />
    <path d="M205 240Q220 208 306 210T420 190" stroke="#e8f0f2" strokeWidth="10" fill="none" />
    <path d="M62 194v-65m-22 17 22-34 22 34m-37 22 15-28 15 28" stroke="#234638" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m280 63 7-5 7 5m20 13 7-5 7 5" stroke="#638b75" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>;
}

function App() {
  const [minutes, setMinutes] = useState(10);
  const [surroundings, setSurroundings] = useState('park');
  const [pace, setPace] = useState('stroll');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pocket, setPocket] = useState(false);
  const heading = useRef(null);

  function change(setter, value) {
    setter(value);
    setResult(null);
    setError('');
  }

  async function generate(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, surroundings, pace: surroundings === 'balcony' ? 'stay' : pace }),
        signal: AbortSignal.timeout(250000),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Choose your options and try again.');
      setResult(body);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (problem) {
      setError(problem.name === 'TimeoutError'
        ? 'This activity took too long to create. Please try again.'
        : problem instanceof TypeError || problem instanceof SyntaxError
          ? 'Cannot reach the activity service. Check that the local backend is running.'
          : problem.message);
    } finally {
      setBusy(false);
    }
  }

  function saveQuest() {
    const { quest } = result;
    const text = `${quest.title}\n${minutes} minutes · ${spaces.find(space => space.value === surroundings).name}\n\n${quest.invitation}\n\n${quest.steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}\n\nTo think about afterwards\n${quest.reflection}\n\nStay in a familiar, permitted space. Observe without disturbing plants or wildlife.\n\nOutside Quest · Generated with ${result.model}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'outside-quest.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  const quest = result?.quest;
  return <div className={pocket ? 'app pocket' : 'app'}>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Outside Quest home"><span className="brand-mark" aria-hidden="true">↗</span> outside quest<span className="brand-dot">.</span></a>
      <span className="edition">A SMALL INVITATION TO GO OUTSIDE</span>
    </header>
    <main>
      {!pocket && <section className="planner" aria-label="Plan an outdoor activity">
        <div className="intro">
          <span className="eyebrow"><span aria-hidden="true">☼</span> YOUR EVERYDAY FIELD GUIDE</span>
          <h1>Make room<br />for <span>outside.</span></h1>
          <p>Ten minutes. A familiar place. Something you haven’t noticed before.</p>
          <p className="intro-small">Choose what’s around you. We’ll make one small activity. Read it, put your phone away, and go.</p>
          <Landscape />
          <span className="landscape-caption">No special place. No special equipment.</span>
        </div>
        <form className="choices" onSubmit={generate}>
          <fieldset disabled={busy}>
            <legend>How much time do you have?</legend>
            <div className="time-options">{[5, 10, 20].map(value => <label className={`time-option ${minutes === value ? 'selected' : ''}`} key={value}>
              <input type="radio" name="minutes" value={value} checked={minutes === value} onChange={() => change(setMinutes, value)} />
              <span className="time-number">{value}</span><span>minutes</span>
            </label>)}</div>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>What’s nearby?</legend>
            <div className="space-options">{spaces.map(space => <label className={`space-option ${surroundings === space.value ? 'selected' : ''}`} key={space.value}>
              <input type="radio" name="surroundings" value={space.value} checked={surroundings === space.value} onChange={() => change(setSurroundings, space.value)} />
              <span className="space-icon" aria-hidden="true">{space.icon}</span>
              <span><strong>{space.name}</strong><small>{space.hint}</small></span>
              <span className="radio-dot" aria-hidden="true" />
            </label>)}</div>
          </fieldset>
          <fieldset disabled={busy || surroundings === 'balcony'}>
            <legend>Your pace</legend>
            <div className="pace-options">{[['stroll', 'A gentle stroll'], ['stay', 'Stay in one spot']].map(([value, label]) => <label className={`pace-option ${(surroundings === 'balcony' ? 'stay' : pace) === value ? 'selected' : ''}`} key={value}>
              <input type="radio" name="pace" value={value} checked={(surroundings === 'balcony' ? 'stay' : pace) === value} onChange={() => change(setPace, value)} />{label}
            </label>)}</div>
            {surroundings === 'balcony' && <p className="field-note">This activity stays in one spot.</p>}
          </fieldset>
          <button className="primary" disabled={busy} type="submit">{busy ? 'Making your activity…' : 'Find my outside quest'}<span aria-hidden="true">↗</span></button>
          <p className="service-note" role="status">{busy ? 'Your local model is working. On this computer, it may take a few minutes.' : 'Made with local AI. No location tracking.'}</p>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </section>}
      {quest && <section className="quest-section" aria-labelledby="quest-title">
        <div className="quest-topline"><span className="eyebrow">YOUR OUTSIDE QUEST</span><span>{minutes} MIN · {spaces.find(space => space.value === surroundings).name.toUpperCase()}</span></div>
        <div className="quest-card">
          <div className="quest-opening"><span className="quest-flower" aria-hidden="true">✳</span><h2 id="quest-title" tabIndex="-1" ref={heading}>{quest.title}</h2><p>{quest.invitation}</p></div>
          <ol className="steps">{quest.steps.map((step, index) => <li key={index}><span aria-hidden="true">0{index + 1}</span><p>{step}</p></li>)}</ol>
          <div className="reflection"><span className="eyebrow">TO THINK ABOUT AFTERWARDS</span><p>{quest.reflection}</p></div>
          <p className="care-note">Stay in a familiar, permitted space. Observe without disturbing plants or wildlife.</p>
        </div>
        <div className="quest-actions">
          <button className="primary" onClick={() => { setPocket(!pocket); window.scrollTo(0, 0); }}>{pocket ? 'Back to planner' : 'Take this outside'}<span aria-hidden="true">↗</span></button>
          <button className="text-button" onClick={saveQuest}>Save as text <span aria-hidden="true">↓</span></button>
        </div>
        <p className="takeaway-note">{pocket ? 'Read these three steps. Put your phone away. The rest is outside.' : 'Save the activity to read later, without keeping this app open.'}</p>
        <p className="generation-note">Generated with {result.model} · {result.seconds}s</p>
      </section>}
    </main>
    <footer><span>Small adventures. Open possibilities.</span><span>Built for Hacktoberfest 2026 · Touch Grass</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
