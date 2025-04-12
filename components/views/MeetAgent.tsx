"use client";

import { createTranscriptionAndSave } from "@/lib/actions/meetingActions";
import MeetButtonControls from "@/lib/components/MeetButtonControls";
import { Role, useConversation } from "@11labs/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  prompt?: string;
  callSlug?: string;
};

const MeetAgent = ({ prompt, callSlug }: Props) => {
  const webCamVideo = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);

  const router = useRouter();

  const conversations = useRef<{ message: string; source: Role }[]>([]);

  const handleOnMessage = (message: { message: string; source: Role }) => {
    conversations.current = [...conversations.current, message];
  };

  const performEndCallActions = async () => {
    if (prompt && callSlug) {
      setIsSavingTranscript(true);
      const transcriptRes = await createTranscriptionAndSave(
        conversations.current,
        callSlug
      );
      if (transcriptRes.status !== 200) {
        toast.error(transcriptRes.message);
      } else {
        toast.success(transcriptRes.message);
        setIsSavingTranscript(false);
      }
    }
    router.replace("/");
  };

  const conversation = useConversation({
    onMessage: handleOnMessage,
    onDisconnect: performEndCallActions,
    ...(prompt && {
      overrides: {
        agent: {
          prompt: {
            prompt: prompt,
          },
        },
      },
    }),
  });

  const { status } = conversation;

  useEffect(() => {
    const startWebcam = async () => {
      try {
        if (status === "connected") {
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
  }, [isPermissionGranted, mediaStream, status]);

  useEffect(() => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      videoTrack.onended = async () => {
        await conversation.endSession();
        toast.error("Interview stopped as video feed is not coming");
        router.replace("/");
      };
    }
  }, [mediaStream]);

  useEffect(() => {
    const startAiAgent = async () => {
      if (isPermissionGranted) {
        await conversation.startSession({
          agentId: process.env.NEXT_PUBLIC_LABS_AGENT_ID!,
        });
      }
      // await conversation.startSession({
      //   agentId: process.env.NEXT_PUBLIC_LABS_AGENT_ID!,
      // });
    };

    startAiAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPermissionGranted]);

  useEffect(() => {
    if (micOn) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
    }
  }, [conversation, micOn]);

  const handleStopConvesation = async () => {
    conversation.endSession().then(async () => {
      await performEndCallActions();
    });
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-16 relative">
      <div className="h-[50vh] flex justify-center items-center gap-4 w-full max-md:flex-col max-md:gap-2 max-md:h-[calc(100%-100px)]">
        {status === "connecting" ? (
          <div className="h-full w-full text-2xl text-center flex justify-center items-center">
            Connecting...
          </div>
        ) : status === "connected" ? (
          <>
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
          </>
        ) : status === "disconnected" && isSavingTranscript ? (
          <div className="h-full w-full text-center flex justify-center items-center">
            Creating and Saving Transcripts. Please wait...
          </div>
        ) : (
          <div></div>
        )}
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
