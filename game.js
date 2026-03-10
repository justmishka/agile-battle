import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ─── FIREBASE CONFIG ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCt5M_N1jj488Cgqm-IHIUXObxHmyTW4fQ",
  authDomain:        "agile-contest-project.firebaseapp.com",
  databaseURL:       "https://agile-contest-project-default-rtdb.firebaseio.com",
  projectId:         "agile-contest-project",
  storageBucket:     "agile-contest-project.firebasestorage.app",
  messagingSenderId: "40420841168",
  appId:             "1:40420841168:web:2fa9ce33609ea21a8e70d5"
};
// ──────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ═══════════════════════════════════
// QUESTION BANK
// ═══════════════════════════════════
const QUESTIONS = [
  { id:1,  cat:'scrum',  type:'mcq',  text:'In Scrum, who is responsible for maximizing the value of the product?', options:['Scrum Master','Development Team','Product Owner','Stakeholders'], answer:2, explanation:'The Product Owner owns the Product Backlog and is accountable for maximizing value.' },
  { id:2,  cat:'scrum',  type:'tf',   text:'In Scrum, the Sprint Retrospective happens BEFORE the Sprint Review.', answer:false, explanation:'Sprint Review comes first, then the Sprint Retrospective.' },
  { id:3,  cat:'scrum',  type:'mcq',  text:'What is the maximum recommended length of a Sprint?', options:['1 week','2 weeks','4 weeks','6 weeks'], answer:2, explanation:'Sprints are 1 month (4 weeks) maximum per the Scrum Guide.' },
  { id:4,  cat:'scrum',  type:'mcq',  text:'Which artifact represents work selected for the current Sprint?', options:['Product Backlog','Sprint Backlog','Increment','Release Plan'], answer:1, explanation:'The Sprint Backlog = Sprint Goal + selected items + plan to deliver the Increment.' },
  { id:5,  cat:'scrum',  type:'fill', text:'In Scrum, the daily 15-minute event for developers is called the "Daily ___".', answer:'scrum', hint:'Type the missing word…', explanation:'The Daily Scrum is a 15-min inspection and adaptation event for the Developers.' },
  { id:6,  cat:'scrum',  type:'tf',   text:'The Scrum Master is the team lead who assigns tasks to developers.', answer:false, explanation:'The Scrum Master is a servant-leader, NOT a manager or task assigner.' },
  { id:7,  cat:'scrum',  type:'mcq',  text:'What is "Definition of Done"?', options:['Acceptance criteria for a story','Shared understanding of what complete means','A QA checklist','The PO\'s sign-off'], answer:1, explanation:'DoD is the shared quality standard that creates transparency across the Scrum Team.' },
  { id:8,  cat:'scrum',  type:'mcq',  text:'Who is accountable for the Product Backlog?', options:['Scrum Master','Development Team','Product Owner','Stakeholders'], answer:2, explanation:'The Product Owner is accountable for the Product Backlog, though anyone can add items.' },
  { id:9,  cat:'kanban', type:'mcq',  text:'Which Kanban practice limits work in each workflow stage?', options:['Daily standup','WIP Limit','Sprint Goal','Velocity'], answer:1, explanation:'WIP (Work In Progress) limits are a core Kanban practice to improve flow.' },
  { id:10, cat:'kanban', type:'tf',   text:'Kanban requires time-boxed iterations like Scrum Sprints.', answer:false, explanation:'Kanban is a continuous-flow system — iterations are optional, not required.' },
  { id:11, cat:'kanban', type:'mcq',  text:'What metric measures time from work starting to delivery?', options:['Throughput','Cycle Time','Lead Time','Velocity'], answer:1, explanation:'Cycle Time = start of work → delivery. Lead Time includes waiting time before start.' },
  { id:12, cat:'kanban', type:'mcq',  text:'What does a Cumulative Flow Diagram reveal?', options:['Team velocity','Burn-down of work','Work in each stage over time','Sprint progress'], answer:2, explanation:'CFD bands show how much work sits in each workflow state across time, surfacing bottlenecks.' },
  { id:13, cat:'kanban', type:'tf',   text:'In Kanban, you should push as much work as possible to keep everyone busy.', answer:false, explanation:'Kanban uses pull systems and WIP limits — overloading the system kills flow.' },
  { id:14, cat:'kanban', type:'fill', text:'The Kanban practice of limiting work in progress helps manage ___.', answer:'flow', hint:'Type the missing word…', explanation:'Limiting WIP is central to managing and improving flow through the system.' },
  { id:15, cat:'agile',  type:'mcq',  text:'Which is NOT one of the 4 Agile Manifesto values?', options:['Individuals and interactions over processes','Working software over documentation','Customer collaboration over contracts','Following a plan over responding to change'], answer:3, explanation:'The Manifesto values RESPONDING TO CHANGE over following a plan — the opposite!' },
  { id:16, cat:'agile',  type:'tf',   text:'The Agile Manifesto was written in 2001.', answer:true, explanation:'17 practitioners signed it in Snowbird, Utah, February 2001.' },
  { id:17, cat:'agile',  type:'mcq',  text:'A User Story is typically written from whose perspective?', options:['Developer','Tester','End user','Product Owner'], answer:2, explanation:'Format: "As a [user], I want [goal] so that [benefit]."' },
  { id:18, cat:'agile',  type:'mcq',  text:'What is "technical debt"?', options:['Budget overrun','Cost of shortcuts that require future rework','Unpaid licenses','Incomplete backlog items'], answer:1, explanation:'Technical debt = the implied cost of rework caused by choosing quick shortcuts.' },
  { id:19, cat:'agile',  type:'tf',   text:'A "Spike" in Agile is a time-boxed investigation to reduce uncertainty.', answer:true, explanation:'Spikes research, prototype or explore to gain knowledge needed for estimation.' },
  { id:20, cat:'agile',  type:'mcq',  text:'How many principles are in the Agile Manifesto?', options:['4','8','12','16'], answer:2, explanation:'The Agile Manifesto has 4 values and 12 principles.' },
];

