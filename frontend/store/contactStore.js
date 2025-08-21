import { create } from 'zustand';

export const useContactStore = create((set) => ({
  contactsUpdated: false,
  setContactsUpdated: (value) => set({ contactsUpdated: value }),
}));
