import { useRef } from 'react';
import {
    useGsapAnimation,
    useScrollReveal,
    useCounterAnimation,
    useTiltEffect,
    useParallax,
    useHoverAnimation,
} from '../hooks/UseGspaAnimation';
import gsap from 'gsap';

/**
 * Exemple 1: useGsapAnimation - Contexte simple
 */
export const SimpleAnimationExample = () => {
    const containerRef = useGsapAnimation(() => {
        // Animations ici
        gsap.fromTo('h1', { opacity: 0 }, { opacity: 1, duration: 1 });
    });

    return (
        <div ref={containerRef}>
            <h1>Hello GSAP</h1>
        </div>
    );
};

/**
 * Exemple 2: useScrollReveal - Animations au scroll
 */
export const ScrollRevealExample = () => {
    const elementRef = useRef<HTMLDivElement>(null);

    useScrollReveal(elementRef, {
        start: 'top 70%',
        end: 'top 40%',
        scrub: 1.5,
    });

    return (
        <div
            ref={elementRef}
            className="text-4xl font-bold text-center py-20"
        >
            Cette div apparaît au scroll
        </div>
    );
};

/**
 * Exemple 3: useCounterAnimation - Compter jusqu'à un nombre
 */
export const CounterExample = () => {
    const counterRef = useRef<HTMLDivElement>(null);

    useCounterAnimation(counterRef, 1000, {
        duration: 3,
        ease: 'expo.out',
        suffix: '+',
    });

    return (
        <div ref={counterRef} className="text-6xl font-bold text-orange-500">
            0+
        </div>
    );
};

/**
 * Exemple 4: useTiltEffect - 3D tilt au hover
 */
export const TiltEffectExample = () => {
    const cardRef = useRef<HTMLDivElement>(null);

    useTiltEffect(cardRef, 1.5);

    return (
        <div
            ref={cardRef}
            className="w-64 h-64 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl flex items-center justify-center text-white font-bold cursor-pointer"
            style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d',
            }}
        >
            Hover pour 3D effect
        </div>
    );
};

/**
 * Exemple 5: useParallax - Parallax au scroll
 */
export const ParallaxExample = () => {
    const imageRef = useRef<HTMLDivElement>(null);

    useParallax(imageRef, 0.5);

    return (
        <div className="h-screen overflow-hidden">
            <div
                ref={imageRef}
                className="w-full h-full bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center"
            >
                <h2 className="text-5xl font-bold text-white">Parallax Effect</h2>
            </div>
        </div>
    );
};

/**
 * Exemple 6: useHoverAnimation - Custom hover animation
 */
export const HoverAnimationExample = () => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useHoverAnimation(
        buttonRef,
        (el) => {
            gsap.to(el, { scale: 1.1, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' });
        },
        (el) => {
            gsap.to(el, { scale: 1, boxShadow: 'none' });
        }
    );

    return (
        <button
            ref={buttonRef}
            className="px-8 py-4 bg-orange-500 text-white font-bold rounded-lg transition-all"
        >
            Hover me
        </button>
    );
};

/**
 * Exemple 7: Combinaison de plusieurs hooks
 */
export const CombinedExample = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Reveal le titre au scroll
    useScrollReveal(titleRef, { start: 'top 70%' });

    // Counter pour les stats
    useCounterAnimation(counterRef, 240, { suffix: '+' });

    // 3D tilt sur la card
    useTiltEffect(cardRef);

    // Parallax sur le container
    useParallax(containerRef, 0.3);

    return (
        <section ref={containerRef} className="min-h-screen py-20">
            <div className="max-w-4xl mx-auto">
                <div ref={titleRef} className="text-5xl font-black mb-12">
                    Section Complète
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div
                        ref={cardRef}
                        className="p-8 bg-white/5 rounded-2xl border border-white/10"
                        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                    >
                        <div ref={counterRef} className="text-6xl font-black text-orange-500">
                            0+
                        </div>
                        <p className="text-slate-400 mt-4">Joueurs Inscrits</p>
                    </div>

                    <div className="p-8 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-slate-300">
                            Tous les hooks peuvent être combinés pour créer des expériences complexes.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

/**
 * Exemple 8: Utiliser directement gsap dans un useGsapAnimation
 */
export const AdvancedTimelineExample = () => {
    const containerRef = useGsapAnimation(() => {
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: 'top 50%',
                scrub: 1,
            },
        });

        timeline
            .fromTo('h2', { opacity: 0, y: 50 }, { opacity: 1, y: 0 }, 0)
            .fromTo('p', { opacity: 0, x: -50 }, { opacity: 1, x: 0 }, 0.2)
            .fromTo('button', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }, 0.4);
    });

    return (
        <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center gap-8">
            <h2 className="text-5xl font-bold">Timeline Animation</h2>
            <p className="text-xl text-slate-300 max-w-2xl text-center">
                Utiliser gsap.timeline() pour des séquences complexes.
            </p>
            <button className="px-8 py-4 bg-orange-500 text-white font-bold rounded-lg">
                Cliquez-moi
            </button>
        </div>
    );
};

/**
 * Showcase: Tous les exemples
 */
export const HooksShowcase = () => {
    return (
        <div className="bg-black text-white min-h-screen">
            <div className="max-w-6xl mx-auto py-20 space-y-20">
                <h1 className="text-7xl font-black">GSAP Hooks Showcase</h1>

                <section>
                    <h2 className="text-3xl font-bold mb-8">1. Simple Animation</h2>
                    <SimpleAnimationExample />
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">2. Scroll Reveal</h2>
                    <ScrollRevealExample />
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">3. Counter</h2>
                    <div className="h-64 flex items-center">
                        <CounterExample />
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">4. Tilt Effect</h2>
                    <div className="flex justify-center">
                        <TiltEffectExample />
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">5. Parallax</h2>
                    <ParallaxExample />
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">6. Hover Animation</h2>
                    <div className="flex justify-center">
                        <HoverAnimationExample />
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">7. Combined Hooks</h2>
                    <CombinedExample />
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-8">8. Advanced Timeline</h2>
                    <AdvancedTimelineExample />
                </section>
            </div>
        </div>
    );
};

export default HooksShowcase;