// ═══════════════════════════════════
// LOCAL STATE
// ═══════════════════════════════════
let me = { slot: null, name: '', roomCode: '' };
let roomRef = null;
let unsubRoom = null;
let localTimer = null;
let localTimeLeft = 15;
let hasAnswered = false;
let gameQuestions = [];
let lastStatus = '';
let lastQRendered = -1;
let roundResultShown = false;
let hostAdvanceScheduled = false;

// ═══════════════════════════════════
// UTILS
// ═══════════════════════════════════
function genCode() { return Math.random().toString(36).substring(2,7).toUpperCase(); }

function seededShuffle(arr, seed) {
  const a = [...arr]; let s = seed;
  for (let i = a.length-1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s/233280)*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function calcPoints(timeLeft) { return 100 + Math.floor(timeLeft * 6.67); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function avgTime(times) {
  if (!times||!times.length) return '0';
  return (times.reduce((a,b)=>a+b,0)/times.length).toFixed(1);
}

function updateTimerUI(t, max) {
  document.getElementById('timer-num').textContent = t;
  const offset = 138 - (t/max)*138;
  const fill = document.getElementById('timer-fill');
  fill.style.strokeDashoffset = offset;
  fill.style.stroke = t>8 ? 'var(--accent2)' : t>4 ? 'var(--accent3)' : 'var(--red)';
}

function updateScoreHeader(room) {
  if (!room.scores) return;
  const myScore  = room.scores[me.slot] || 0;
  const oppSlot  = me.slot==='host' ? 'guest' : 'host';
  const oppScore = room.scores[oppSlot] || 0;
  const oppName  = me.slot==='host' ? (room.guest||'…') : room.host;
  document.getElementById('h-my-name').textContent  = me.name;
  document.getElementById('h-my-pts').textContent   = myScore;
  document.getElementById('h-opp-name').textContent = oppName;
  document.getElementById('h-opp-pts').textContent  = oppScore;
}

// ═══════════════════════════════════
// CREATE ROOM
// ═══════════════════════════════════
window.createRoom = async function() {
  const name = document.getElementById('create-name').value.trim();
  if (!name) { alert('Enter your name first!'); return; }
  const btn = document.querySelector('#panel-create .btn');
  btn.textContent = 'Creating…'; btn.disabled = true;

  const code = genCode();
  const seed = Date.now();

  await set(ref(db, `rooms/${code}`), {
    host: name, guest: null,
    status: 'waiting',
    currentQ: 0, seed,
    scores:  { host:0, guest:0 },
    correct: { host:0, guest:0 },
    times:   { host:[], guest:[] },
    answers: {},
    created: Date.now()
  });

  me = { slot:'host', name, roomCode:code };
  roomRef = ref(db, `rooms/${code}`);
  setupWaitScreen(code, name, null);
  showScreen('waiting-screen');
  listenRoom();
};

// ═══════════════════════════════════
// JOIN ROOM
// ═══════════════════════════════════
window.joinRoom = async function() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name || !code) { alert('Enter both your name and the room code.'); return; }
  const btn = document.querySelector('#panel-join .btn');
  btn.textContent = 'Joining…'; btn.disabled = true;

  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) { alert('Room not found! Check the code.'); btn.textContent='🚀 Join Battle'; btn.disabled=false; return; }
  const room = snap.val();
  if (room.guest)              { alert('Room is full!');          btn.textContent='🚀 Join Battle'; btn.disabled=false; return; }
  if (room.status !== 'waiting') { alert('Game already started!'); btn.textContent='🚀 Join Battle'; btn.disabled=false; return; }

  me = { slot:'guest', name, roomCode:code };
  roomRef = ref(db, `rooms/${code}`);
  await update(roomRef, { guest: name, status: 'ready' });

  setupWaitScreen(code, room.host, name);
  showScreen('waiting-screen');
  listenRoom();
};

