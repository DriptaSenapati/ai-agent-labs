"use client";

import MeetButtonControls from "@/lib/components/MeetButtonControls";
import { useConversation } from "@11labs/react";
import React, { useEffect, useRef, useState } from "react";

const MeetAgent = () => {
  const webCamVideo = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const conversation = useConversation();

  const { isSpeaking, status } = conversation;

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (webCamVideo.current) {
          webCamVideo.current.srcObject = stream;
        }
        setMediaStream(stream);
        if (!isPermissionGranted) {
          setIsPermissionGranted(true);
        }
      } catch (error) {
        console.error("Error accessing webcam", error);
        setIsPermissionGranted(false);
      }
    };

    if (!mediaStream) {
      startWebcam();
    } else {
      if (webCamVideo.current) {
        webCamVideo.current.srcObject = mediaStream;
      }
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isPermissionGranted, mediaStream]);

  useEffect(() => {
    const startAiAgent = async () => {
      if (mediaStream && isPermissionGranted && webCamVideo.current) {
        await conversation.startSession({
          agentId: process.env.NEXT_PUBLIC_LABS_AGENT_ID!,
        });
      }
    };
    startAiAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPermissionGranted, mediaStream]);

  useEffect(() => {
    if (micOn) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
    }
  }, [conversation, micOn]);

  const handleStopConvesation = async () => {
    await conversation.endSession();
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-16 relative">
      <div className="h-[50vh] flex justify-center items-center gap-4 w-full max-md:flex-col max-md:gap-2 max-md:h-[calc(100%-100px)]">
        <div className="h-full w-full bg-black rounded-3xl overflow-hidden">
          <video
            src="/ai_engine_video.mp4"
            className="w-full h-auto max-md:w-auto max-md:h-full"
            loop
            muted
            autoPlay
          />
        </div>
        <div className="h-full w-full bg-muted rounded-3xl relative overflow-hidden">
          <video
            ref={webCamVideo}
            autoPlay
            muted
            className="w-full h-auto absolute left-0 top-0 max-md:w-full max-md:h-auto"
          />
        </div>
      </div>
      <MeetButtonControls
        mediaStream={mediaStream}
        micOn={micOn}
        setMediaStream={setMediaStream}
        setMicOn={setMicOn}
        handleStopConvesation={handleStopConvesation}
      />
    </div>
  );
};

export default MeetAgent;
