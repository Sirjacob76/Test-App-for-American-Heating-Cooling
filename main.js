// =========================================================
// SERVICE GLOBAL ARCHITECTURE STATE
// =========================================================
const STATE = {
  selectedDate: new Date(),
  selectedSlot: null,
  appointments: JSON.parse(localStorage.getItem('user_appointments')) || [],
  availableSlotsMock: ["8:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM"]
};

const LIVE_COUPONS_ENDPOINT = "https://www.americanheatingcooling.com/api/live-deals.json";

// =========================================================
// APPLICATION ROUTE ENGINE INITIALIZATION & MODERN EVENT BINDING
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Bind bottom tab bar navigation buttons dynamically
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-target');
      switchView(targetView);
    });
  });

  // Bind service category filtering chips dynamically
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterValue = chip.getAttribute('data-filter');
      filterServices(filterValue, chip);
    });
  });

  // Bind clicking on actual home service selection rows dynamically
  document.querySelectorAll('.svc-item').forEach(item => {
    item.addEventListener('click', () => {
      const serviceName = item.getAttribute('data-svc');
      quickSelectService(serviceName);
    });
  });

  // Bind calendar date navigation buttons
  const prevBtn = document.getElementById('prev-day-btn');
  const nextBtn = document.getElementById('next-day-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => changeDate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeDate(1));

  // Bind scheduling booking form capture logic
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => handleFormSubmit(e));
  }

  // Initial UI layout builds
  renderCalendar();
  renderAppointmentsDashboard();
  fetchLiveCoupons(); 
  initFaqAccordions();
  setupPWAPrompt();
});

