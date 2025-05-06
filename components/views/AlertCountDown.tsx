"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props = {
  showAlert: boolean;
  timerCount: number;
  handleStopConvesation: () => Promise<void>;
};

const AlertCountDown = ({
  showAlert,
  timerCount,
  handleStopConvesation,
}: Props) => {
  const [startTimer, setStartTimer] = useState(timerCount);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const numberRef = useRef(null);

  const animationRef = useRef<gsap.core.Tween>(null);

  useGSAP(() => {
    if (showAlert) {
      gsap.set(numberRef.current, {
        opacity: 0,
        scale: 2,
        filter: "blur(10px)",
      });
      animationRef.current = gsap.to(numberRef.current, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        //   ease: "power2.out",
        duration: 0.5,
      });

      timerRef.current = setTimeout(() => {
        setStartTimer((prev) => prev - 1);
      }, 1000);
    } else {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTimer, showAlert]);

  useEffect(() => {
    if (showAlert && startTimer === 0) {
      handleStopConvesation();
    }
  }, [startTimer, showAlert, handleStopConvesation]);

  return (
    <>
      {showAlert && (
        <div className="top-0 left-0 w-full h-full absolute flex justify-center items-center bg-overlay-bg">
          <span className="text-4xl font-bold" ref={numberRef}>
            {startTimer}
          </span>
        </div>
      )}
    </>
  );
};

export default AlertCountDown;