function setupWaitScreen(code, host, guest) {
  document.getElementById('room-code-display').textContent = code;
  document.getElementById('waiting-host-name').textContent = host;
  document.getElementById('join-waiting-guest').textContent = guest || 'Waiting…';
  document.getElementById('join-waiting-guest').style.opacity = guest ? '1' : '0.4';
  document.getElementById('guest-joined-line').style.display = guest ? 'block' : 'none';
  document.getElementById('start-battle-btn').style.display = 'none';
}

// ═══════════════════════════════════
// ROOM LISTENER
// ═══════════════════════════════════
function listenRoom() {
  if (unsubRoom) unsubRoom();
  unsubRoom = onValue(roomRef, snap => {
    if (!snap.exists()) return;
    handleRoom(snap.val());
  });
}

function handleRoom(room) {
  updateScoreHeader(room);

  if (room.status === 'ready') {
    document.getElementById('join-waiting-guest').textContent = room.guest;
    document.getElementById('join-waiting-guest').style.opacity = '1';
    document.getElementById('guest-joined-line').style.display = 'block';
    document.getElementById('guest-joined-line').textContent = room.guest + ' joined! ✅';
    if (me.slot === 'host') document.getElementById('start-battle-btn').style.display = 'block';
    else document.getElementById('start-battle-btn').style.display = 'none';
  }

  if (room.status === 'countdown' && lastStatus !== 'countdown') {
    lastStatus = 'countdown';
    showScreen('countdown-screen');
    runCountdown();
  }

  if (room.status === 'playing') {
    if (lastStatus !== 'playing') {
      lastStatus = 'playing';
      gameQuestions = seededShuffle(QUESTIONS, room.seed);
      showScreen('quiz-screen');
    }

    const qIdx = room.currentQ;

    if (qIdx !== lastQRendered) {
      lastQRendered = qIdx;
      roundResultShown = false;
      hostAdvanceScheduled = false;
      hasAnswered = false;
      loadQuestion(room, qIdx);
    }

    const oppSlot = me.slot==='host' ? 'guest' : 'host';
    const myAnswered  = !!(room.answers && room.answers['q'+qIdx+'_'+me.slot]  !== undefined);
    const oppAnswered = !!(room.answers && room.answers['q'+qIdx+'_'+oppSlot] !== undefined);

    if (oppAnswered) document.getElementById('opp-answered').style.opacity = '1';

    if (myAnswered && oppAnswered && !roundResultShown) {
      roundResultShown = true;
      showRoundResult(room, qIdx);
      if (me.slot === 'host' && !hostAdvanceScheduled) {
        hostAdvanceScheduled = true;
        setTimeout(async () => {
          const nextQ = qIdx + 1;
          if (nextQ >= gameQuestions.length)  await update(roomRef, { status:'results',     currentQ: nextQ });
          else if (nextQ % 5 === 0)           await update(roomRef, { status:'leaderboard', currentQ: nextQ });
          else                                await update(roomRef, { currentQ: nextQ });
        }, 3500);
      }
    }
  }

  if (room.status === 'leaderboard' && lastStatus !== 'leaderboard') {
    lastStatus = 'leaderboard';
    clearInterval(localTimer);
    showLeaderboard(room);
  }

  if (room.status === 'results' && lastStatus !== 'results') {
    lastStatus = 'results';
    clearInterval(localTimer);
    showFinalResults(room);
  }
}

