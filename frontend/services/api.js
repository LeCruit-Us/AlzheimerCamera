// Use your computer's IP address for mobile testing
const API_BASE_URL = __DEV__ ? 'http://172.17.204.88:8000' : 'http://localhost:8000';

export const api = {
  // Recognize a person from image
  async recognizePerson(imageBase64) {
    const response = await fetch(`${API_BASE_URL}/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64
      })
    });
    return response.json();
  },

  // Add a new person
  async addPerson(imageBase64, name, relationship, age, notes) {
    const response = await fetch(`${API_BASE_URL}/add_person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        name,
        relationship,
        age: parseInt(age) || null,
        notes
      })
    });
    return response.json();
  },

  // Get all people (reminders)
  async getReminders() {
    const response = await fetch(`${API_BASE_URL}/reminders`);
    return response.json();
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};

// Helper function to convert image URI to base64 (React Native compatible)
export const imageToBase64 = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    console.log('Backend connection:', result);
    return result;
  } catch (error) {
    console.error('Backend connection failed:', error);
    throw error;
  }
};