"use client";

import { createTranscriptionAndSave } from "@/lib/actions/meetingActions";
import MeetButtonControls from "@/lib/components/MeetButtonControls";
import { Role, useConversation } from "@11labs/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import io, { Socket } from "socket.io-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import AlertCountDown from "./AlertCountDown";

type Props = {
  prompt?: string;
  callSlug?: string;
  imageKey?: string;
};

const MeetAgent = ({ prompt, callSlug, imageKey }: Props) => {
  const webCamVideo = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const socketRef = useRef<SocketIOClient.Socket>(null);
  const intervalRef = useRef<NodeJS.Timeout>(null);
  const router = useRouter();
  const [showNoIdentityAlert, setShowNoIdentityAlert] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (mediaStream && status === "connected" && imageKey) {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL!, {
        path: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
      });

      socketRef.current = socket;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      intervalRef.current = setInterval(() => {
        if (!webCamVideo.current || !ctx) return;

        canvas.width = webCamVideo.current.videoWidth;
        canvas.height = webCamVideo.current.videoHeight;

        ctx.drawImage(webCamVideo.current, 0, 0);
        const frame = canvas.toDataURL("image/jpeg");

        socket.emit("identity-matching-request", {
          source: frame,
          target: {
            Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
            Name: imageKey,
          },
        });

        socket.on(
          "identity-matching-response",
          (data: { success: boolean; data: any; message: string }) => {
            if (!data.success) {
              if (!showNoIdentityAlert) setShowNoIdentityAlert(true);
            }
            if (data.success) {
              if (showNoIdentityAlert) setShowNoIdentityAlert(false);
            }
          }
        );
      }, 100);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [imageKey, mediaStream, showNoIdentityAlert, status]);

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
            <div className="h-full w-full bg-muted rounded-3xl overflow-hidden relative">
              <video
                ref={webCamVideo}
                autoPlay
                muted
                className="w-full h-auto transform translate-y-[-10%] max-md:w-full max-md:h-auto"
              />
              {showNoIdentityAlert && (
                <AlertCountDown
                  showAlert={showNoIdentityAlert}
                  timerCount={10}
                  handleStopConvesation={handleStopConvesation}
                />
              )}
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
      {showNoIdentityAlert && (
        <div className="absolute bottom-[30px] left-[10px] z-[9999] max-md:left-[50%] max-md:translate-x-[-50%] max-md:w-[95%] max-md:top-[30px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Candidate not found</AlertTitle>
            <AlertDescription>
              Please be on camera within 10 seconds otherwise interview will be
              cancelled
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MeetAgent;