// ═══════════════════════════════════
// START / COUNTDOWN
// ═══════════════════════════════════
window.startBattle = async function() {
  await update(roomRef, { status: 'countdown' });
};

function runCountdown() {
  let n = 3;
  const el = document.getElementById('countdown-num');
  el.textContent = n;
  const iv = setInterval(() => {
    n--;
    if (n > 0) {
      el.textContent = n;
      el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'countPop 0.5s ease';
    } else {
      clearInterval(iv);
      if (me.slot === 'host') update(roomRef, { status:'playing', currentQ:0 });
    }
  }, 1000);
}

// ═══════════════════════════════════
// LOAD QUESTION
// ═══════════════════════════════════
function loadQuestion(room, qIdx) {
  clearInterval(localTimer);
  hasAnswered = false;
  roundResultShown = false;
  hostAdvanceScheduled = false;
  document.getElementById('round-result').classList.remove('show');
  document.getElementById('opp-answered').style.opacity = '0';
  document.getElementById('my-answer-indicator').style.opacity = '0';

  const q = gameQuestions[qIdx];
  const total = gameQuestions.length;

  document.getElementById('q-counter').textContent = `Q ${qIdx+1} / ${total}`;
  document.getElementById('progress-fill').style.width = ((qIdx+1)/total*100)+'%';

  const tagEl = document.getElementById('q-tag');
  tagEl.textContent = q.cat.toUpperCase();
  tagEl.className   = 'q-tag tag-'+q.cat;

  const types = { mcq:'Multiple Choice', tf:'True / False', fill:'Fill in Blank' };
  document.getElementById('q-type-badge').textContent = types[q.type]||q.type;
  document.getElementById('q-text').textContent = q.text;
  document.getElementById('q-answer-area').innerHTML = '';

  if (q.type==='mcq')  renderMCQ(q, qIdx);
  else if (q.type==='tf')   renderTF(q, qIdx);
  else if (q.type==='fill') renderFill(q, qIdx);

  localTimeLeft = 15;
  updateTimerUI(15, 15);
  localTimer = setInterval(() => {
    localTimeLeft--;
    updateTimerUI(localTimeLeft, 15);
    if (localTimeLeft <= 0) {
      clearInterval(localTimer);
      if (!hasAnswered) submitAnswer(false, 0, 15, q, qIdx);
    }
  }, 1000);
}

