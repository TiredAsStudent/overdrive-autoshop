import api from "./api";

const checkInService = {
  searchPlate: async (plate) => {
    try {
      const response = await api.get(`/staff/checkin/search/${plate}`);
      return response.data.data; // { isFound, vehicle: {...} }
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || "Search failed.");
    }
  },

  submitCheckIn: async (data) => {
    try {
      const response = await api.post("/staff/checkin", data);
      return response.data; // { data: { jobCardId, warning, magicLink }, message }
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Check-In failed.",
      );
    }
  },
};

export default checkInService;
