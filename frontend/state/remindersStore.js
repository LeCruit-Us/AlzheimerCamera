<<<<<<< HEAD
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
=======
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'reminders_v1';

const defaultReminders = [
  { id: '1', title: 'Take morning medication', time: '8:00 AM', time24: '08:00', description: 'Blood pressure medication', enabled: true },
  { id: '2', title: 'Call doctor', time: '3:00 PM', time24: '15:00', description: 'Schedule follow-up appointment', enabled: false },
];

let reminders = [...defaultReminders];
const listeners = new Set();

const clone = (items) => items.map((item) => ({ ...item }));

function buildNormalizedReminder(reminder) {
  const normalizedTime = normalizeTimeString(reminder.time ?? reminder.time24);
  return {
    ...reminder,
    time: normalizedTime.display,
    time24: normalizedTime.time24,
  };
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.warn('[remindersStore] Failed to persist reminders', error);
  }
}

function notify() {
  const snapshot = clone(reminders);
  listeners.forEach((listener) => listener(snapshot));
}

async function loadInitial() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        reminders = parsed.map(buildNormalizedReminder);
        notify();
        return;
      }
    }
  } catch (error) {
    console.warn('[remindersStore] Failed to load reminders', error);
  }
  reminders = defaultReminders.map(buildNormalizedReminder);
  persist();
  notify();
}

loadInitial();

export function getReminders() {
  return clone(reminders);
>>>>>>> main
}

export function subscribe(listener) {
  listeners.add(listener);
<<<<<<< HEAD
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
=======
  listener(clone(reminders));
  return () => listeners.delete(listener);
}

export async function addReminder(reminder) {
  reminders = [...reminders, buildNormalizedReminder(reminder)];
  await persist();
  notify();
}

export async function updateReminder(id, updates) {
  reminders = reminders.map((reminder) =>
    reminder.id === id ? buildNormalizedReminder({ ...reminder, ...updates }) : reminder
  );
  await persist();
  notify();
}

export async function deleteReminder(id) {
  reminders = reminders.filter((reminder) => reminder.id !== id);
  await persist();
  notify();
}

export function normalizeTimeString(raw) {
  const fallback = { display: '12:00 AM', time24: '00:00' };
  if (raw === null || raw === undefined) {
    return fallback;
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return fallback;
  }

  const twelveHourMatch = trimmed.match(/^([0-9]{1,2}):([0-5][0-9])\s*(am|pm)?$/i);
  if (twelveHourMatch) {
    let hour = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2];
    let suffix = twelveHourMatch[3] ? twelveHourMatch[3].toUpperCase() : null;

    if (suffix) {
      if (hour < 1) hour = 12;
      if (hour > 12) hour = ((hour - 1) % 12) + 1;
      return buildFrom12Hour(hour, minutes, suffix);
    }

    if (hour >= 0 && hour <= 23) {
      return buildFrom24Hour(hour, minutes);
    }

    hour = ((hour - 1) % 12) + 1;
    return buildFrom12Hour(hour, minutes, 'AM');
  }

  const twentyFourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourMatch) {
    const hour = parseInt(twentyFourMatch[1], 10);
    const minutes = twentyFourMatch[2];
    return buildFrom24Hour(hour, minutes);
  }

  return fallback;
}

function buildFrom12Hour(hour12, minutes, suffix) {
  let normalizedHour = hour12;
  if (normalizedHour < 1 || normalizedHour > 12) {
    normalizedHour = ((normalizedHour - 1) % 12) + 1;
  }

  const upper = suffix.toUpperCase();
  const hour24 = upper === 'AM'
    ? normalizedHour % 12
    : (normalizedHour % 12) + 12;

  return {
    display: `${normalizedHour}:${minutes} ${upper}`,
    time24: `${String(hour24).padStart(2, '0')}:${minutes}`,
  };
}

function buildFrom24Hour(hour24, minutes) {
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    display: `${hour12}:${minutes} ${suffix}`,
    time24: `${String(hour24).padStart(2, '0')}:${minutes}`,
  };
}
>>>>>>> main