// ═══════════════════════════════════
// RENDER TYPES
// ═══════════════════════════════════
function renderMCQ(q, qIdx) {
  const grid = document.createElement('div');
  grid.className = 'options-grid';
  ['A','B','C','D'].forEach((ltr, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.id = `opt-${i}`;
    btn.innerHTML = `<span class="opt-letter">${ltr}</span>${q.options[i]}`;
    btn.onclick = () => {
      if (hasAnswered) return;
      const correct = i === q.answer;
      const pts = correct ? calcPoints(localTimeLeft) : 0;
      const timeUsed = 15 - localTimeLeft;
      btn.classList.add(correct?'correct':'wrong');
      document.getElementById(`opt-${q.answer}`).classList.add('correct');
      document.querySelectorAll('.option-btn').forEach(b=>b.disabled=true);
      submitAnswer(correct, pts, timeUsed, q, qIdx);
    };
    grid.appendChild(btn);
  });
  document.getElementById('q-answer-area').appendChild(grid);
}

function renderTF(q, qIdx) {
  const grid = document.createElement('div');
  grid.className = 'tf-grid';
  ['True','False'].forEach((lbl, i) => {
    const btn = document.createElement('button');
    btn.className = 'tf-btn '+(i===0?'true-btn':'false-btn');
    btn.id = `tf-${i}`;
    btn.innerHTML = `<span class="tf-icon">${i===0?'✅':'❌'}</span>${lbl}`;
    btn.onclick = () => {
      if (hasAnswered) return;
      const chosen = (i===0);
      const correct = chosen === q.answer;
      const pts = correct ? calcPoints(localTimeLeft) : 0;
      const timeUsed = 15 - localTimeLeft;
      document.getElementById(`tf-${i}`).classList.add(correct?'correct':'wrong');
      document.getElementById(q.answer?'tf-0':'tf-1').classList.add('correct');
      document.querySelectorAll('.tf-btn').forEach(b=>b.disabled=true);
      submitAnswer(correct, pts, timeUsed, q, qIdx);
    };
    grid.appendChild(btn);
  });
  document.getElementById('q-answer-area').appendChild(grid);
}

function renderFill(q, qIdx) {
  const inp = document.createElement('input');
  inp.type='text'; inp.className='fill-input';
  inp.placeholder = q.hint||'Type your answer…';
  const sbtn = document.createElement('button');
  sbtn.className='fill-submit'; sbtn.textContent='Submit Answer';
  const doSubmit = () => {
    if (hasAnswered) return;
    const val = inp.value.trim().toLowerCase();
    if (!val) return;
    const correct = q.answer.toLowerCase().split('|').some(a=>val.includes(a));
    const pts = correct ? calcPoints(localTimeLeft) : 0;
    const timeUsed = 15 - localTimeLeft;
    inp.classList.add(correct?'correct':'wrong');
    inp.disabled=true; sbtn.disabled=true;
    submitAnswer(correct, pts, timeUsed, q, qIdx);
  };
  inp.addEventListener('keydown', e=>{if(e.key==='Enter')doSubmit();});
  sbtn.onclick = doSubmit;
  const area = document.getElementById('q-answer-area');
  area.appendChild(inp); area.appendChild(sbtn);
  setTimeout(()=>inp.focus(),100);
}

// ═══════════════════════════════════
// SUBMIT ANSWER
// ═══════════════════════════════════
async function submitAnswer(correct, pts, timeUsed, q, qIdx) {
  if (hasAnswered) return;
  hasAnswered = true;
  clearInterval(localTimer);

  const snap = await get(roomRef);
  const room = snap.val();

  const newScore   = (room.scores?.[me.slot]  || 0) + pts;
  const newCorrect = (room.correct?.[me.slot] || 0) + (correct ? 1 : 0);
  const times      = [...(room.times?.[me.slot]  || []), timeUsed];

  const upd = {};
  upd[`answers/q${qIdx}_${me.slot}`] = { correct, pts, timeUsed };
  upd[`scores/${me.slot}`]            = newScore;
  upd[`correct/${me.slot}`]           = newCorrect;
  upd[`times/${me.slot}`]             = times;
  await update(roomRef, upd);

  const ind = document.getElementById('my-answer-indicator');
  ind.textContent = correct ? `✅ +${pts}` : '❌ +0';
  ind.style.color   = correct ? 'var(--green)' : 'var(--red)';
  ind.style.opacity = '1';
}

