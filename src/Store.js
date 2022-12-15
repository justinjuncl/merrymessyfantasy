import create from 'zustand'

export const useFrameStore = create((set) => ({
    currentFrame: 0,
    setCurrentFrame: (newFrame) => set({ currentFrame: newFrame }),
}));
