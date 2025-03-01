"use client";
import { cva } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import { Music } from "lucide-react";

import { cn } from "@/lib/utils";

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md"
);

const Dock = React.forwardRef(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DockIcon) {
          return React.cloneElement(child, {
            ...child.props,
            mouseX: mouseX,
            size: iconSize,
            magnification: iconMagnification,
            distance: iconDistance,
          });
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </motion.div>
    );
  }
);

Dock.displayName = "Dock";

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  onClick,
  ...props
}) => {
  const ref = useRef(null);
  const padding = Math.max(6, size * 0.2);
  const defaultMouseX = useMotionValue(Infinity);

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size]
  );

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize, padding }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

const MusicPlayer = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicNotes, setMusicNotes] = useState([]);
  const audioRef = useRef(null);

  // Generate a random music note that will float away
  const createMusicNote = () => {
    const id = Math.random().toString(36).substring(2, 9);
    const size = Math.floor(Math.random() * 8) + 8; // 8-16px size
    const left = Math.random() * 60 - 30; // -30px to +30px from center
    const delay = Math.random() * 0.5;

    return { id, size, left, delay };
  };

  useEffect(() => {
    if (!isPlaying) return;

    // Create floating music notes at intervals when music is playing
    const interval = setInterval(() => {
      setMusicNotes((prev) => {
        const newNotes = [...prev, createMusicNote()];
        // Keep only the last 6 notes to avoid too many animations
        return newNotes.slice(-6);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Remove notes after they've animated
  useEffect(() => {
    if (musicNotes.length > 0) {
      const timeout = setTimeout(() => {
        setMusicNotes((prev) => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [musicNotes]);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://stream.zeno.fm/0r0xa792kwzuv");
      audioRef.current.volume = 1;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <DockIcon onClick={toggleMusic} className={cn("relative", className)}>
      <Music className="text-white" size={24} />

      {/* Floating music notes */}
      {musicNotes.map((note) => (
        <motion.div
          key={note.id}
          className="absolute pointer-events-none"
          initial={{
            opacity: 0.8,
            scale: 0.8,
            y: 0,
            x: note.left,
          }}
          animate={{
            opacity: 0,
            scale: 0.5,
            y: -60,
            x: note.left + (Math.random() * 20 - 10),
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: note.delay,
          }}
          style={{
            zIndex: 50,
          }}
        >
          <Music size={note.size} className="text-white" />
        </motion.div>
      ))}
    </DockIcon>
  );
};

MusicPlayer.displayName = "MusicPlayer";

export { Dock, DockIcon, dockVariants, MusicPlayer };