// ═══════════════════════════════════
// ROUND RESULT OVERLAY
// ═══════════════════════════════════
function showRoundResult(room, qIdx) {
  const q = gameQuestions[qIdx];
  const oppSlot = me.slot==='host'?'guest':'host';
  const myA  = room.answers[`q${qIdx}_${me.slot}`];
  const oppA = room.answers[`q${qIdx}_${oppSlot}`];
  const oppName = me.slot==='host' ? room.guest : room.host;
  const myColor  = me.slot==='host' ? 'var(--p1)' : 'var(--p2)';
  const oppColor = me.slot==='host' ? 'var(--p2)' : 'var(--p1)';

  const myFaster  = myA  && myA.correct  && oppA && oppA.correct && myA.timeUsed  < oppA.timeUsed;
  const oppFaster = oppA && oppA.correct && myA  && myA.correct  && oppA.timeUsed < myA.timeUsed;
  const speedBonus = 50;

  const myPts  = myA  ? myA.pts  + (myFaster  ? speedBonus : 0) : 0;
  const oppPts = oppA ? oppA.pts + (oppFaster ? speedBonus : 0) : 0;

  const rrEl = document.getElementById('round-result');
  rrEl.innerHTML = `
    <div class="rr-inner">
      <div class="rr-row">
        <span class="rr-name" style="color:${myColor}">${me.name} (you)</span>
        <span class="rr-pts" style="color:${myA&&myA.correct?'var(--green)':'var(--muted)'}">${myA&&myA.correct?'+'+myPts:'+0'}</span>
        ${myFaster?'<span class="rr-bonus">⚡ faster!</span>':''}
      </div>
      <div class="rr-row" style="opacity:0.75">
        <span class="rr-name" style="color:${oppColor}">${oppName}</span>
        <span class="rr-pts" style="color:${oppA&&oppA.correct?'var(--green)':'var(--muted)'}">${oppA&&oppA.correct?'+'+oppPts:'+0'}</span>
        ${oppFaster?'<span class="rr-bonus">⚡ faster!</span>':''}
      </div>
      <div class="rr-explain">${q.explanation}</div>
    </div>`;
  rrEl.classList.add('show');
}

// ═══════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════
function showLeaderboard(room) {
  showScreen('leaderboard-screen');
  const h = { name:room.host,  score:room.scores.host||0,  correct:room.correct.host||0,  times:room.times?.host||[] };
  const g = { name:room.guest, score:room.scores.guest||0, correct:room.correct.guest||0, times:room.times?.guest||[] };
  const hLeads = h.score >= g.score;
  const leader  = hLeads ? h : g;
  const trailer = hLeads ? g : h;
  const lColor  = hLeads ? 'var(--p1)' : 'var(--p2)';
  const tColor  = hLeads ? 'var(--p2)' : 'var(--p1)';
  const gap     = Math.abs(h.score - g.score);

  document.getElementById('lb-content').innerHTML = `
    <div class="lb-player leader">
      <div class="lb-rank">🥇</div>
      <div class="lb-info">
        <div class="lb-name" style="color:${lColor}">${leader.name}</div>
        <div class="lb-detail">${leader.correct} correct · avg ${avgTime(leader.times)}s</div>
      </div>
      <div class="lb-score" style="color:${lColor}">${leader.score}</div>
    </div>
    <div class="lb-player trailing">
      <div class="lb-rank">🥈</div>
      <div class="lb-info">
        <div class="lb-name" style="color:${tColor}">${trailer.name}</div>
        <div class="lb-detail">${trailer.correct} correct · avg ${avgTime(trailer.times)}s</div>
      </div>
      <div class="lb-score" style="color:${tColor}">${trailer.score}</div>
    </div>`;

  document.getElementById('lb-gap-text').textContent = gap===0
    ? "🔥 It's a TIE — anything can happen!"
    : `${leader.name} leads by ${gap} pts — ${trailer.name} can still turn this around!`;

  if (me.slot==='host') setTimeout(()=>update(roomRef,{status:'playing'}), 5000);
  setTimeout(() => { lastStatus='playing'; showScreen('quiz-screen'); }, 5100);
}

