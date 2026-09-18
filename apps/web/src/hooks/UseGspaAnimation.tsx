import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook personnalisé pour animations GSAP avec ScrollTrigger
 * Handles context cleanup automatiquement
 */
export const useGsapAnimation = (
    callback: (ctx: gsap.Context) => void,
    dependencies: React.DependencyList = []
) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(callback, containerRef.current);

        return () => {
            ctx.revert();
        };
    }, dependencies);

    return containerRef;
};

/**
 * Hover animation helper
 */
export const useHoverAnimation = (
    target: HTMLElement | React.RefObject<any>,
    onEnter?: (el: HTMLElement) => gsap.core.Timeline | void,
    onLeave?: (el: HTMLElement) => gsap.core.Timeline | void
) => {
    const element = target instanceof HTMLElement ? target : target.current;

    useEffect(() => {
        if (!element) return;

        element.addEventListener('mouseenter', () => {
            onEnter?.(element);
        });

        element.addEventListener('mouseleave', () => {
            onLeave?.(element);
        });

        return () => {
            element.removeEventListener('mouseenter', () => { });
            element.removeEventListener('mouseleave', () => { });
        };
    }, [element, onEnter, onLeave]);
};

/**
 * Scroll reveal animation
 */
export const useScrollReveal = (
    target: React.RefObject<any>,
    config?: {
        start?: string;
        end?: string;
        scrub?: number;
        delay?: number;
    }
) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!target.current || !containerRef.current) return;

        const defaultConfig = {
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1.5,
            delay: 0,
            ...config,
        };

        gsap.fromTo(
            target.current,
            {
                opacity: 0,
                y: 60,
                filter: 'blur(10px)',
            },
            {
                scrollTrigger: {
                    trigger: target.current,
                    start: defaultConfig.start,
                    end: defaultConfig.end,
                    scrub: defaultConfig.scrub,
                },
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.8,
                delay: defaultConfig.delay,
                ease: 'back.out(1.5)',
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.trigger === target.current) {
                    trigger.kill();
                }
            });
        };
    }, [target, config]);

    return containerRef;
};

/**
 * Number counter animation (pour les stats)
 */
export const useCounterAnimation = (
    target: React.RefObject<any>,
    finalValue: number,
    config?: {
        duration?: number;
        ease?: string;
        start?: string;
        suffix?: string;
    }
) => {
    useEffect(() => {
        if (!target.current) return;

        const defaultConfig = {
            duration: 2.5,
            ease: 'expo.out',
            start: 'top 75%',
            suffix: '',
            ...config,
        };

        ScrollTrigger.create({
            trigger: target.current,
            start: defaultConfig.start,
            onEnter: () => {
                gsap.fromTo(
                    { value: 0 },
                    { value: finalValue },
                    {
                        duration: defaultConfig.duration,
                        ease: defaultConfig.ease,
                        onUpdate: function () {
                            if (target.current) {
                                const displayValue = Math.floor(this.targets()[0].value);
                                target.current.textContent =
                                    displayValue + defaultConfig.suffix;
                            }
                        },
                    }
                );
            },
            once: true,
        });

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => {
                trigger.kill();
            });
        };
    }, [target, finalValue, config]);
};

/**
 * 3D tilt effect sur hover
 */
export const useTiltEffect = (
    target: React.RefObject<any>,
    intensity: number = 1
) => {
    useEffect(() => {
        if (!target.current) return;

        const element = target.current;

        element.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width) * 30 - 15;
            const yPercent = (y / rect.height) * 30 - 15;

            gsap.to(element, {
                rotationY: xPercent * 0.5 * intensity,
                rotationX: -yPercent * 0.5 * intensity,
                transformPerspective: 1200,
                duration: 0.3,
                ease: 'power1.out',
                overwrite: false,
            });
        });

        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                rotationY: 0,
                rotationX: 0,
                duration: 0.4,
                ease: 'power2.out',
            });
        });

        return () => {
            element.removeEventListener('mousemove', () => { });
            element.removeEventListener('mouseleave', () => { });
        };
    }, [target, intensity]);
};

/**
 * Parallax effect sur scroll
 */
export const useParallax = (
    target: React.RefObject<any>,
    speed: number = 0.5
) => {
    useEffect(() => {
        if (!target.current) return;

        gsap.to(target.current, {
            y: (_i, el) => {
                // Calculé au trigger enter
                return (1 - speed) * (innerHeight + el.offsetHeight) * 0.5;
            },
            scrollTrigger: {
                trigger: target.current,
                scrub: 1,
                markers: false,
            },
            ease: 'none',
        });

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => {
                if (trigger.trigger === target.current) {
                    trigger.kill();
                }
            });
        };
    }, [target, speed]);
};

/**
 * Timeline-based animation
 */
export const useTimeline = (
    callback: (timeline: gsap.core.Timeline) => void,
    dependencies: React.DependencyList = []
) => {
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const timeline = gsap.timeline();
        timelineRef.current = timeline;

        callback(timeline);

        return () => {
            timeline.kill();
        };
    }, dependencies);

    return timelineRef;
};

/**
 * Stagger animation helper
 */
export const createStaggerAnimation = (
    elements: (HTMLElement | null)[],
    fromConfig: gsap.TweenVars,
    toConfig: gsap.TweenVars,
    staggerAmount: number = 0.1
) => {
    const validElements = elements.filter((el) => el !== null) as HTMLElement[];

    return gsap.fromTo(
        validElements,
        fromConfig,
        {
            ...toConfig,
            stagger: staggerAmount,
        }
    );
};