// =========================================================
// CONTENT PUSH FILTER SYSTEM
// =========================================================
function filterServices(category, selectedChip) {
  document.querySelectorAll('.cat-chip').forEach(chip => chip.classList.remove('active'));
  selectedChip.classList.add('active');

  document.querySelectorAll('.svc-item').forEach(item => {
    if (category === 'all' || item.getAttribute('data-cat') === category) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// =========================================================
// WEBSITE DYNAMIC COUPONS MANAGER
// =========================================================
async function fetchLiveCoupons() {
  const container = document.getElementById('live-promo-container');
  if (!container) return;

  try {
    const response = await fetch(LIVE_COUPONS_ENDPOINT);
    if (!response.ok) throw new Error("Stream baseline error");
    const data = await response.json();
    
    container.innerHTML = `
      <div class="promo-card animate-fade">
        <div class="badge">${data.badge}</div>
        <div class="txt">
          <b>${data.title}</b>
          <span>${data.sub}</span>
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = `
      <div class="promo-card animate-fade">
        <div class="badge">$20 OFF</div>
        <div class="txt">
          <b>Seasonal Maintenance Special</b>
          <span>App-Exclusive Offer: Save on your next system Tune-up!</span>
        </div>
      </div>`;
  }
}

// =========================================================
// INTERACTIVE ACCORDIONS ENGINE
// =========================================================
function initFaqAccordions() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const answerPanel = item.querySelector('.faq-a');
    if (!btn || !answerPanel) return;
    
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('open');
        const ans = el.querySelector('.faq-a');
        if (ans) ans.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        answerPanel.style.maxHeight = answerPanel.scrollHeight + "px";
      }
    });
  });
}

// =========================================================
// NAVIGATION VIEW CONTROLLER
// =========================================================
function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
    btn.getAttribute('data-target') === viewId
  );
  if (activeBtn) activeBtn.classList.add('active');

  window.scrollTo(0, 0);
}

function quickSelectService(svcName) {
  const dropdown = document.getElementById('svc-select');
  if (dropdown) dropdown.value = svcName;
  switchView('schedule');
}

// =========================================================
// CALENDAR MECHANICS
// =========================================================
function changeDate(days) {
  STATE.selectedDate.setDate(STATE.selectedDate.getDate() + days);
  STATE.selectedSlot = null;
  const summary = document.getElementById('booking-summary');
  if (summary) summary.style.display = 'none';
  renderCalendar();
}

function renderCalendar() {
  const dateStr = STATE.selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  
  const displayEl = document.getElementById('calendar-date-display');
  if (displayEl) displayEl.innerText = dateStr;

  const grid = document.getElementById('slots-grid');
  if (!grid) return;

  grid.innerHTML = STATE.availableSlotsMock.map(slot => {
    const isTaken = STATE.appointments.some(a => a.date === dateStr && a.time === slot);
    return isTaken ? 
      `<div class="slot-card" style="opacity:0.4; cursor:not-allowed; background:#F1F5F9;"><b>Booked</b><span style="color:var(--red)">Unavailable</span></div>` :
      `<div class="slot-card ${STATE.selectedSlot === slot ? 'selected' : ''}" data-slot="${slot}"><b>${slot}</b><span style="color:var(--blue)">Available</span></div>`;
  }).join('');

  // Dynamically attach slot card choice event handlers
  grid.querySelectorAll('.slot-card[data-slot]').forEach(card => {
    card.addEventListener('click', () => {
      const slotTime = card.getAttribute('data-slot');
      selectSlot(slotTime);
    });
  });
}

function selectSlot(slot) {
  STATE.selectedSlot = slot;
  renderCalendar();
  const summary = document.getElementById('booking-summary');
  if (!summary) return;
  
  const selectionDropdown = document.getElementById('svc-select');
  const selectedService = selectionDropdown ? selectionDropdown.value : "HVAC Service";
  
  summary.style.display = 'block';
  summary.innerHTML = `<b>Selected Window:</b><p>${selectedService} on ${STATE.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} during ${slot}</p>`;
}

// =========================================================
// APPOINTMENTS REGISTRATION & STORAGE MUTATOR
// =========================================================
function handleFormSubmit(e) {
  e.preventDefault();
  if (!STATE.selectedSlot) return alert("Select an open time frame first.");

  const selectionDropdown = document.getElementById('svc-select');
  const selectedService = selectionDropdown ? selectionDropdown.value : "HVAC Service";

  const newAppt = {
    id: 'appt_' + Date.now(),
    date: STATE.selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: STATE.selectedSlot,
    service: selectedService,
    name: document.getElementById('cust-name').value,
    phone: document.getElementById('cust-phone').value
  };

  STATE.appointments.push(newAppt);
  localStorage.setItem('user_appointments', JSON.stringify(STATE.appointments));
  
  STATE.selectedSlot = null;
  const summary = document.getElementById('booking-summary');
  if (summary) summary.style.display = 'none';
  e.target.reset();
  
  renderCalendar();
  renderAppointmentsDashboard();
  switchView('bookings');
}

function renderAppointmentsDashboard() {
  const container = document.getElementById('user-appointments-list');
  if (!container) return;
  
  if (STATE.appointments.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px 0; color:var(--ink-soft); font-size:13px;">No upcoming service bookings found.</div>`;
    return;
  }

  container.innerHTML = STATE.appointments.map(appt => `
    <div class="user-appt-card animate-fade" id="${appt.id}">
      <div class="appt-main">
        <div>
          <b>${appt.service}</b>
          <span>${appt.date} • ${appt.time}</span>
          <span style="font-size:11px; margin-top:4px; display:block; color:var(--ink-soft)">For: ${appt.name}</span>
        </div>
        <button class="cancel-appt-btn" data-cancel-id="${appt.id}">Cancel</button>
      </div>
    </div>
  `).join('');

  // Dynamically attach cancellation listener actions
  container.querySelectorAll('.cancel-appt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-cancel-id');
      cancelAppointment(targetId);
    });
  });
}

function cancelAppointment(id) {
  if (confirm("Are you sure you want to cancel this scheduled service appointment?")) {
    STATE.appointments = STATE.appointments.filter(appt => appt.id !== id);
    localStorage.setItem('user_appointments', JSON.stringify(STATE.appointments));
    renderAppointmentsDashboard();
    renderCalendar();
  }
}

// =========================================================
// PWA STANDBY SETUP
// =========================================================
function setupPWAPrompt() {
  let deferredPrompt;
  const banner = document.getElementById('install-banner');
  if (!banner) return;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.add('show');
  });
  
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        banner.classList.remove('show');
        deferredPrompt = null;
      });
    });
  }
}