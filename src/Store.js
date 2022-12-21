import create from 'zustand'

export const useGlobalStore = create((set) => ({
    currentFrame: 0,
    setCurrentFrame: (newFrame) => set({ currentFrame: newFrame }),

    language: "eng",
    setLanguage: (newLanguage) => set({ language: newLanguage }),
}));
