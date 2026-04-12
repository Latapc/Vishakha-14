/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Gift, 
  Stars, 
  Cake, 
  Music, 
  Camera, 
  Sparkles, 
  ChevronDown,
  PartyPopper,
  Quote,
  Volume2,
  VolumeX
} from 'lucide-react';

const REASONS = [
  "Your infectious laughter that brightens everyone's day.",
  "The way you always know how to make people feel special.",
  "Your incredible creativity and unique perspective.",
  "How you're always there for your friends, no matter what.",
  "Your determination to follow your dreams.",
  "The kindness you show to everyone you meet.",
  "Your amazing sense of style and self-expression.",
  "The way you can turn any boring moment into an adventure.",
  "Your curiosity and love for learning new things.",
  "How you're not afraid to be exactly who you are.",
  "Your resilience and strength through every challenge.",
  "The way you inspire others to be better versions of themselves.",
  "Your thoughtful and caring nature.",
  "Simply because you are YOU, and that's more than enough."
];

const FloatingElement = ({ children, delay = 0, duration = 6 }: { children: React.ReactNode, delay?: number, duration?: number }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

const SparkleEffect = () => {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSparkle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2
      };
      setSparkles(prev => [...prev.slice(-20), newSparkle]);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="sparkle absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              backgroundColor: '#f472b6'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Countdown = ({ targetDate, onComplete }: { targetDate: Date, onComplete?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const checkTime = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        if (onComplete) onComplete();
        return true;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
      return false;
    };

    if (checkTime()) return;

    const timer = setInterval(() => {
      if (checkTime()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex gap-3 md:gap-6 justify-center">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds }
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-16 h-16 md:w-24 md:h-24 glass rounded-2xl flex items-center justify-center mb-3 border border-birthday-accent/20 shadow-lg shadow-purple-900/10"
          >
            <div className="font-display text-3xl md:text-5xl font-black text-birthday-accent">
              {item.value === 0 ? '!!' : item.value.toString().padStart(2, '0')}
            </div>
          </motion.div>
          <div className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const BackgroundMusic = ({ videoId }: { videoId: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-3 rounded-full glass shadow-lg text-birthday-accent flex items-center gap-2 group"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        <span className="text-xs font-serif italic pr-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">
          {isPlaying ? 'Music On' : 'Play Music'}
        </span>
      </motion.button>
      {isPlaying && (
        <iframe
          className="hidden"
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`}
          allow="autoplay"
        />
      )}
    </div>
  );
};

const BirthdayContent = ({ birthdayDate }: { birthdayDate: Date }) => {
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  useEffect(() => {
    const end = Date.now() + (3 * 1000);
    const colors = ['#a855f7', '#c084fc', '#d4af37'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen selection:bg-purple-200 selection:text-purple-900 text-slate-100">
      <SparkleEffect />

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <motion.div 
          style={{ opacity, scale }}
          className="text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="font-serif italic text-xl md:text-2xl text-birthday-accent mb-4 block">
              A Special Celebration for
            </span>
            <h1 className="font-display text-6xl md:text-9xl font-black text-black dark:text-white leading-none mb-6">
              VISHAKHA <span className="text-birthday-accent">14</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center justify-center gap-4 text-black dark:text-slate-400">
              <div className="h-px w-12 bg-birthday-accent/30" />
              <p className="font-serif text-lg tracking-widest uppercase">Happy Birthday • April 30</p>
              <div className="h-px w-12 bg-birthday-accent/30" />
            </div>
            
            <div className="font-display text-2xl text-birthday-accent font-bold mt-4">
              THE WAIT IS OVER! ✨
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4">
            <FloatingElement delay={0}><Heart className="text-purple-300 w-8 h-8" /></FloatingElement>
          </div>
          <div className="absolute top-1/3 right-1/4">
            <FloatingElement delay={1}><Stars className="text-yellow-400 w-10 h-10" /></FloatingElement>
          </div>
          <div className="absolute bottom-1/4 left-1/3">
            <FloatingElement delay={2}><Sparkles className="text-purple-400 w-6 h-6" /></FloatingElement>
          </div>
          <div className="absolute bottom-1/3 right-1/3">
            <FloatingElement delay={1.5}><Cake className="text-birthday-accent w-12 h-12" /></FloatingElement>
          </div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-birthday-accent/50"
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* Message Section */}
      <section className="py-24 px-4 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="glass p-12 rounded-[40px] relative"
        >
          <Quote className="absolute -top-6 left-1/2 -translate-x-1/2 text-birthday-accent w-12 h-12 fill-birthday-accent/10" />
          <h2 className="font-display text-4xl md:text-5xl mb-8 text-black dark:text-white">To My Dearest Vishakha</h2>
          <p className="font-serif text-xl md:text-2xl leading-relaxed text-purple-900 dark:text-purple-300 italic">
            "Today is not just another day. It's the day the world became a little brighter because you were born. 
            Turning 14 is a beautiful milestone—the bridge between childhood and the amazing person you are becoming. 
            I'm so excited for 6:35 AM on April 30th to celebrate the exact moment you arrived!"
          </p>
        </motion.div>
      </section>

      {/* 14 Reasons Section */}
      <section className="py-24 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-6xl text-black dark:text-white mb-4">14 Reasons Why</h2>
            <p className="font-serif text-xl text-black dark:text-slate-400 italic">You are absolutely incredible</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REASONS.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-purple-100 dark:border-slate-700 flex gap-4"
              >
                <span className="font-display text-4xl text-birthday-accent/20 font-bold shrink-0">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="text-black dark:text-slate-300 font-medium leading-relaxed pt-2">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Virtual Gift Section */}
      <section className="py-32 px-4 text-center overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl mb-12 text-black dark:text-white">A Little Surprise For You</h2>
          
          <div className="relative h-64 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isGiftOpen ? (
                <motion.button
                  key="gift"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, rotate: 45, opacity: 0 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsGiftOpen(true)}
                  className="relative z-10"
                >
                  <div className="bg-birthday-accent p-8 rounded-3xl shadow-xl shadow-purple-200 dark:shadow-purple-900/20 relative">
                    <Gift size={80} className="text-white" />
                    <div className="absolute -top-4 -right-4 bg-yellow-400 p-3 rounded-full shadow-lg">
                      <Sparkles className="text-white" size={24} />
                    </div>
                  </div>
                  <p className="mt-6 font-serif italic text-lg text-birthday-accent animate-pulse">Click to open!</p>
                </motion.button>
              ) : (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="glass p-10 rounded-[40px] border-2 border-birthday-accent/30"
                >
                  <PartyPopper className="mx-auto mb-6 text-birthday-accent w-16 h-16" />
                  <h3 className="font-display text-3xl mb-4 text-black dark:text-white">Surprise!</h3>
                  <p className="font-serif text-xl text-indigo-900 dark:text-indigo-300 italic mb-6">
                    "This website is just a small token of how much you mean to me. 
                    I hope your 14th year is your best one yet!"
                  </p>
                  <button 
                    onClick={() => setIsGiftOpen(false)}
                    className="text-birthday-accent font-serif italic hover:underline"
                  >
                    Close and open again?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-4 text-center border-t border-purple-100 dark:border-slate-700">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Music className="mx-auto mb-8 text-birthday-accent/30 w-12 h-12" />
          <h2 className="font-display text-4xl mb-4 text-black dark:text-white">Happy Birthday, Vishakha!</h2>
          <p className="font-serif text-lg text-black dark:text-slate-400 tracking-widest uppercase mb-12">To the best 14-year-old in the world</p>
          
          <div className="flex justify-center gap-6 mb-12">
            <motion.div whileHover={{ scale: 1.2 }} className="text-birthday-accent"><Heart fill="currentColor" /></motion.div>
            <motion.div whileHover={{ scale: 1.2 }} className="text-birthday-accent"><Stars fill="currentColor" /></motion.div>
            <motion.div whileHover={{ scale: 1.2 }} className="text-birthday-accent"><Sparkles fill="currentColor" /></motion.div>
          </div>

          <p className="text-black text-sm font-serif italic">Made with love for a special friend</p>
        </motion.div>
      </footer>
    </div>
  );
};

export default function App() {
  const birthdayDate = new Date(Date.now() + 30000);
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (!isBirthday) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-birthday-dark px-4 overflow-y-auto py-12">
        <SparkleEffect />
        <BackgroundMusic videoId="6OJH6zErltk" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 glass p-10 md:p-16 rounded-[40px] md:rounded-[60px] max-w-xl w-full my-auto"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="inline-block mb-12"
          >
            <Gift size={80} strokeWidth={1.5} className="text-birthday-accent" />
          </motion.div>
          
          <h1 className="font-display text-5xl md:text-6xl font-black text-birthday-accent mb-8 tracking-tight">
            A Surprise<br />Awaits...
          </h1>
          <p className="font-serif text-xl text-slate-400 italic mb-12 leading-relaxed px-4">
            Vishakha, your special 14th birthday gift is currently locked. 
            It will reveal itself exactly at 6:35 AM on April 30th!
          </p>
          
          <div className="h-px w-3/4 mx-auto bg-birthday-accent/10 mb-12" />
          
          <Countdown targetDate={birthdayDate} onComplete={() => setIsBirthday(true)} />
          
          <p className="mt-12 text-slate-600 text-sm font-serif italic tracking-wide">
            Counting down to the magic...
          </p>
        </motion.div>

        {/* Floating background elements for the locked screen */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-10 left-10"><FloatingElement delay={0}><Heart className="text-purple-200" /></FloatingElement></div>
          <div className="absolute bottom-10 right-10"><FloatingElement delay={1}><Stars className="text-yellow-200" /></FloatingElement></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackgroundMusic videoId="6OJH6zErltk" />
      <BirthdayContent birthdayDate={birthdayDate} />
    </>
  );
}
