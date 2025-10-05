const listeners = new Set();

let reminders = [
  { id: '1', title: 'Take morning medication', time: '08:00', description: 'Blood pressure medication', enabled: true },
  { id: '2', title: 'Call doctor', time: '15:00', description: 'Schedule follow-up appointment', enabled: false },
];

function notify() {
  const snapshot = reminders.map((item) => ({ ...item }));
  listeners.forEach((listener) => listener(snapshot));
}

export function getReminders() {
  return reminders.map((item) => ({ ...item }));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addReminder(reminder) {
  reminders = [...reminders, { ...reminder }];
  notify();
}

export function updateReminder(id, updates) {
  reminders = reminders.map((reminder) =>
    reminder.id === id ? { ...reminder, ...updates } : reminder
  );
  notify();
}

export function deleteReminder(id) {
  reminders = reminders.filter((reminder) => reminder.id !== id);
  notify();
}
