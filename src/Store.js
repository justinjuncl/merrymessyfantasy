import create from 'zustand'

export const useGlobalStore = create((set) => ({
    currentFrame: 0,
    setCurrentFrame: (newFrame) => set({ currentFrame: newFrame }),

    language: "kor",
    setLanguage: (newLanguage) => set({ language: newLanguage }),
}));
