import {
    createContext,
    useContext,
    useRef,
    type ReactNode,
    type MutableRefObject,
} from 'react';

export interface IntroSharedState {
    ballX: number;
    ballY: number;
    ballZ: number;
    ballScale: number;
    ballOpacity: number;
    /** espace entre le bas du ballon et le parquet */
    ballGap: number;
}

interface IntroContextValue {
    state: MutableRefObject<IntroSharedState>;
}

const IntroContext = createContext<IntroContextValue | null>(null);

export const IntroProvider = ({ children }: { children: ReactNode }) => {
    const state = useRef<IntroSharedState>({
        ballX: 0,
        ballY: 1,
        ballZ: 0,
        ballScale: 1,
        ballOpacity: 1,
        ballGap: 0,
    });

    return (
        <IntroContext.Provider value={{ state }}>
            {children}
        </IntroContext.Provider>
    );
};

export const useIntroState = (): MutableRefObject<IntroSharedState> => {
    const ctx = useContext(IntroContext);
    if (!ctx) throw new Error('useIntroState must be used within IntroProvider');
    return ctx.state;
};
