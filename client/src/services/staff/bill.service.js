import api from "../api";

export const billService = {
  getEligiblePOs: async () => {
    try {
      const response = await api.get(
        "/staff/purchase-orders/eligible-for-billing",
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load eligible purchase orders.",
      );
    }
  },

  getBills: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vendorId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/staff/bills", {
        params: {
          page,
          limit,
          search,
          status,
          vendor: vendorId,
          branch: branchId,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load supplier bills.",
      );
    }
  },

  getBillDetails: async (id) => {
    try {
      const response = await api.get(`/staff/bills/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load bill details.",
      );
    }
  },

  createBill: async (billData, attachmentFile = null) => {
    try {
      const formData = new FormData();
      formData.append("purchase_order_id", billData.purchase_order_id);
      formData.append("vendor_invoice_number", billData.vendor_invoice_number);
      formData.append("bill_date", billData.bill_date);
      formData.append("status", billData.status);

      if (billData.notes) formData.append("notes", billData.notes);

      formData.append("items", JSON.stringify(billData.items));

      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      const response = await api.post("/staff/bills", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to create supplier bill.",
      );
    }
  },

  confirmReceipt: async (id) => {
    try {
      const response = await api.patch(`/staff/bills/${id}/receive`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to confirm goods receipt.",
      );
    }
  },
};
