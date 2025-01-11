const BASE_URL = 'http://localhost:8080/api';

export const fetchEmployee = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/employee/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee data');
    }
    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

