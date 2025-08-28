import { create } from "zustand";

export const useContactStore = create((set) => ({
  contacts: [],
  contactsUpdated: false,
  setContacts: (contacts) => set({ contacts }),
  setContactsUpdated: (v) => set({ contactsUpdated: v }),
  resetContacts: () => set({ contacts: [], contactsUpdated: false }),
}));