// ═══════════════════════════════════
// FINAL RESULTS
// ═══════════════════════════════════
function showFinalResults(room) {
  clearInterval(localTimer);
  const h = { name:room.host,  score:room.scores.host||0,  correct:room.correct.host||0,  times:room.times?.host||[] };
  const g = { name:room.guest, score:room.scores.guest||0, correct:room.correct.guest||0, times:room.times?.guest||[] };
  const tie = h.score===g.score;
  const winner = h.score>g.score ? h : g.score>h.score ? g : null;

  document.getElementById('winner-crown').textContent  = tie ? '🤝' : '🏆';
  document.getElementById('winner-name').textContent   = tie ? "It's a Tie!" : winner.name;
  document.getElementById('winner-name').style.color   = tie ? 'var(--accent3)' : (winner===h?'var(--p1)':'var(--p2)');
  document.getElementById('winner-subtitle').textContent = tie ? 'Both are Agile Masters!' : 'is the Agile Master!';

  document.getElementById('final-scores').innerHTML = `
    <div class="final-score-card ${!tie&&winner===h?'winner-card':''}">
      <div class="fsc-name" style="color:var(--p1)">${h.name}</div>
      <div class="fsc-pts" style="color:var(--p1)">${h.score}</div>
      <div class="fsc-stat">${h.correct}/${QUESTIONS.length} correct</div>
      <div class="fsc-stat">avg ${avgTime(h.times)}s / answer</div>
    </div>
    <div class="final-score-card ${!tie&&winner===g?'winner-card':''}">
      <div class="fsc-name" style="color:var(--p2)">${g.name}</div>
      <div class="fsc-pts" style="color:var(--p2)">${g.score}</div>
      <div class="fsc-stat">${g.correct}/${QUESTIONS.length} correct</div>
      <div class="fsc-stat">avg ${avgTime(g.times)}s / answer</div>
    </div>`;

  showScreen('final-screen');
  if (!tie) launchConfetti();
}

// ═══════════════════════════════════
// CONFETTI
// ═══════════════════════════════════
function launchConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  wrap.innerHTML = '';
  const colors = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#ec4899'];
  for (let i=0;i<80;i++) {
    const p = document.createElement('div');
    p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}%;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*2}s;width:${4+Math.random()*8}px;height:${4+Math.random()*8}px;`;
    wrap.appendChild(p);
  }
  setTimeout(()=>wrap.innerHTML='', 5000);
}

// ═══════════════════════════════════
// TAB SWITCH
// ═══════════════════════════════════
window.showTab = function(tab) {
  document.getElementById('tab-create').classList.toggle('active-tab', tab==='create');
  document.getElementById('tab-join').classList.toggle('active-tab',   tab==='join');
  document.getElementById('panel-create').style.display = tab==='create'?'block':'none';
  document.getElementById('panel-join').style.display   = tab==='join'?'block':'none';
};

// Enter key helpers
document.addEventListener('DOMContentLoaded', () => {
  ['create-name'].forEach(id => document.getElementById(id)?.addEventListener('keydown', e=>{if(e.key==='Enter')createRoom();}));
  ['join-name','join-code'].forEach(id => document.getElementById(id)?.addEventListener('keydown', e=>{if(e.key==='Enter')joinRoom();}));
});
